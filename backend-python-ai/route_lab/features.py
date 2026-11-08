"""Explainable, city-scale route signals. These are observations, not danger judgments."""
from dataclasses import dataclass
import math

FEATURE_NAMES = ("route_offset_m", "speed_kph", "stationary_seconds", "offset_change_m")
MAX_ACCURACY_M = 60.0
MAX_GAP_SECONDS = 20.0
MAX_AGE_SECONDS = 30.0
DEVIATION_M = 300.0
DEVIATION_SECONDS = 30.0
STOP_SECONDS = 90.0


@dataclass(frozen=True)
class Point:
    lat: float
    lng: float


@dataclass(frozen=True)
class Sample(Point):
    timestamp: float
    speed_kph: float
    accuracy_m: float


def _valid_point(point):
    return (math.isfinite(point.lat) and math.isfinite(point.lng)
            and -85 <= point.lat <= 85 and -180 <= point.lng <= 180)


def distance_m(a, b):
    # Local projection: deliberately limited to city-sized, non-polar routes.
    scale = 111_320.0
    return math.hypot((a.lng - b.lng) * scale * math.cos(math.radians((a.lat + b.lat) / 2)),
                      (a.lat - b.lat) * scale)


def route_offset_m(point, route):
    """Distance to the nearest segment of a planned polyline, not pickup→dropoff."""
    best = math.inf
    for a, b in zip(route, route[1:]):
        scale_x = 111_320 * math.cos(math.radians(a.lat))
        px, py = (point.lng - a.lng) * scale_x, (point.lat - a.lat) * 111_320
        bx, by = (b.lng - a.lng) * scale_x, (b.lat - a.lat) * 111_320
        length_sq = bx * bx + by * by
        t = max(0.0, min(1.0, (px * bx + py * by) / length_sq)) if length_sq else 0.0
        best = min(best, math.hypot(px - t * bx, py - t * by))
    return best


def _valid_sample(sample):
    values = (sample.timestamp, sample.speed_kph, sample.accuracy_m)
    return (_valid_point(sample) and all(math.isfinite(x) for x in values)
            and sample.timestamp > 0 and 0 <= sample.speed_kph <= 180
            and 0 < sample.accuracy_m <= MAX_ACCURACY_M)


def assess_route(route, samples, as_of):
    """Use only a contiguous, fresh, accurate sample suffix; quality failures reset timers.

    Thresholds are illustrative prototype choices, not validated safety thresholds.
    No external calls, writes, notifications, vehicle control, or personal profiling.
    """
    out = {
        "status": "insufficient_data", "headline": "Waiting for usable location data",
        "summary": "Unable to assess the route. No conclusion about safety can be made.",
        "quality": "limited", "qualityReason": None, "features": None,
        "offsetMeters": None, "deviationSeconds": 0, "stationarySeconds": 0,
        "accuracyMeters": None, "speedKph": None, "warnings": [],
        "automaticActions": False,
    }
    if len(route) < 2 or any(not _valid_point(p) for p in route):
        out["qualityReason"] = "A valid planned route is required."
        return out
    if any(distance_m(route[0], p) > 20_000 for p in route):
        out["qualityReason"] = "This prototype only supports city-scale routes within 20 km."
        return out
    if not samples or not math.isfinite(as_of):
        out["qualityReason"] = "No location samples are available."
        return out
    last = samples[-1]
    if not _valid_sample(last):
        out["qualityReason"] = "Location is missing, invalid, or less accurate than ±60 m."
        return out
    out.update(accuracyMeters=round(last.accuracy_m), speedKph=round(last.speed_kph, 1))
    if as_of - last.timestamp > MAX_AGE_SECONDS or last.timestamp > as_of + 5:
        out["qualityReason"] = "Location is stale or its timestamp is in the future."
        return out
    if any(b.timestamp <= a.timestamp for a, b in zip(samples, samples[1:])):
        out["qualityReason"] = "Location timestamps must increase without duplicates."
        return out
    chain = [last]
    for sample in reversed(samples[:-1]):
        if not _valid_sample(sample) or chain[-1].timestamp - sample.timestamp > MAX_GAP_SECONDS:
            break
        chain.append(sample)
    chain.reverse()
    if len(chain) < 3:
        out["qualityReason"] = "Collecting at least three consecutive usable samples."
        return out
    offsets = [route_offset_m(sample, route) for sample in chain]
    offset = offsets[-1]
    deviation_start = last.timestamp
    for sample, delta in reversed(list(zip(chain, offsets))):
        if delta < DEVIATION_M:
            break
        deviation_start = sample.timestamp
    stop_start = last.timestamp
    for sample in reversed(chain):
        if sample.speed_kph > 3 or distance_m(last, sample) > 35:
            break
        stop_start = sample.timestamp
    deviation = last.timestamp - deviation_start
    stationary = last.timestamp - stop_start
    features = {
        "route_offset_m": round(offset, 2), "speed_kph": last.speed_kph,
        "stationary_seconds": stationary,
        "offset_change_m": round(offset - offsets[max(0, len(offsets) - 7)], 2),
    }
    warnings = []
    if deviation >= DEVIATION_SECONDS:
        warnings.append({"type": "route_deviation", "title": "Sustained route deviation",
                         "detail": f"At least {DEVIATION_M:.0f} m from the sample route for {deviation:.0f} seconds."})
    if stationary >= STOP_SECONDS:
        warnings.append({"type": "extended_stop", "title": "An extended stop",
                         "detail": f"Nearly stationary for {stationary:.0f} seconds. Traffic or a planned stop can explain this."})
    out.update(
        status="check_in" if warnings else "no_warning", quality="good", qualityReason=None,
        headline="A check-in may help" if warnings else "No warning detected",
        summary=("An unusual movement pattern is not proof of danger. Check the route and ask for context."
                 if warnings else "Current samples do not meet the warning rules. This is not a guarantee of safety."),
        offsetMeters=round(offset), deviationSeconds=round(deviation), stationarySeconds=round(stationary),
        warnings=warnings, features=features,
    )
    return out
