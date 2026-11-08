"""Fixed, wholly synthetic GPS scenarios. No real driver, passenger, or trip records."""
from dataclasses import asdict
import math
from .features import Point, Sample, distance_m

PLAN = [Point(23.020, 72.553), Point(23.023, 72.553), Point(23.023, 72.557),
        Point(23.026, 72.557), Point(23.026, 72.564), Point(23.030, 72.564),
        Point(23.030, 72.571), Point(23.034, 72.571)]
SCENARIOS = {
    "typical": {"name": "Typical ride", "description": "Small GPS variation along the planned route.", "focusIndex": 18},
    "detour": {"name": "A route detour", "description": "A persistent deviation. It could be an ordinary diversion.", "focusIndex": 27},
    "stop": {"name": "An extended stop", "description": "A longer pause. Traffic and planned stops are possible explanations.", "focusIndex": 28},
    "weak_gps": {"name": "Weak GPS signal", "description": "Poor accuracy pauses assessment instead of suggesting danger.", "focusIndex": 22},
}
SAMPLE_COUNT = 49
BASE_TIME = 1_800_000_000.0  # a simulation clock; never compared to a real ride's clock


def _along_route(progress):
    lengths = [distance_m(a, b) for a, b in zip(PLAN, PLAN[1:])]
    target = progress * sum(lengths)
    for a, b, length in zip(PLAN, PLAN[1:], lengths):
        if target <= length:
            t = target / length
            return Point(a.lat + t * (b.lat - a.lat), a.lng + t * (b.lng - a.lng))
        target -= length
    return PLAN[-1]


def samples_for(scenario):
    if scenario not in SCENARIOS:
        raise KeyError(scenario)
    samples = []
    for i in range(SAMPLE_COUNT):
        route_index = i
        if scenario == "stop":
            route_index = min(i, 17) if i <= 33 else i - 16
        point = _along_route(route_index / (SAMPLE_COUNT - 1))
        lat, lng = point.lat + math.sin(i * 1.1) * 0.000025, point.lng + math.cos(i) * 0.000025
        if scenario == "detour" and 15 <= i <= 36:
            shift = min(1.0, (i - 15) / 4, (36 - i) / 4) * 0.014
            lng -= max(0, shift)
        if scenario == "stop" and 17 <= i <= 33:
            fixed = _along_route(17 / (SAMPLE_COUNT - 1))
            lat, lng = fixed.lat, fixed.lng
        accuracy = 180.0 if scenario == "weak_gps" and 16 <= i <= 31 else 8.0
        speed = distance_m(Point(lat, lng), samples[-1]) / 10 * 3.6 if samples else 22.0
        samples.append(Sample(lat=lat, lng=lng, timestamp=BASE_TIME + i * 10,
                              speed_kph=min(speed, 160), accuracy_m=accuracy))
    return samples


def scenario_payload(key):
    samples = samples_for(key)
    return {"id": key, **SCENARIOS[key], "plannedRoute": [asdict(p) for p in PLAN],
            "samples": [asdict(p) for p in samples], "sampleSeconds": 10,
            "source": "synthetic", "tripLabel": "Practice ride · Ahmedabad"}
