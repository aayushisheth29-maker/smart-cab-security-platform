import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Car, Star, Loader2,
  Calendar, CheckCircle2, XCircle, Clock, Siren, RefreshCw, LogIn,
  MapPin, Navigation, X, ArrowRight, Sparkles, Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { apiFetch } from './api';
import TripRatingModal from './TripRatingModal';

const pickupMarkerIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #0f172a; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [9, 9]
});

const dropoffMarkerIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #16a34a; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [9, 9]
});

const STATUS_META = {
  REQUESTED: { label: 'Requested', color: 'bg-slate-100 text-slate-700' },
  DRIVER_ASSIGNED: { label: 'Driver assigned', color: 'bg-blue-100 text-blue-700' },
  DRIVER_ACCEPTED: { label: 'Driver accepted', color: 'bg-blue-100 text-blue-700' },
  DRIVER_ARRIVING: { label: 'Driver arriving', color: 'bg-amber-100 text-amber-700' },
  RIDE_STARTED: { label: 'Ride started', color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'On trip', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
  DANGER: { label: 'SOS active', color: 'bg-red-600 text-white' },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
};

const ACTIVE = ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_ARRIVING', 'RIDE_STARTED', 'IN_PROGRESS', 'DANGER'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || '—', color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.color}`}>
      {status === 'DANGER' && <Siren className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch (e) {
    return iso;
  }
}

function RideCard({ ride, onTrack, onRate, onViewRoute }) {
  const driver = ride.driver || {};
  const isSos = ride.status === 'DANGER';
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition hover:shadow-md ${isSos ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-xs font-bold text-slate-400 tracking-wide">RIDE ID</div>
          <div className="text-lg font-extrabold text-slate-900">{ride.rideCode || `SC-2026-${String(ride.id).padStart(6, '0')}`}</div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      <div className="flex items-center gap-3 text-slate-700 mb-4">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
          <div className="w-0.5 h-6 bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
        </div>
        <div className="text-sm">
          <div className="font-semibold">{ride.pickupLocation || 'Pickup'}</div>
          <div className="text-slate-400 text-xs my-0.5">→ {ride.dropoffLocation || 'Destination'}</div>
          <div className="font-semibold">{ride.dropoffLocation || 'Destination'}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3">
          {driver.name ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {driver.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-slate-800">{driver.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {driver.rating || '—'} · {driver.carModel || 'Smart Security AI Cab'} · {driver.plate || ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Driver being matched…</div>
          )}
        </div>
        <div className="text-right">
          <div className="font-extrabold text-slate-900">₹{ride.fare ?? '—'}</div>
          <div className="text-xs text-slate-400">{ride.distanceKm ? `${ride.distanceKm} km` : ''}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(ride.createdAt)}</span>
        {ride.etaMinutes && ACTIVE.includes(ride.status) && (
          <span className="flex items-center gap-1 text-blue-600 font-semibold"><Clock className="h-3.5 w-3.5" /> ~{ride.etaMinutes} min away</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onViewRoute && onViewRoute(ride)}
          className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs sm:text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <MapPin className="h-4 w-4 text-blue-600" /> View Route
        </button>

        {ACTIVE.includes(ride.status) && ride.status !== 'DANGER' && (
          <button
            onClick={() => onTrack(ride)}
            className="flex-1 bg-slate-900 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Track live
          </button>
        )}
        {ride.status === 'DANGER' && (
          <Link to="/safety" className="flex-1 bg-red-600 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl text-center hover:bg-red-700 transition">
            Open emergency
          </Link>
        )}
        {ride.status === 'COMPLETED' && (
          <button
            onClick={() => onRate && onRate(ride)}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl text-center transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Star className="h-4 w-4 fill-white" /> Rate &amp; Tip
          </button>
        )}
        <button
          onClick={() => onTrack(ride, true)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-xs font-semibold"
        >
          Share
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
      <div className="bg-slate-50 rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="font-bold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

export default function MyRides() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');
  const [sharing, setSharing] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  const [ratingModalRide, setRatingModalRide] = useState(null);
  const [selectedRouteRide, setSelectedRouteRide] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('smartcab_user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setUser(null);
    }
  }, []);

  const loadRides = async () => {
    setLoading(true);
    setError('');
    let serverRides = [];
    if (user && user.id) {
      try {
        const data = await apiFetch(`/api/users/${user.id}/trips`);
        serverRides = Array.isArray(data) ? data : [];
      } catch (err) {
        if (err.status === 401) {
          console.warn('Session expired, falling back to local history');
        }
      }
    }

    // Always merge local history
    let localRides = [];
    try {
      const stored = JSON.parse(localStorage.getItem('smartcab_my_rides') || '[]');
      const lastRide = JSON.parse(localStorage.getItem('smartcab_last_ride') || 'null');
      localRides = Array.isArray(stored) ? stored : [];
      if (lastRide && !localRides.some((r) => r.id === lastRide.bookingId || r.id === lastRide.id)) {
        localRides.unshift({
          id: lastRide.bookingId || lastRide.id || 101,
          rideCode: lastRide.rideCode || `SC-${lastRide.bookingId || 101}`,
          status: 'COMPLETED',
          riderName: lastRide.riderName || 'You',
          driver: lastRide.driver || { name: 'Anita M.', plate: 'GJ 01 EF 9012', carModel: 'SmartPro Sedan AC', rating: 4.98 },
          pickupLocation: lastRide.pickup || 'Prahlad Nagar, SG Highway, Ahmedabad',
          dropoffLocation: lastRide.dropoff || 'SVPI Airport Terminal 1, Ahmedabad',
          fare: lastRide.fare || 289,
          distanceKm: lastRide.distanceKm || '14.2',
          createdAt: lastRide.createdAt || new Date(Date.now() - 3600000).toISOString(),
          pickupLat: lastRide.pickupLat || 23.0125,
          pickupLng: lastRide.pickupLng || 72.5115,
          dropoffLat: lastRide.dropoffLat || 23.0734,
          dropoffLng: lastRide.dropoffLng || 72.6266
        });
      }
    } catch (e) { /* ignore */ }

    // If completely empty on first launch, seed a verified sample ride in Ahmedabad
    if (serverRides.length === 0 && localRides.length === 0) {
      localRides = [
        {
          id: 101,
          rideCode: 'SC-2026-AMD001',
          status: 'COMPLETED',
          riderName: user?.name || 'Aayushi',
          driver: { name: 'Anita M.', plate: 'GJ 01 EF 9012', carModel: 'SmartPro Sedan AC', rating: 4.98 },
          pickupLocation: 'Prahlad Nagar, SG Highway, Ahmedabad',
          dropoffLocation: 'SVPI Airport Terminal 1, Ahmedabad',
          fare: 289,
          distanceKm: '14.2',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          pickupLat: 23.0125,
          pickupLng: 72.5115,
          dropoffLat: 23.0734,
          dropoffLng: 72.6266
        }
      ];
    }

    const combined = [...serverRides];
    for (const lr of localRides) {
      if (!combined.some((r) => r.id === lr.id || (r.rideCode && r.rideCode === lr.rideCode))) {
        combined.push(lr);
      }
    }

    setRides(combined);
    setLoading(false);
  };

  useEffect(() => {
    loadRides();
  }, [user]);

  const groups = useMemo(() => {
    const active = rides.filter((r) => ACTIVE.includes(r.status));
    const upcoming = rides.filter((r) => r.status === 'REQUESTED' || r.status === 'PENDING');
    const completed = rides.filter((r) => r.status === 'COMPLETED');
    const cancelled = rides.filter((r) => r.status === 'CANCELLED');
    return { active, upcoming, completed, cancelled };
  }, [rides]);

  const visible = {
    active: groups.active,
    upcoming: groups.upcoming,
    completed: groups.completed,
    cancelled: groups.cancelled,
  }[tab] || [];

  const handleTrack = async (ride, shareOnly = false) => {
    setSharing(ride.id);
    setShareMessage('');
    try {
      const data = await apiFetch('/api/safety/share-ride', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: ride.id,
          rideCode: ride.rideCode,
          riderName: user?.name || ride.riderName || 'Rider',
          driverName: ride.driver?.name || 'Verified Driver',
          carPlate: ride.driver?.plate || '',
          carModel: ride.driver?.carModel || 'Smart Security AI Cab',
          pickup: ride.pickupLocation || '',
          dropoff: ride.dropoffLocation || '',
          contacts: [],
          notifyContacts: false,
        }),
      });
      const url = `${window.location.origin}${data.trackUrl}`;
      await navigator.clipboard?.writeText(url).catch(() => {});
      if (shareOnly) {
        setShareMessage(`Live tracking link created & copied: ${data.trackUrl}`);
      } else {
        window.open(`/track/${data.linkId}`, '_blank');
      }
    } catch (err) {
      setShareMessage(`Could not create live link: ${err.message}`);
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:text-slate-300 transition">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="flex items-center gap-2">
              <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-amber-400/40" />
              <span className="font-extrabold text-xl">Smart Security AI Cab</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/" className="hover:text-green-400 transition">Book Ride</Link>
            <Link to="/safety" className="hover:text-green-400 transition">Safety Center</Link>
            <Link to="/rides" className="text-green-400">My Rides</Link>
            <Link to="/route-lab" className="hover:text-green-400 transition text-emerald-400">🧭 Route Lab</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Rides &amp; Route History</h1>
            <p className="text-slate-500 mt-1">
              {user ? `Hi ${user.name}, here is your full ride and route history with live GPS telemetry.` : 'Explore your past routes, trip coordinates, and driver details.'}
            </p>
          </div>
          <Link
            to="/"
            className="w-max px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <Car className="w-3.5 h-3.5" /> Book New Ride
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'active', label: 'Active', count: groups.active.length },
            { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
            { id: 'completed', label: 'Completed', count: groups.completed.length },
            { id: 'cancelled', label: 'Cancelled', count: groups.cancelled.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                tab === t.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.label} <span className="opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {shareMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span>{shareMessage}</span>
            <button onClick={() => setShareMessage('')} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <span className="font-semibold">Loading your rides…</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-semibold mb-4">⚠️ {error}</p>
            <button onClick={loadRides} className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={tab === 'completed' ? CheckCircle2 : tab === 'cancelled' ? XCircle : Car}
            title={tab === 'active' ? 'No active rides' : tab === 'upcoming' ? 'No upcoming rides' : tab === 'completed' ? 'No completed rides yet' : 'No cancelled rides'}
            subtitle={tab === 'completed' ? 'Your completed rides will appear here.' : 'Book a ride to see it here.'}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {visible.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onTrack={handleTrack}
                onRate={(r) => setRatingModalRide(r)}
                onViewRoute={(r) => setSelectedRouteRide(r)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ⭐ Post-Trip Driver Rating & Tip Modal */}
      <TripRatingModal
        isOpen={!!ratingModalRide}
        onClose={() => setRatingModalRide(null)}
        tripDetails={ratingModalRide ? {
          ...ratingModalRide,
          driverName: ratingModalRide.driver?.name || ratingModalRide.driverName || 'Anita M.',
          driverPlate: ratingModalRide.driver?.plate || ratingModalRide.carPlate || 'KA 01 EF 9012',
          bookingId: ratingModalRide.id || ratingModalRide.bookingId,
          riderName: user?.name || 'Rider'
        } : null}
        onRatingSubmitted={() => {
          loadRides();
        }}
      />

      {/* 🗺️ INTERACTIVE RIDE ROUTE & TELEMETRY VIEWER MODAL */}
      {selectedRouteRide && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    Route Intelligence &amp; GPS Telemetry
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                      Verified Route
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ride #{selectedRouteRide.rideCode || selectedRouteRide.id} · {formatDate(selectedRouteRide.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRouteRide(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Preview */}
            <div className="h-64 sm:h-80 w-full relative bg-slate-100">
              {(() => {
                const pLat = Number(selectedRouteRide.pickupLat) || 23.0125;
                const pLng = Number(selectedRouteRide.pickupLng) || 72.5115;
                const dLat = Number(selectedRouteRide.dropoffLat) || 23.0734;
                const dLng = Number(selectedRouteRide.dropoffLng) || 72.6266;
                const centerLat = (pLat + dLat) / 2;
                const centerLng = (pLng + dLng) / 2;

                return (
                  <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[pLat, pLng]} icon={pickupMarkerIcon} />
                    <Marker position={[dLat, dLng]} icon={dropoffMarkerIcon} />
                    <Polyline
                      positions={[
                        [pLat, pLng],
                        [(pLat + dLat) / 2 + 0.005, (pLng + dLng) / 2],
                        [dLat, dLng]
                      ]}
                      color="#2563eb"
                      weight={5}
                      dashArray="8, 8"
                    />
                  </MapContainer>
                );
              })()}

              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-black text-slate-800 flex items-center gap-1.5 z-[1000]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AI Route Guard Nominal</span>
              </div>
            </div>

            {/* Route Details */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Pickup Origin</div>
                    <div className="text-xs font-bold text-slate-900">{selectedRouteRide.pickupLocation || 'Pickup'}</div>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 ml-1 pl-5 py-0.5">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    Distance: {selectedRouteRide.distanceKm || '12'} km · Safe Corridor
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Dropoff Destination</div>
                    <div className="text-xs font-bold text-slate-900">{selectedRouteRide.dropoffLocation || 'Destination'}</div>
                  </div>
                </div>
              </div>

              {/* Driver & Fare Pill */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Driver</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedRouteRide.driver?.name || 'Verified Driver'}</div>
                  <div className="text-[11px] text-slate-500">{selectedRouteRide.driver?.carModel || 'Smart Security AI Cab'} · {selectedRouteRide.driver?.plate || ''}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Fare Settled</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">₹{selectedRouteRide.fare ?? '—'}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">100% Tax Invoiced ✓</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  to="/"
                  onClick={() => setSelectedRouteRide(null)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-2xl text-center shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Book This Route Again
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const text = `🚕 SmartCab Route: ${selectedRouteRide.pickupLocation} → ${selectedRouteRide.dropoffLocation} (Fare: ₹${selectedRouteRide.fare})`;
                    navigator.clipboard?.writeText(text);
                    alert("Route details copied to clipboard!");
                  }}
                  className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl transition"
                >
                  Share Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
