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
  X
} from 'lucide-react';

// Tile layer presets
const TILE_LAYERS = {
  standard: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  dark: {
    name: 'Tactical Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

// Default center (Ahmedabad / SG Highway)
const DEFAULT_CENTER = [23.0338, 72.5850];

// Custom animated vehicle marker icons using Leaflet DivIcon
const createCabIcon = (status, isSelected = false) => {
  let bgColor = '#10b981'; // green
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

  const ringStyle = isSelected ? `box-shadow: 0 0 0 4px #38bdf8, 0 8px 16px rgba(0,0,0,0.4);` : `box-shadow: 0 4px 12px rgba(0,0,0,0.3);`;

  return L.divIcon({
    className: 'custom-fleet-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${pulseColor}; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: ${bgColor}; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; color: white; ${ringStyle} z-index: 2; transition: all 0.3s ease;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const routePointIcon = (type) => {
  const isPickup = type === 'pickup';
  return L.divIcon({
    className: 'route-point-marker',
    html: `
      <div style="width: 22px; height: 22px; border-radius: 50%; background: ${isPickup ? '#10b981' : '#6366f1'}; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        ${isPickup ? 'A' : 'B'}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

// Helper to auto-fit bounds or pan
function MapController({ selectedCab, allCabs, autoFitTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCab && selectedCab.lat && selectedCab.lng) {
      map.flyTo([selectedCab.lat, selectedCab.lng], 15, { duration: 1.2 });
    }
  }, [selectedCab, map]);

  useEffect(() => {
    if (autoFitTrigger > 0 && allCabs && allCabs.length > 0) {
      const validPoints = allCabs
        .filter((c) => c.lat && c.lng)
        .map((c) => [c.lat, c.lng]);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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
  const [tileMode, setTileMode] = useState('dark'); // 'dark' | 'standard' | 'satellite'
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'SOS' | 'STOPPED'
  const [selectedCab, setSelectedCab] = useState(null);
  const [autoFitTrigger, setAutoFitTrigger] = useState(1);
  const [simulationStep, setSimulationStep] = useState(0);

  // Combine and synthesize active fleet vehicles with live coordinates across Ahmedabad
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
        result.push({
          id: `sos-${e.id || idx}`,
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
          speed: 12,
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

      // Small jitter for animation simulation
      const jitterLat = Math.sin((simulationStep + idx) * 0.5) * 0.0015;
      const jitterLng = Math.cos((simulationStep + idx) * 0.5) * 0.0015;

      const lat = Number(r.currentLat || r.lat || r.pickupLat || (defaultCoords[idx % defaultCoords.length].lat + jitterLat));
      const lng = Number(r.currentLng || r.lng || r.pickupLng || (defaultCoords[idx % defaultCoords.length].lng + jitterLng));

      let cabStatus = isDanger ? 'EMERGENCY' : (r.status === 'IN_PROGRESS' || r.status === 'RIDE_STARTED' ? 'ACTIVE' : 'IDLE');
      if (idx === 2 && cabStatus === 'IDLE') cabStatus = 'STOPPED';

      result.push({
        id: `ride-${r.id || r.bookingId || idx}`,
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
        anomalyScore: isDanger ? 0.91 : 0.04,
        fare: r.fare || 250,
        lastPing: new Date().toISOString(),
        battery: 92 - (idx * 4),
        accuracy: 3.5
      });
    });

    // 3. Ensure at least 4-5 fleet vehicles appear on radar for live monitoring
    if (result.length < 4) {
      defaultCoords.slice(result.length).forEach((def, i) => {
        const idx = result.length + i;
        const jitterLat = Math.sin((simulationStep + idx) * 0.4) * 0.002;
        const jitterLng = Math.cos((simulationStep + idx) * 0.4) * 0.002;
        result.push({
          id: `fleet-seed-${idx}`,
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
          speed: def.status === 'STOPPED' ? 0 : def.speed,
          heading: def.heading,
          status: def.status || 'ACTIVE',
          anomalyScore: 0.03,
          fare: 280,
          lastPing: new Date().toISOString(),
          battery: 95 - i * 5,
          accuracy: 4.0
        });
      });
    }

    return result;
  }, [rides, emergencies, simulationStep]);

  // Periodic simulated movement tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulationStep((s) => (s + 1) % 1000);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    const stopped = fleetCabs.filter((c) => c.status === 'STOPPED').length;
    const avgSpeed = Math.round(
      fleetCabs.reduce((acc, c) => acc + (c.speed || 0), 0) / (total || 1)
    );
    return { total, active, sos, stopped, avgSpeed };
  }, [fleetCabs]);

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
                REAL-TIME TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-precision satellite vehicle tracking, route deviation alerts, and live cabin status
            </p>
          </div>
        </div>

        {/* MAP CONTROLS & FILTER CHIPS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === 'ALL' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'ACTIVE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active ({stats.active})
            </button>
            <button
              onClick={() => setFilterMode('SOS')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'SOS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> SOS ({stats.sos})
            </button>
          </div>

          {/* Tile Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            {Object.keys(TILE_LAYERS).map((k) => (
              <button
                key={k}
                onClick={() => setTileMode(k)}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  tileMode === k ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
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

      {/* TELEMETRY METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">ONLINE VEHICLES</span>
            <span className="text-lg font-black text-white">{stats.total} Cabs</span>
          </div>
          <Car className="h-6 w-6 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">AVG FLEET SPEED</span>
            <span className="text-lg font-black text-sky-400">{stats.avgSpeed} km/h</span>
          </div>
          <Gauge className="h-6 w-6 text-sky-400 opacity-80" />
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">ACTIVE PASSENGERS</span>
            <span className="text-lg font-black text-emerald-400">{stats.active} In Transit</span>
          </div>
          <ShieldCheck className="h-6 w-6 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">EMERGENCY STATUS</span>
            <span className={`text-lg font-black ${stats.sos > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
              {stats.sos > 0 ? `🚨 ${stats.sos} Alert` : '✅ All Normal'}
            </span>
          </div>
          <Siren className={`h-6 w-6 ${stats.sos > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner h-[460px] w-full">
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
            allCabs={filteredCabs}
            autoFitTrigger={autoFitTrigger}
          />

          {/* Render Active Cab Markers */}
          {filteredCabs.map((cab) => (
            <Marker
              key={cab.id}
              position={[cab.lat, cab.lng]}
              icon={createCabIcon(cab.status, selectedCab?.id === cab.id)}
              eventHandlers={{
                click: () => setSelectedCab(cab)
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="text-slate-900 p-1 min-w-[180px]">
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span>{cab.rideCode}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      cab.status === 'EMERGENCY' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {cab.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold">{cab.driverName}</div>
                  <div className="text-[11px] text-slate-500">{cab.carModel} · {cab.carPlate}</div>
                  <div className="text-[11px] text-slate-600 mt-1">Speed: <strong>{cab.speed} km/h</strong></div>
                  <button
                    onClick={() => setSelectedCab(cab)}
                    className="w-full mt-2 bg-slate-900 text-white text-[11px] font-bold py-1 rounded hover:bg-slate-800"
                  >
                    Open Live Inspector
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* If a vehicle is selected and has route endpoints, draw polyline route path */}
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
                opacity={0.8}
              />
            </>
          )}
        </MapContainer>

        {/* SELECTED CAB FLOATING INSPECTOR DRAWER */}
        {selectedCab && (
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-700 shadow-2xl w-80 max-w-[calc(100%-2rem)] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  selectedCab.status === 'EMERGENCY' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                }`}></span>
                <span className="font-mono font-black text-sm">{selectedCab.rideCode}</span>
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
                  <span className="text-[10px] text-slate-400 block font-bold">DRIVER</span>
                  <strong className="text-white text-sm">{selectedCab.driverName}</strong>
                  <div className="text-[11px] text-slate-300">{selectedCab.carModel}</div>
                  <div className="font-mono text-[10px] text-amber-400">{selectedCab.carPlate}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">SPEED</span>
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
                <div>Heading: <strong className="text-slate-200">{selectedCab.heading || 0}°</strong></div>
                <div>AI Risk Index: <strong className={selectedCab.anomalyScore > 0.5 ? "text-red-400" : "text-emerald-400"}>{selectedCab.anomalyScore}</strong></div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedCab.status === 'EMERGENCY' && (
                  <button
                    onClick={() => {
                      if (selectedCab.emergencyId && onRespondEmergency) {
                        onRespondEmergency(selectedCab.emergencyId);
                      } else {
                        alert('🚨 Emergency dispatch dispatched to PCR Control Room and contacts notified.');
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/50"
                  >
                    <Siren className="h-4 w-4" />
                    <span>Acknowledge & Respond SOS</span>
                  </button>
                )}
                
                <a
                  href={`tel:${selectedCab.riderPhone}`}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Rider ({selectedCab.riderName})</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
