"""Isolated Route Lab tests. No real rides, location collection, API keys or alerts."""
from dataclasses import replace
import json
import math
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest
from route_lab.api import app
from route_lab.features import Point, Sample, assess_route, route_offset_m, FEATURE_NAMES
from route_lab.model import DemoModel
from route_lab.scenarios import PLAN, SCENARIOS, SAMPLE_COUNT, samples_for

client = TestClient(app)


def test_preview_has_no_live_or_emergency_endpoints():
    health = client.get('/api/preview/health').json()
    assert health['environment'] == 'synthetic-preview'
    assert health['acceptsLiveGps'] is False
    assert health['automaticActions'] is False
    for path in ('/api/agent', '/api/emergency', '/api/bookings', '/api/location/share'):
        assert client.post(path, json={}).status_code == 404


@pytest.mark.parametrize('key,expected', [('typical', 'no_warning'), ('detour', 'check_in'),
                                         ('stop', 'check_in'), ('weak_gps', 'insufficient_data')])
def test_scenario_observations_are_honest_and_explainable(key, expected):
    response = client.post('/api/preview/analyze', json={'scenario': key, 'sampleIndex': SCENARIOS[key]['focusIndex']})
    assert response.status_code == 200
    data = response.json()
    assert data['isDemo'] is True
    assert data['assessment']['status'] == expected
    assert data['assessment']['automaticActions'] is False
    assert 'police dispatched' not in response.text.lower()
    if key == 'detour':
        assert data['assessment']['offsetMeters'] >= 300
        assert data['assessment']['deviationSeconds'] >= 30
    if key == 'stop':
        assert data['assessment']['stationarySeconds'] >= 90
    if key == 'weak_gps':
        assert data['assessment']['features'] is None
        assert data['ml']['available'] is False
        assert data['ml']['score'] is None


def test_api_rejects_live_gps_and_bad_input():
    assert client.post('/api/preview/analyze', json={'scenario': 'typical', 'sampleIndex': 18,
                                                   'latitude': 23, 'longitude': 72}).status_code == 422
    for index in (-1, SAMPLE_COUNT, 10000000, 1.5, True, '18'):
        assert client.post('/api/preview/analyze', json={'scenario': 'typical', 'sampleIndex': index}).status_code == 422
    assert client.post('/api/preview/analyze', json={'scenario': 'not-a-scenario', 'sampleIndex': 3}).status_code == 404


def test_planned_route_uses_polyline_not_straight_pickup_dropoff():
    route = [Point(23, 72), Point(23, 72.01), Point(23.01, 72.01)]
    assert route_offset_m(route[1], route) == pytest.approx(0)
    # The corner is hundreds of metres from the diagonal, but on the real polyline.
    assert route_offset_m(Point(23.005, 72.005), route) > 400


def test_degenerate_segments_do_not_divide_by_zero():
    route = [Point(23, 72), Point(23, 72), Point(23, 72.01)]
    assert route_offset_m(Point(23, 72.005), route) == pytest.approx(0)


def off_route_samples(count=5):
    return [Sample(23.006, 72, 1000 + i * 10, 15, 8) for i in range(count)]


def test_deviation_needs_contiguous_duration():
    route = [Point(23, 72), Point(23, 72.01)]
    samples = off_route_samples()
    assert assess_route(route, samples[:3], samples[2].timestamp)['warnings'] == []
    assert assess_route(route, samples[:4], samples[3].timestamp)['warnings'][0]['type'] == 'route_deviation'
    # A gap resets the timer rather than treating missing data as a continued event.
    samples = [samples[0], *[replace(s, timestamp=s.timestamp + 60) for s in samples[1:]]]
    assert assess_route(route, samples[:4], samples[3].timestamp)['warnings'] == []


def test_bad_accuracy_resets_persistence_and_does_not_confirm_safety():
    route = [Point(23, 72), Point(23, 72.01)]
    samples = off_route_samples(8)
    samples[3] = replace(samples[3], accuracy_m=200)
    a = assess_route(route, samples[:4], samples[3].timestamp)
    assert a['status'] == 'insufficient_data' and a['features'] is None
    assert assess_route(route, samples[:7], samples[6].timestamp)['warnings'] == []
    assert assess_route(route, samples, samples[-1].timestamp)['warnings']


@pytest.mark.parametrize('change', [dict(lat=math.nan), dict(lng=math.inf), dict(lat=91),
                                    dict(speed_kph=-1), dict(accuracy_m=0), dict(accuracy_m=100),
                                    dict(timestamp=math.nan)])
