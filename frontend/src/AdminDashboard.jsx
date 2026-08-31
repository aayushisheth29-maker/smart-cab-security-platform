import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Car, Siren, Users, RefreshCw, Loader2,
  MapPin, CheckCircle2, LogOut, Lock, Activity, Route as RouteIcon, Mail,
} from 'lucide-react';
import { apiFetch, getAdminKey, storeAdminKey, API_BASE } from './api';

const STATUS_META = {
  REQUESTED: 'bg-slate-100 text-slate-700',
  DRIVER_ASSIGNED: 'bg-blue-100 text-blue-700',
  DRIVER_ACCEPTED: 'bg-blue-100 text-blue-700',
  DRIVER_ARRIVING: 'bg-amber-100 text-amber-700',
  RIDE_STARTED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-100 text-red-600',
  DANGER: 'bg-red-600 text-white',
  PENDING: 'bg-amber-100 text-amber-700',
};

// The next valid lifecycle step, used by the admin "advance ride" action
const NEXT_STATUS = {
  DRIVER_ASSIGNED: 'DRIVER_ACCEPTED',
  DRIVER_ACCEPTED: 'DRIVER_ARRIVING',
  DRIVER_ARRIVING: 'RIDE_STARTED',
  RIDE_STARTED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  PENDING: 'DRIVER_ASSIGNED',
};

function StatCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}

