import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Car, Star, Loader2,
  Calendar, CheckCircle2, XCircle, Clock, Siren, RefreshCw, LogIn,
} from 'lucide-react';
import { apiFetch } from './api';

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

function RideCard({ ride, onTrack }) {
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

      <div className="mt-4 flex gap-2">
        {ACTIVE.includes(ride.status) && ride.status !== 'DANGER' && (
          <button
            onClick={() => onTrack(ride)}
            className="flex-1 bg-slate-900 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Track live ride
          </button>
        )}
        {ride.status === 'DANGER' && (
          <Link to="/safety" className="flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl text-center hover:bg-red-700 transition">
            Open emergency
          </Link>
        )}
        {ride.status === 'COMPLETED' && (
          <Link to="/" className="flex-1 bg-slate-100 text-slate-700 text-sm font-bold py-2.5 rounded-xl text-center hover:bg-slate-200 transition">
            Book again
          </Link>
        )}
        <button
          onClick={() => onTrack(ride, true)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition flex-1 text-sm font-semibold"
        >
          Share ride
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('smartcab_user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setUser(null);
    }
  }, []);

  const loadRides = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/users/${user.id}/trips`);
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) setError('Your session has expired. Please log in again.');
      else setError(`We're having trouble connecting. Please try again. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadRides();
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
            <Link to="/" className="hover:text-green-400 transition">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">My Rides</h1>
          <p className="text-slate-500 mt-1">
            {user ? `Hi ${user.name}, here's your ride history.` : 'Sign in to see your rides.'}
          </p>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
            <LogIn className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Log in to see your rides</h2>
            <p className="text-slate-500 text-sm mb-6">Your upcoming, active and completed rides will appear here.</p>
            <Link to="/login" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition">
              Log in
            </Link>
          </div>
        ) : (
          <>
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
                  <RideCard key={ride.id} ride={ride} onTrack={handleTrack} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