def test_invalid_sensor_data_cannot_produce_ml_features(change):
    samples = samples_for('typical')[:10]
    samples[-1] = replace(samples[-1], **change)
    result = assess_route(PLAN, samples, as_of=1_800_000_090)
    assert result['status'] == 'insufficient_data'
    assert result['features'] is None


def test_stale_future_duplicate_and_unordered_samples_are_unknown():
    samples = samples_for('typical')[:10]
    now = samples[-1].timestamp
    for altered, as_of in [(samples, now + 31), (samples, now - 6),
                           (samples + [samples[-1]], now), (list(reversed(samples)), now)]:
        assert assess_route(PLAN, altered, as_of)['status'] == 'insufficient_data'


def test_unusable_or_non_city_route_is_unknown():
    samples = samples_for('typical')[:10]
    for route in ([], [PLAN[0]], [Point(math.inf, 1), Point(23, 72)], [Point(23, 72), Point(24, 72)]):
        assert assess_route(route, samples, samples[-1].timestamp)['status'] == 'insufficient_data'


def test_stop_requires_low_speed_and_same_place():
    route = [Point(23, 72), Point(23.01, 72)]
    samples = [Sample(23 + i * .00008, 72, 1000 + i * 10, 2, 8) for i in range(15)]
    assert not assess_route(route, samples, samples[-1].timestamp)['warnings']
    stopped = [Sample(23, 72, 1000 + i * 10, 0, 8) for i in range(11)]
    result = assess_route(route, stopped, stopped[-1].timestamp)
    assert result['stationarySeconds'] == 100
    assert result['warnings'][0]['type'] == 'extended_stop'


def test_missing_or_broken_model_does_not_disable_rule_api(tmp_path, monkeypatch):
    import route_lab.api as api
    model = DemoModel(tmp_path)
    monkeypatch.setattr(api, 'model', model)
    data = client.post('/api/preview/analyze', json={'scenario': 'stop', 'sampleIndex': 28}).json()
    assert data['assessment']['status'] == 'check_in'
    assert data['ml']['available'] is False
    (tmp_path / 'report.json').write_text('not json')
    assert DemoModel(tmp_path).status()['available'] is False


def test_prediction_errors_do_not_break_rules(tmp_path, monkeypatch):
    import route_lab.api as api
    model = DemoModel(tmp_path)
    def broken(_):
        raise ValueError('model failed')
    model.bundle = {'pipeline': SimpleNamespace(decision_function=broken), 'threshold': 0}
    monkeypatch.setattr(api, 'model', model)
    data = client.post('/api/preview/analyze', json={'scenario': 'detour', 'sampleIndex': 27}).json()
    assert data['assessment']['status'] == 'check_in'
    assert data['ml']['available'] is False


def test_native_origins_have_cors_but_unknown_origins_do_not():
    for origin in ('capacitor://localhost', 'https://localhost', 'http://localhost'):
        response = client.options('/api/preview/analyze', headers={'Origin': origin,
            'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type'})
        assert response.status_code == 200
        assert response.headers['access-control-allow-origin'] == origin
    response = client.get('/api/preview/health', headers={'Origin': 'https://untrusted.invalid'})
    assert 'access-control-allow-origin' not in response.headers


def test_training_is_reproducible_trip_separated_and_explicitly_synthetic(tmp_path):
    pytest.importorskip('sklearn')
    from route_lab.train import train
    first = train(tmp_path / 'first', seed=42)
    second = train(tmp_path / 'second', seed=42)
    assert first['testMetrics'] == second['testMetrics']
    assert first['threshold'] == pytest.approx(second['threshold'])
    split = first['splitTripIds']
    assert not set(split['train']) & set(split['calibration'])
    assert not set(split['train']) & set(split['test'])
    assert not set(split['calibration']) & set(split['test'])
    assert set(split['train'] + split['calibration'] + split['test']) == set(range(first['tripCount']))
    assert first['dataScope'] == 'synthetic-demo-only'
    assert first['productionReady'] is False
    assert tuple(first['features']) == FEATURE_NAMES
    assert first['limitations']
    model = DemoModel(tmp_path / 'first')
    assert model.bundle is not None
    response = model.score({'route_offset_m': 15, 'speed_kph': 25, 'stationary_seconds': 0, 'offset_change_m': 1})
    assert response['available'] and response['isProbability'] is False
    assert response['productionReady'] is False
    assert model.score(None)['available'] is False
    # Wrong dependency version or a real-data artifact must fail closed, not auto-load.
    for modification in ({'sklearnVersion': '0.0.0'}, {'dataScope': 'real-rides'}, {'productionReady': True}):
        (tmp_path / 'first' / 'report.json').write_text(json.dumps({**first, **modification}))
        assert DemoModel(tmp_path / 'first').bundle is None