export default function AdminDashboard() {
  const [key, setKey] = useState(getAdminKey());
  const [authenticated, setAuthenticated] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [rides, setRides] = useState([]);
  const [driverApps, setDriverApps] = useState([]);
  const [driverAlerts, setDriverAlerts] = useState([]);
  const [supportReqs, setSupportReqs] = useState([]);
  const [bgNotes, setBgNotes] = useState({});
  const [alertNotes, setAlertNotes] = useState({});
  const [reqNotes, setReqNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(null);

  const verifyAndLoad = async (adminKey) => {
    setLoading(true);
    setError('');
    setKeyError('');
    try {
      const [s, e, r, da, als, sr] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/emergencies'),
        apiFetch('/api/admin/rides'),
        apiFetch('/api/admin/driver-applications'),
        apiFetch('/api/admin/driver-alerts'),
        apiFetch('/api/admin/support-requests'),
      ]);
      setStats(s);
      setEmergencies(Array.isArray(e) ? e : []);
      setRides(Array.isArray(r) ? r : []);
      setDriverApps(Array.isArray(da) ? da : []);
      setDriverAlerts(Array.isArray(als) ? als : []);
      setSupportReqs(Array.isArray(sr) ? sr : []);
      setAuthenticated(true);
    } catch (err) {
      if (err.status === 401) {
        setKeyError('Invalid admin key.');
        setAuthenticated(false);
      } else {
        setError(`Could not load the admin dashboard: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    storeAdminKey(key.trim());
    verifyAndLoad(key.trim());
  };

  const refresh = () => verifyAndLoad(key);

  const respondEmergency = async (id) => {
    setActionBusy(`respond-${id}`);
    try {
      await apiFetch(`/api/admin/emergencies/${id}/respond`, { method: 'POST' });
      await refresh();
    } catch (err) {
      setError(`Could not respond: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  const advanceRide = async (ride) => {
    const next = NEXT_STATUS[ride.status];
    if (!next) return;
    setActionBusy(`ride-${ride.id}`);
    try {
      await apiFetch(`/api/admin/rides/${ride.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: next }),
      });
      await refresh();
    } catch (err) {
      setError(`Could not update ride: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  const reviewDriverApp = async (app, decision) => {
    setActionBusy(`app-${app.id}`);
    try {
      await apiFetch(`/api/admin/driver-applications/${app.id}/${decision}`, { method: 'POST' });
      await refresh();
    } catch (err) {
      setError(`Could not ${decision} application: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  // 🛡️ Admin marks the background check CLEARED (safe to approve) or FLAGGED
  // (application is automatically rejected — a bad driver can never join).
  const runBackgroundCheck = async (app, status) => {
    setActionBusy(`bg-${app.id}-${status}`);
    try {
      await apiFetch(`/api/admin/driver-applications/${app.id}/background-check`, {
        method: 'POST',
        body: JSON.stringify({ status, note: (bgNotes[app.id] || '').trim() }),
      });
      await refresh();
    } catch (err) {
      setError(`Could not update background check: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  // Fetch a vault document with the admin key and open it for review.
  const openDriverDocument = async (appId, docId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/driver-applications/${appId}/documents/${docId}`, {
        headers: { 'X-Admin-Key': getAdminKey() },
      });
      if (!res.ok) throw new Error(`Document fetch failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(`Could not open document: ${err.message}`);
    }
  };

  const resolveDriverAlert = async (alert, outcome) => {
    setActionBusy(`alert-${alert.id}-${outcome}`);
    try {
      await apiFetch(`/api/admin/driver-alerts/${alert.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ outcome, note: (alertNotes[alert.id] || '').trim() }),
      });
      await refresh();
    } catch (err) {
      setError(`Could not resolve alert: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  // 💬 RIDER SUPPORT REQUESTS (help widget: report a driver, lost item, etc.)
  const resolveSupportRequest = async (req) => {
    setActionBusy(`req-${req.id}`);
    try {
      await apiFetch(`/api/admin/support-requests/${req.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ note: (reqNotes[req.id] || '').trim() }),
      });
      await refresh();
    } catch (err) {
      setError(`Could not resolve request: ${err.message}`);
    } finally {
      setActionBusy(null);
    }
  };

  const logoutAdmin = () => {
    storeAdminKey('');
    setKey('');
    setAuthenticated(false);
    setStats(null);
    setEmergencies([]);
    setRides([]);
    setDriverApps([]);
    setDriverAlerts([]);
    setSupportReqs([]);
  };

  // ---------------- Lock screen ----------------
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab logo" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-amber-400/40" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Smart Security AI Cab Admin</h1>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Safety Dashboard</p>
            </div>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Admin access key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter admin key"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-600 outline-none"
              />
              {keyError && <p className="text-red-600 text-sm mt-2">⚠️ {keyError}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />} Unlock dashboard
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-4 text-center">Dev key: smartcab-admin-dev-key (set SMARTCAB_ADMIN_KEY in production)</p>
          <Link to="/" className="block text-center text-sm text-slate-500 hover:underline mt-3">← Back to app</Link>
        </div>
      </div>
    );
  }

  const activeRides = rides.filter((r) => ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_ARRIVING', 'RIDE_STARTED', 'IN_PROGRESS', 'DANGER', 'PENDING'].includes(r.status));

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab logo" className="h-10 w-10 rounded-lg object-cover ring-1 ring-amber-400/40" />
            <div>
              <div className="font-extrabold text-lg leading-tight">SMART SECURITY AI CAB ADMIN</div>
              <div className="text-[10px] text-slate-400 tracking-widest uppercase">Safety Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="text-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={logoutAdmin} className="text-sm flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-xl transition">
              <LogOut className="h-4 w-4" /> Lock
            </button>
            <Link to="/" className="text-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition">
              <ArrowLeft className="h-4 w-4" /> App
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-24 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <span className="font-semibold">Loading admin data…</span>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Car} label="Active Rides" value={stats?.activeRides ?? 0} tone="blue" />
              <StatCard icon={Siren} label="Emergency Alerts" value={stats?.emergencyAlerts ?? 0} tone="red" />
              <StatCard icon={Users} label="Drivers Online" value={stats?.driversOnline ?? 0} tone="green" />
              <StatCard icon={RouteIcon} label="Route Deviations" value={stats?.routeDeviations ?? 0} tone="amber" />
              <StatCard icon={CheckCircle2} label="Completed Rides" value={stats?.completedRides ?? 0} tone="green" />
              <StatCard icon={Activity} label="Total Rides" value={stats?.totalRides ?? 0} tone="slate" />
              <StatCard icon={Users} label="Registered Users" value={stats?.totalUsers ?? 0} tone="slate" />
              <StatCard icon={MapPin} label="Active Share Links" value={stats?.activeShareLinks ?? 0} tone="blue" />
            </div>

            {/* Active emergencies */}
            <section className="mb-10">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">ACTIVE EMERGENCIES</h2>
              {emergencies.filter((e) => e.status === 'ACTIVE').length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Siren className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No active emergencies. All clear. ✅
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {emergencies.filter((e) => e.status === 'ACTIVE').map((e) => (
                    <div key={e.id} className="bg-white rounded-2xl border-l-4 border-red-500 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-extrabold text-slate-900">🚨 {e.rideCode || `#${e.bookingId}`}</span>
                        <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-full animate-pulse">ACTIVE</span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 mb-4">
                        <div>Passenger: <strong>{e.riderName || '—'}</strong></div>
                        <div>Driver: <strong>{e.driverName || '—'}</strong> · {e.carPlate || ''}</div>
                        <div className="text-slate-400">📍 {e.pickup || '—'} → {e.dropoff || '—'}</div>
                        <div className="text-xs text-slate-400">Triggered {fmtTime(e.createdAt)}</div>
                        {e.contacts?.length > 0 && <div className="text-xs text-slate-400">Contacts notified: {e.contacts.map((c) => c.name).join(', ')}</div>}
                      </div>
                      <button
                        onClick={() => respondEmergency(e.id)}
                        disabled={actionBusy === `respond-${e.id}`}
                        className="w-full bg-slate-900 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                      >
                        {actionBusy === `respond-${e.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark responded
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Driver applications */}
            <section className="mb-10">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">
                DRIVER APPLICATIONS{' '}
                <span className="text-sm font-bold text-slate-400">({driverApps.filter((a) => a.status === 'PENDING').length} pending)</span>
              </h2>
              {driverApps.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No driver applications yet. When someone taps "Apply to drive", it appears here.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {driverApps.map((app) => (
                    <div key={app.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${app.status === 'PENDING' ? 'border-amber-200' : app.status === 'APPROVED' ? 'border-green-200' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-extrabold text-slate-900">
                          {app.fullName}
                          <span className="block font-mono text-xs text-slate-400">{app.reference}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : app.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 mb-4">
                        <div>📍 {app.city} · 🚗 {app.vehicleType}</div>
                        <div>📞 {app.phone} {app.email ? `· ✉️ ${app.email}` : ''}</div>
                        <div className="text-xs text-slate-400">
                          {app.experienceYears} yr experience · {app.ownVehicle ? 'Owns vehicle' : 'Needs vehicle'} · {fmtTime(app.createdAt)}
                        </div>
                        <div className="text-xs font-semibold">
                          {app.criminalRecordDeclaration
                            ? <span className="text-green-700">✅ Criminal-record declaration signed</span>
                            : <span className="text-red-600">❌ No criminal-record declaration</span>}
                          {app.policeVerificationNumber ? ` · 🛂 Police ref: ${app.policeVerificationNumber}` : ''}
                        </div>
                      </div>

                      {/* 🛡️ Documents — admin reviews before approval */}
                      <div className="mb-3">
                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Verification documents</p>
                        {(app.documents || []).length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">No documents uploaded yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {(app.documents || []).map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => openDriverDocument(app.id, doc.id)}
                                className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition"
                              >
                                📄 {doc.name || doc.type} <span className="text-[9px]">({Math.round((doc.size || 0) / 1024)} KB)</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 🛡️ Background check — must be CLEARED before Approve is allowed */}
                      {app.status === 'PENDING' && (
                        <div className="mb-3 bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-extrabold text-slate-600 mb-2">
                            Background check:{' '}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              app.backgroundCheck?.status === 'CLEARED' ? 'bg-green-100 text-green-700' :
                              app.backgroundCheck?.status === 'FLAGGED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {app.backgroundCheck?.status || 'PENDING'}
                            </span>
                          </p>
                          <textarea
                            value={bgNotes[app.id] || ''}
                            onChange={(e) => setBgNotes((p) => ({ ...p, [app.id]: e.target.value }))}
                            placeholder="Review note (e.g. records verified, docs look genuine)…"
                            rows={2}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 resize-none mb-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => runBackgroundCheck(app, 'CLEARED')}
                              disabled={actionBusy === `bg-${app.id}-CLEARED`}
                              className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                            >
                              {actionBusy === `bg-${app.id}-CLEARED` ? '…' : '🛡 Mark CLEARED'}
                            </button>
                            <button
                              onClick={() => runBackgroundCheck(app, 'FLAGGED')}
                              disabled={actionBusy === `bg-${app.id}-FLAGGED`}
                              className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                            >
                              {actionBusy === `bg-${app.id}-FLAGGED` ? '…' : '🚫 Mark FLAGGED'}
                            </button>
                          </div>
                          {app.backgroundCheck?.note && (
                            <p className="text-[11px] text-slate-500 mt-2">Note: {app.backgroundCheck.note}</p>
                          )}
                        </div>
                      )}

                      {app.status === 'PENDING' && (
                        <>
                          {app.backgroundCheck?.status === 'FLAGGED' && (
                            <p className="text-xs font-bold text-red-600 mb-2">🚫 Background check failed — this driver must NOT be approved. Application was auto-rejected.</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => reviewDriverApp(app, 'approve')}
                              disabled={
                                actionBusy === `app-${app.id}` ||
                                app.backgroundCheck?.status !== 'CLEARED' ||
                                !(app.documents || []).some((d) => d.type === 'licence') ||
                                !(app.documents || []).some((d) => d.type === 'vehicle')
                              }
                              title={app.backgroundCheck?.status === 'CLEARED' ? 'Approve into fleet' : 'Mark background check CLEARED to enable approval'}
                              className="flex-1 bg-green-600 text-white text-sm font-bold py-2 rounded-xl hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {actionBusy === `app-${app.id}` ? '…' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => reviewDriverApp(app, 'reject')}
                              disabled={actionBusy === `app-${app.id}`}
                              className="flex-1 bg-red-50 text-red-600 text-sm font-bold py-2 rounded-xl border border-red-200 hover:bg-red-100 transition disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                          {app.backgroundCheck?.status !== 'CLEARED' && (
                            <p className="text-[11px] text-amber-600 mt-2">
                              🔒 Approve unlocks after: licence + vehicle photo uploaded <strong>and</strong> background check marked CLEARED.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 🛡️ Driver alerts — two-way safety: drivers report rider concerns;
                admin can EXONERATE so an innocent driver is never blamed. */}
            <section className="mb-10">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">
                DRIVER ALERTS{' '}
                <span className="text-sm font-bold text-slate-400">({driverAlerts.filter((a) => a.status === 'OPEN').length} open)</span>
              </h2>
              {driverAlerts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No driver alerts yet. Drivers can report rider concerns during a ride.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {driverAlerts.map((alert) => (
                    <div key={alert.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${alert.status === 'OPEN' ? 'border-purple-200' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-extrabold text-slate-900">
                          {alert.reason}
                          <span className="block font-mono text-xs text-slate-400">{alert.reference || `ALERT-${alert.id}`}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${alert.status === 'OPEN' ? 'bg-purple-100 text-purple-700' : alert.driverExonerated ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {alert.status}{alert.driverExonerated ? ' · EXONERATED' : ''}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 mb-3">
                        <div>🧑‍✈️ Driver: {alert.driverName || '—'} · 🚕 Ride: {alert.rideCode || `#${alert.tripId}`}</div>
                        <div>🧍 Rider: {alert.riderName || '—'} · {fmtTime(alert.createdAt)}</div>
                        {alert.notes && <div className="text-xs text-slate-500">📝 {alert.notes}</div>}
                        {Array.isArray(alert.evidence) && alert.evidence.length > 0 && (
                          <div className="text-xs font-bold text-blue-600">📎 {alert.evidence.length} evidence file(s) attached</div>
                        )}
                      </div>
                      {alert.status === 'OPEN' && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <textarea
                            value={alertNotes[alert.id] || ''}
                            onChange={(e) => setAlertNotes((p) => ({ ...p, [alert.id]: e.target.value }))}
                            placeholder="Admin note (e.g. verified with rider, no driver fault)…"
                            rows={2}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveDriverAlert(alert, 'EXONERATED')}
                              disabled={actionBusy === `alert-${alert.id}-EXONERATED`}
                              className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                            >
                              {actionBusy === `alert-${alert.id}-EXONERATED` ? '…' : '🛡 Exonerate driver'}
                            </button>
                            <button
                              onClick={() => resolveDriverAlert(alert, 'RESOLVED')}
                              disabled={actionBusy === `alert-${alert.id}-RESOLVED`}
                              className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition disabled:opacity-60"
                            >
                              {actionBusy === `alert-${alert.id}-RESOLVED` ? '…' : 'Resolve'}
                            </button>
                          </div>
                          {alert.status !== 'OPEN' && !alert.driverExonerated && (
                            <p className="text-[11px] text-slate-500 mt-2">Resolved without exoneration.</p>
                          )}
                        </div>
                      )}
                      {alert.resolvedAt && (
                        <p className="text-[11px] text-slate-400 mt-2">
                          {alert.driverExonerated ? '✅ Driver exonerated' : 'Resolved'} at {fmtTime(alert.resolvedAt)}{alert.resolutionNote ? ` · ${alert.resolutionNote}` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 💬 Rider support / help requests */}
            <section className="mb-10">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">
                SUPPORT REQUESTS{' '}
                <span className="text-sm font-bold text-slate-400">({supportReqs.filter((r) => r.status === 'OPEN').length} open)</span>
              </h2>
              {supportReqs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No support requests yet. Riders can report a driver / ask for help from the Help widget.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {supportReqs.map((req) => (
                    <div key={req.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${req.status === 'OPEN' ? 'border-amber-200' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-extrabold text-slate-900">
                          {req.category?.replace(/_/g, ' ')}
                          <span className="block font-mono text-xs text-slate-400">{req.reference}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${req.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 mb-3">
                        <div>👤 {req.name || 'Guest'} {req.email ? `· ✉️ ${req.email}` : ''}</div>
                        {req.rideCode && <div>🚕 Ride: <span className="font-mono">{req.rideCode}</span></div>}
                        <div className="text-xs text-slate-500">🌐 {req.language || 'en'} · {fmtTime(req.createdAt)}</div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap">{req.message}</div>
                      </div>
                      {req.status === 'OPEN' ? (
                        <div className="flex gap-2">
                          <input
                            value={reqNotes[req.id] || ''}
                            onChange={(e) => setReqNotes((p) => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="Resolution note…"
                            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            onClick={() => resolveSupportRequest(req)}
                            disabled={actionBusy === `req-${req.id}`}
                            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-700 transition disabled:opacity-60"
                          >
                            {actionBusy === `req-${req.id}` ? '…' : '✓ Resolve'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">Resolved {fmtTime(req.resolvedAt)}{req.resolutionNote ? ` · ${req.resolutionNote}` : ''}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Active rides */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">ACTIVE RIDES</h2>
              {activeRides.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No active rides right now.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-4 py-3">Ride ID</th>
                          <th className="px-4 py-3">Route</th>
                          <th className="px-4 py-3">Driver</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Fare</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeRides.map((r) => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.rideCode || `SC-${String(r.id).padStart(6, '0')}`}</td>
                            <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                              <span className="block truncate">{r.pickupLocation} → {r.dropoffLocation}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{r.driver?.name || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${STATUS_META[r.status] || 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">₹{r.fare ?? '—'}</td>
                            <td className="px-4 py-3">
                              {NEXT_STATUS[r.status] ? (
                                <button
                                  onClick={() => advanceRide(r)}
                                  disabled={actionBusy === `ride-${r.id}`}
                                  className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                                >
                                  {actionBusy === `ride-${r.id}` ? '…' : `→ ${NEXT_STATUS[r.status].replace(/_/g, ' ').toLowerCase()}`}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
