import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Car,
  Siren,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  Layers,
  Maximize2,
  Phone,
  Video,
  Radio,
  Clock,
  Gauge,
  Compass,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  X,
  Play,
  Pause,
  PlusCircle,
  LocateFixed,
  Zap,
  Volume2,
  VolumeX,
  Camera,
  Activity
} from 'lucide-react';

// Tile layer presets
const TILE_LAYERS = {
  dark: {
    name: 'Tactical Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  standard: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
  }
};

const DEFAULT_CENTER = [23.0338, 72.5850];

// Custom animated vehicle marker icons using Leaflet DivIcon
const createCabIcon = (status, isSelected = false, heading = 0) => {
  let bgColor = '#10b981'; // emerald green
  let pulseColor = 'rgba(16, 185, 129, 0.4)';
  let borderColor = '#047857';
  let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

  if (status === 'EMERGENCY' || status === 'DANGER' || status === 'SOS') {
    bgColor = '#ef4444'; // red
    pulseColor = 'rgba(239, 68, 68, 0.6)';
    borderColor = '#b91c1c';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/><circle cx="12" cy="10" r="1"/><path d="m19 19-3-8h-8l-3 8"/><circle cx="12" cy="4" r="2"/></svg>`;
  } else if (status === 'STOPPED' || status === 'IDLE' || status === 'CAUTION') {
    bgColor = '#f59e0b'; // amber
    pulseColor = 'rgba(245, 158, 11, 0.4)';
    borderColor = '#d97706';
  }

  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 4px #38bdf8, 0 8px 20px rgba(56, 189, 248, 0.5); transform: scale(1.15);`
    : `box-shadow: 0 4px 12px rgba(0,0,0,0.3);`;

  return L.divIcon({
    className: 'custom-fleet-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: ${pulseColor}; animation: ping ${status === 'EMERGENCY' ? '1s' : '2s'} cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: ${bgColor}; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; color: white; ${ringStyle} z-index: 2; transition: all 0.3s ease;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
};

const routePointIcon = (type) => {
  const isPickup = type === 'pickup';
  return L.divIcon({
    className: 'route-point-marker',
    html: `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isPickup ? '#10b981' : '#6366f1'}; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">
        ${isPickup ? 'A' : 'B'}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Map controller for follow-vehicle and auto-fitting
function MapController({ selectedCab, followMode, allCabs, autoFitTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCab && selectedCab.lat && selectedCab.lng) {
      if (followMode) {
        map.panTo([selectedCab.lat, selectedCab.lng], { animate: true, duration: 0.8 });
      } else {
        map.flyTo([selectedCab.lat, selectedCab.lng], 15, { duration: 1.2 });
      }
    }
  }, [selectedCab, followMode, map]);

  useEffect(() => {
    if (autoFitTrigger > 0 && allCabs && allCabs.length > 0) {
      const validPoints = allCabs
        .filter((c) => c.lat && c.lng)
        .map((c) => [c.lat, c.lng]);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [autoFitTrigger, allCabs, map]);

  return null;
}

export default function FleetRadarMap({
  rides = [],
  emergencies = [],
  drivers = [],
  onRespondEmergency
}) {
  const [tileMode, setTileMode] = useState('dark');
  const [filterMode, setFilterMode] = useState('ALL');
  const [selectedCab, setSelectedCab] = useState(null);
  const [followMode, setFollowMode] = useState(false);
  const [autoFitTrigger, setAutoFitTrigger] = useState(1);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 5x
  const [simulationStep, setSimulationStep] = useState(0);
  const [activeCameraModal, setActiveCameraModal] = useState(null);
  const [extraCabs, setExtraCabs] = useState([]);
  const [emergencyOverrides, setEmergencyOverrides] = useState({});

  // Landmark presets for adding new dynamic cabs
  const AHMEDABAD_LANDMARKS = [
    { name: 'Vastrapur Lake, Ahmedabad', lat: 23.0360, lng: 72.5290, driver: 'Ravi Solanki', plate: 'GJ 01 VZ 1199', model: 'SmartSUV Guard' },
    { name: 'Sabarmati Riverfront', lat: 23.0450, lng: 72.5830, driver: 'Dhaval Shah', plate: 'GJ 01 RF 4422', model: 'SmartSedan Prime' },
    { name: 'Sindhu Bhavan Road', lat: 23.0410, lng: 72.5020, driver: 'Meera Dave', plate: 'GJ 01 SB 8811', model: 'SmartMini EV' },
    { name: 'Law Garden, Ellisbridge', lat: 23.0230, lng: 72.5580, driver: 'Karan Varma', plate: 'GJ 01 LG 7733', model: 'SmartSUV Guard' },
    { name: 'Sardar Patel Ring Road', lat: 23.1100, lng: 72.6100, driver: 'Bhavin Patel', plate: 'GJ 01 SP 3300', model: 'SmartSedan Prime' }
  ];

  // Synthesize active fleet vehicles with live coordinates
  const fleetCabs = useMemo(() => {
    const defaultCoords = [
      { lat: 23.0338, lng: 72.5850, name: 'Rahul Sharma', plate: 'GJ 01 AB 1234', model: 'SmartMini EV', speed: 42, heading: 65 },
      { lat: 23.0750, lng: 72.5250, name: 'Vikram Patel', plate: 'GJ 01 CD 5678', model: 'SmartSedan Prime', speed: 36, heading: 140 },
      { lat: 23.0120, lng: 72.5920, name: 'Anita Mehta', plate: 'GJ 01 EF 9012', model: 'SmartSUV Guard', speed: 0, heading: 210, status: 'STOPPED' },
      { lat: 23.0580, lng: 72.6350, name: 'Suresh Kumar', plate: 'GJ 01 GH 3456', model: 'SmartMini EV', speed: 48, heading: 320 },
      { lat: 23.1150, lng: 72.5350, name: 'Priya Trivedi', plate: 'GJ 01 IJ 7890', model: 'SmartSedan Prime', speed: 52, heading: 90 }
    ];

    const result = [];

    // 1. Incorporate active emergencies
    (emergencies || []).forEach((e, idx) => {
      if (e.status === 'ACTIVE' || e.status === 'DANGER') {
        const id = `sos-${e.id || idx}`;
        result.push({
          id,
          rideCode: e.rideCode || `#SOS-${e.id}`,
          driverName: e.driverName || 'Assigned Driver',
          carPlate: e.carPlate || 'GJ 01 SOS 999',
          carModel: 'SmartSecurity Guard Cab',
          riderName: e.riderName || 'SmartCab Passenger',
          riderPhone: e.riderPhone || '+91 98765 00112',
          pickup: e.pickup || 'Chandlodia, Ahmedabad',
          dropoff: e.dropoff || 'Airport Road',
          lat: Number(e.lat || (23.0450 + idx * 0.01)),
          lng: Number(e.lng || (72.5650 + idx * 0.01)),
          speed: 14,
          heading: 45,
          status: 'EMERGENCY',
          anomalyScore: 0.94,
          lastPing: e.createdAt || new Date().toISOString(),
          emergencyId: e.id,
          battery: 88,
          accuracy: 4.2
        });
      }
    });

    // 2. Incorporate active rides
    (rides || []).forEach((r, idx) => {
      const isDanger = r.status === 'DANGER';
      const isCompleted = r.status === 'COMPLETED' || r.status === 'CANCELLED';
      if (isCompleted && result.length >= 4) return;

      const driverObj = typeof r.driver === 'object' ? r.driver : null;
      const driverName = driverObj?.name || r.driverName || defaultCoords[idx % defaultCoords.length].name;
      const carPlate = driverObj?.plate || defaultCoords[idx % defaultCoords.length].plate;
      const carModel = driverObj?.carModel || r.selectedCar || defaultCoords[idx % defaultCoords.length].model;

      const jitterLat = Math.sin((simulationStep + idx) * 0.5) * 0.002;
      const jitterLng = Math.cos((simulationStep + idx) * 0.5) * 0.002;

      const lat = Number(r.currentLat || r.lat || r.pickupLat || (defaultCoords[idx % defaultCoords.length].lat + jitterLat));
      const lng = Number(r.currentLng || r.lng || r.pickupLng || (defaultCoords[idx % defaultCoords.length].lng + jitterLng));

      const id = `ride-${r.id || r.bookingId || idx}`;
      let cabStatus = emergencyOverrides[id] || (isDanger ? 'EMERGENCY' : (r.status === 'IN_PROGRESS' || r.status === 'RIDE_STARTED' ? 'ACTIVE' : 'IDLE'));
      if (idx === 2 && cabStatus === 'IDLE') cabStatus = 'STOPPED';

      result.push({
        id,
        rideCode: r.rideCode || `#SC-${r.id || idx + 101}`,
        driverName,
        carPlate,
        carModel,
        riderName: r.riderName || 'SmartCab Passenger',
        riderPhone: r.riderPhone || '+91 98765 43210',
        pickup: r.pickupLocation || r.pickup || 'Chandlodia, Ahmedabad',
        dropoff: r.dropoffLocation || r.dropoff || 'Sardar Vallabhbhai Patel Airport',
        pickupCoords: [r.pickupLat || (lat - 0.015), r.pickupLng || (lng - 0.015)],
        dropoffCoords: [r.dropoffLat || (lat + 0.02), r.dropoffLng || (lng + 0.02)],
        lat,
        lng,
        speed: cabStatus === 'STOPPED' ? 0 : Math.round(35 + Math.sin(simulationStep + idx) * 12),
        heading: (defaultCoords[idx % defaultCoords.length].heading + simulationStep * 10) % 360,
        status: cabStatus,
        anomalyScore: cabStatus === 'EMERGENCY' ? 0.93 : 0.04,
        fare: r.fare || 250,
        lastPing: new Date().toISOString(),
        battery: 92 - (idx * 4),
        accuracy: 3.5
      });
    });

    // 3. Incorporate extra dynamically dispatched cabs
    extraCabs.forEach((ec, idx) => {
      const id = `extra-${idx}`;
      const jitterLat = Math.sin((simulationStep + idx + 10) * 0.4) * 0.002;
      const jitterLng = Math.cos((simulationStep + idx + 10) * 0.4) * 0.002;
      const cabStatus = emergencyOverrides[id] || ec.status || 'ACTIVE';

      result.push({
        id,
        rideCode: ec.rideCode,
        driverName: ec.driverName,
        carPlate: ec.carPlate,
        carModel: ec.carModel,
        riderName: 'Verified Passenger',
        riderPhone: '+91 98765 22000',
        pickup: ec.pickup,
        dropoff: 'Ahmedabad International Airport',
        pickupCoords: [ec.lat - 0.01, ec.lng - 0.01],
        dropoffCoords: [ec.lat + 0.02, ec.lng + 0.02],
        lat: ec.lat + jitterLat,
        lng: ec.lng + jitterLng,
        speed: cabStatus === 'STOPPED' ? 0 : Math.round(40 + Math.sin(simulationStep + idx) * 10),
        heading: 90,
        status: cabStatus,
        anomalyScore: cabStatus === 'EMERGENCY' ? 0.95 : 0.03,
        fare: 310,
        lastPing: new Date().toISOString(),
        battery: 94,
        accuracy: 3.2
      });
    });

    // 4. Fallback baseline if fleet is empty
    if (result.length < 4) {
      defaultCoords.slice(result.length).forEach((def, i) => {
        const idx = result.length + i;
        const id = `fleet-seed-${idx}`;
        const jitterLat = Math.sin((simulationStep + idx) * 0.4) * 0.002;
        const jitterLng = Math.cos((simulationStep + idx) * 0.4) * 0.002;
        const cabStatus = emergencyOverrides[id] || def.status || 'ACTIVE';

        result.push({
          id,
          rideCode: `#SC-FLT${idx + 10}`,
          driverName: def.name,
          carPlate: def.plate,
          carModel: def.model,
          riderName: 'En Route Passenger',
          riderPhone: '+91 98765 11000',
          pickup: 'SG Highway, Bodakdev',
          dropoff: 'Kalupur Railway Station',
          pickupCoords: [def.lat - 0.01, def.lng - 0.01],
          dropoffCoords: [def.lat + 0.015, def.lng + 0.015],
          lat: def.lat + jitterLat,
          lng: def.lng + jitterLng,
          speed: cabStatus === 'STOPPED' ? 0 : def.speed,
          heading: def.heading,
          status: cabStatus,
          anomalyScore: cabStatus === 'EMERGENCY' ? 0.92 : 0.03,
          fare: 280,
          lastPing: new Date().toISOString(),
          battery: 95 - i * 5,
          accuracy: 4.0
        });
      });
    }

    return result;
  }, [rides, emergencies, extraCabs, emergencyOverrides, simulationStep]);

  // Periodic movement tick with speed multiplier
  useEffect(() => {
    if (!isSimulating) return;
    const interval = Math.max(800, Math.floor(4000 / simulationSpeed));
    const timer = setInterval(() => {
      setSimulationStep((s) => (s + 1) % 10000);
    }, interval);
    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed]);

  // Keep selectedCab updated with latest coordinates during simulation
  useEffect(() => {
    if (selectedCab) {
      const updated = fleetCabs.find((c) => c.id === selectedCab.id);
      if (updated) setSelectedCab(updated);
    }
  }, [simulationStep, fleetCabs]);

  const filteredCabs = useMemo(() => {
    if (filterMode === 'ACTIVE') return fleetCabs.filter((c) => c.status === 'ACTIVE');
    if (filterMode === 'SOS') return fleetCabs.filter((c) => c.status === 'EMERGENCY');
    if (filterMode === 'STOPPED') return fleetCabs.filter((c) => c.status === 'STOPPED' || c.status === 'IDLE');
    return fleetCabs;
  }, [fleetCabs, filterMode]);

  const stats = useMemo(() => {
    const total = fleetCabs.length;
    const active = fleetCabs.filter((c) => c.status === 'ACTIVE').length;
    const sos = fleetCabs.filter((c) => c.status === 'EMERGENCY').length;
    const stopped = fleetCabs.filter((c) => c.status === 'STOPPED' || c.status === 'IDLE').length;
    const avgSpeed = Math.round(
      fleetCabs.reduce((acc, c) => acc + (c.speed || 0), 0) / (total || 1)
    );
    return { total, active, sos, stopped, avgSpeed };
  }, [fleetCabs]);

  const dispatchNewCab = () => {
    const nextLandmark = AHMEDABAD_LANDMARKS[extraCabs.length % AHMEDABAD_LANDMARKS.length];
    const newCab = {
      rideCode: `#SC-EX${extraCabs.length + 101}`,
      driverName: nextLandmark.driver,
      carPlate: nextLandmark.plate,
      carModel: nextLandmark.model,
      pickup: nextLandmark.name,
      lat: nextLandmark.lat,
      lng: nextLandmark.lng,
      status: 'ACTIVE'
    };
    setExtraCabs((prev) => [...prev, newCab]);
    setAutoFitTrigger((t) => t + 1);
  };

  const toggleCabEmergency = (cab) => {
    const current = cab.status === 'EMERGENCY';
    setEmergencyOverrides((prev) => ({
      ...prev,
      [cab.id]: current ? 'ACTIVE' : 'EMERGENCY'
    }));
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-5 border border-slate-700 shadow-2xl mb-10 overflow-hidden text-white relative">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">LIVE FLEET GPS RADAR</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE RADAR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Leaflet satellite tracking, driver cabin telematics, and real-time anomaly telemetry
            </p>
          </div>
        </div>

        {/* MAP CONTROLS & SIMULATION TOOLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SIMULATION PLAY/PAUSE */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isSimulating
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                : 'bg-amber-600/30 border-amber-500/40 text-amber-300'
            }`}
            title="Toggle live telemetry movement"
          >
            {isSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isSimulating ? 'Live Movement: ON' : 'Paused'}</span>
          </button>

          {/* SIM SPEED TOGGLE */}
          <button
            onClick={() => setSimulationSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-extrabold text-sky-400 transition"
            title="Adjust telemetry playback rate"
          >
            {simulationSpeed}x Speed
          </button>

          {/* DISPATCH NEW CAB */}
          <button
            onClick={dispatchNewCab}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            title="Dispatch extra cab on radar"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>+ Dispatch Cab</span>
          </button>

          {/* Tile Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            {Object.keys(TILE_LAYERS).map((k) => (
              <button
                key={k}
                onClick={() => setTileMode(k)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tileMode === k ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {TILE_LAYERS[k].name}
              </button>
            ))}
          </div>

          {/* Fit Bounds */}
          <button
            onClick={() => setAutoFitTrigger((t) => t + 1)}
            title="Fit all vehicles in view"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FILTER CHIPS & METRIC STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 text-xs font-bold">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterMode === 'ALL' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Fleet ({stats.total})
          </button>
          <button
            onClick={() => setFilterMode('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterMode === 'ACTIVE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active ({stats.active})
          </button>
          <button
            onClick={() => setFilterMode('SOS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterMode === 'SOS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> SOS / Deviations ({stats.sos})
          </button>
          <button
            onClick={() => setFilterMode('STOPPED')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterMode === 'STOPPED' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Stopped ({stats.stopped})
          </button>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div>Avg Speed: <strong className="text-sky-400">{stats.avgSpeed} km/h</strong></div>
          <div>•</div>
          <div>Cabs Online: <strong className="text-emerald-400">{stats.total}</strong></div>
          <div>•</div>
          <div>Isolation Forest Anomaly Guard: <strong className="text-emerald-400">Active</strong></div>
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner h-[500px] w-full notranslate">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <TileLayer
            url={TILE_LAYERS[tileMode].url}
            attribution={TILE_LAYERS[tileMode].attribution}
          />

          <MapController
            selectedCab={selectedCab}
            followMode={followMode}
            allCabs={filteredCabs}
            autoFitTrigger={autoFitTrigger}
          />

          {/* Render Active Cab Markers */}
          {filteredCabs.map((cab) => (
            <Marker
              key={cab.id}
              position={[cab.lat, cab.lng]}
              icon={createCabIcon(cab.status, selectedCab?.id === cab.id, cab.heading)}
              eventHandlers={{
                click: () => {
                  setSelectedCab(cab);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="text-slate-900 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span className="font-mono">{cab.rideCode}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      cab.status === 'EMERGENCY' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {cab.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{cab.driverName}</div>
                  <div className="text-[11px] text-slate-500">{cab.carModel} · {cab.carPlate}</div>
                  <div className="text-[11px] text-slate-600 mt-1">Speed: <strong>{cab.speed} km/h</strong></div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{cab.pickup} → {cab.dropoff}</div>
                  <button
                    onClick={() => setSelectedCab(cab)}
                    className="w-full mt-2.5 bg-slate-900 text-white text-[11px] font-bold py-1.5 rounded-lg hover:bg-slate-800"
                  >
                    Open Vehicle Inspector
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Polyline route path for selected vehicle */}
          {selectedCab && selectedCab.pickupCoords && selectedCab.dropoffCoords && (
            <>
              <Marker position={selectedCab.pickupCoords} icon={routePointIcon('pickup')} />
              <Marker position={selectedCab.dropoffCoords} icon={routePointIcon('dropoff')} />
              <Polyline
                positions={[
                  selectedCab.pickupCoords,
                  [selectedCab.lat, selectedCab.lng],
                  selectedCab.dropoffCoords
                ]}
                color={selectedCab.status === 'EMERGENCY' ? '#ef4444' : '#10b981'}
                weight={4}
                dashArray="6, 8"
                opacity={0.85}
              />
            </>
          )}
        </MapContainer>

        {/* SELECTED CAB FLOATING INSPECTOR DRAWER */}
        {selectedCab && (
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-700 shadow-2xl w-84 max-w-[calc(100%-2rem)] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  selectedCab.status === 'EMERGENCY' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                }`}></span>
                <span className="font-mono font-black text-sm">{selectedCab.rideCode}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedCab.status === 'EMERGENCY' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {selectedCab.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedCab(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* DRIVER & VEHICLE INFO */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">DRIVER & VEHICLE</span>
                  <strong className="text-white text-sm">{selectedCab.driverName}</strong>
                  <div className="text-[11px] text-slate-300">{selectedCab.carModel}</div>
                  <div className="font-mono text-[10px] text-amber-400">{selectedCab.carPlate}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">LIVE SPEED</span>
                  <span className="text-emerald-400 font-black text-base">{selectedCab.speed} km/h</span>
                </div>
              </div>

              {/* ROUTE */}
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-emerald-400 font-bold">A:</span>
                  <span className="truncate">{selectedCab.pickup}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-indigo-400 font-bold">B:</span>
                  <span className="truncate">{selectedCab.dropoff}</span>
                </div>
              </div>

              {/* TELEMETRY METADATA */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded-xl">
                <div>GPS Accuracy: <strong className="text-slate-200">{selectedCab.accuracy || 3.5}m</strong></div>
                <div>Battery: <strong className="text-slate-200">{selectedCab.battery || 90}%</strong></div>
                <div>Coordinates: <strong className="text-slate-200 font-mono text-[10px]">{selectedCab.lat.toFixed(4)}, {selectedCab.lng.toFixed(4)}</strong></div>
                <div>AI Risk Score: <strong className={selectedCab.anomalyScore > 0.5 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{selectedCab.anomalyScore}</strong></div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex flex-col gap-2">
                {/* LIVE CABIN DASHCAM / VIDEO STREAM MODAL TRIGGER */}
                <button
                  onClick={() => setActiveCameraModal(selectedCab)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Camera className="h-4 w-4" />
                  <span>View Cabin Live Camera (AI Guard)</span>
                </button>

                {/* SIMULATE / TOGGLE SOS DEVIATION ALERT */}
                <button
                  onClick={() => toggleCabEmergency(selectedCab)}
                  className={`w-full font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    selectedCab.status === 'EMERGENCY'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 text-red-300'
                  }`}
                >
                  <Siren className="h-4 w-4" />
                  <span>{selectedCab.status === 'EMERGENCY' ? 'Clear SOS / Mark Normal' : 'Simulate SOS / Route Deviation'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFollowMode(!followMode)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      followMode
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    <span>{followMode ? 'Following' : 'Follow Cab'}</span>
                  </button>

                  <a
                    href={`tel:${selectedCab.riderPhone}`}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-1.5 rounded-xl transition text-center flex items-center justify-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Rider</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📹 LIVE CABIN DASHCAM & AI SECURITY OVERLAY MODAL */}
      {activeCameraModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setActiveCameraModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">SmartCab AI Cabin Guard™ Live Feed</h3>
                <p className="text-xs text-slate-400">Encrypted cabin dashcam feed · Ride {activeCameraModal.rideCode}</p>
              </div>
            </div>

            {/* SIMULATED CAMERA CANVAS */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex items-center justify-center mb-4">
              {/* Simulated camera grid & stream */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none"></div>
              
              {/* Animated HUD Elements */}
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 animate-pulse">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="text-sm font-bold text-slate-200">Cabin Security Stream Active</div>
                <div className="text-xs text-slate-400">Live AI Face & Audio Telemetry Scanning</div>
              </div>

              {/* HUD OVERLAY */}
              <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                LIVE CCTV
              </div>
              <div className="absolute top-3 right-3 font-mono text-[11px] text-emerald-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                {new Date().toLocaleTimeString('en-IN')}
              </div>
              <div className="absolute bottom-3 left-3 text-[11px] text-slate-300 font-mono space-y-0.5">
                <div>Driver: <span className="text-white font-bold">{activeCameraModal.driverName}</span></div>
                <div>Speed: <span className="text-emerald-400 font-bold">{activeCameraModal.speed} km/h</span> • Battery: {activeCameraModal.battery}%</div>
              </div>
              <div className="absolute bottom-3 right-3 text-[11px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded">
                🟢 Driver Alert: Focused
              </div>
            </div>

            {/* CONTROLS */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => alert("📸 Evidence Snapshot captured & securely stored to hash ledger.")}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Evidence Frame</span>
              </button>
              <button
                onClick={() => {
                  toggleCabEmergency(activeCameraModal);
                  setActiveCameraModal(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40"
              >
                <Siren className="h-4 w-4" />
                <span>Escalate to Emergency SOS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
