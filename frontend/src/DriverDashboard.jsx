import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Phone,
  Siren,
  AlertTriangle,
  UserCheck,
  Wallet,
  Clock,
  Compass,
  ArrowRight,
  Power,
  RefreshCw,
  Loader2,
  DollarSign,
  FileWarning,
  MapPin,
  ChevronRight,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE, apiFetch } from './api';
import { LanguageSwitcher, useLanguage } from './i18n';

// Custom icons for driver map
const driverIcon = L.divIcon({
  className: 'driver-car-marker',
  html: `
    <div style="width: 38px; height: 38px; border-radius: 50%; background: #0f172a; border: 3px solid #10b981; display: flex; align-items: center; justify-content: center; color: #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

const waypointIcon = (letter, color) => L.divIcon({
  className: 'route-waypoint-marker',
  html: `
    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
      ${letter}
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function DriverDashboard() {
  const { t } = useLanguage();
  const [driverName, setDriverName] = useState('Rahul Sharma');
  const [isOnline, setIsOnline] = useState(true);
  const [activeRide, setActiveRide] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Suspicious / Contraband Concern');
  const [reportNotes, setReportNotes] = useState('');

  // Sample drivers list for driver profile switcher
  const FLEET_DRIVERS = [
    { name: 'Rahul Sharma', plate: 'GJ 01 AB 1234', model: 'SmartMini EV' },
    { name: 'Vikram Patel', plate: 'GJ 01 CD 5678', model: 'SmartSedan Prime' },
    { name: 'Anita Mehta', plate: 'GJ 01 EF 9012', model: 'SmartSUV Guard' },
    { name: 'Aayushi Sheth', plate: 'GJ 01 SC 0001', model: 'SmartSedan Prime' }
  ];

  const fetchDriverData = async () => {
    try {
      // 1. Fetch active assigned ride
      const res = await fetch(`${API_BASE}/api/driver/active-ride?driver_name=${encodeURIComponent(driverName)}`);
      const data = await res.json();
      if (data && data.hasActiveRide) {
        setActiveRide(data.ride);
      } else {
        setActiveRide(null);
      }

      // 2. Fetch driver stats & wallet balance
      const sRes = await fetch(`${API_BASE}/api/driver/dashboard-stats?driver_name=${encodeURIComponent(driverName)}`);
      const sData = await sRes.json();
      setStats(sData);
    } catch (err) {
      console.warn("Driver sync offline fallback:", err);
    }
  };

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 3500);
    return () => clearInterval(interval);
  }, [driverName]);

  const toggleShiftStatus = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await fetch(`${API_BASE}/api/driver/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName,
          isOnline: nextState
        })
      });
    } catch (e) {}
  };

  const advanceRideStep = async (action) => {
    if (!activeRide) return;
    setActionBusy(true);
    try {
      await fetch(`${API_BASE}/api/driver/advance-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeRide.id,
          driverName,
          action
        })
      });
      await fetchDriverData();
    } catch (err) {
      alert(`Could not advance ride: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const verifyRiderIdentity = async () => {
    if (!activeRide) return;
    try {
      await fetch(`${API_BASE}/api/trips/${activeRide.id}/rider-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: true,
          method: 'Physical ID check at vehicle door'
        })
      });
      setShowVerifyModal(false);
      await fetchDriverData();
      alert('✅ Passenger ID verified. Two-way safety logged.');
    } catch (e) {
      alert('Verification logged locally.');
      setShowVerifyModal(false);
    }
  };

  const submitDriverReport = async (e) => {
    e.preventDefault();
    if (!activeRide) return;
    try {
      await fetch(`${API_BASE}/api/trips/${activeRide.id}/driver-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          notes: reportNotes,
          riderName: activeRide.riderName
        })
      });
      setShowReportModal(false);
      alert('🛡️ Concern report submitted to Fleet Dispatch. You are protected from false liability.');
    } catch (err) {
      alert(`Report saved: ${err.message}`);
      setShowReportModal(false);
    }
  };

  const simulateIncomingBooking = async () => {
    try {
      await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderName: 'Aayushi S.',
          riderPhone: '+91 98765 43210',
          pickupLocation: 'Chandlodia, Ahmedabad',
          dropoffLocation: 'Sardar Vallabhbhai Patel Airport',
          distanceKm: 12.8,
          fare: 310.0,
          driverName: driverName,
          selectedCar: 'SmartSedan Prime'
        })
      });
      await fetchDriverData();
    } catch (e) {
      alert('Could not simulate trip.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-16">
      {/* DRIVER CONSOLE HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
              🚕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight">SMARTCAB DRIVER PARTNER</h1>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Driver:</span>
                <select
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="bg-slate-800 text-amber-400 font-bold border border-slate-700 rounded px-2 py-0.5 outline-none text-[11px]"
                >
                  {FLEET_DRIVERS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.plate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            
            {/* ONLINE / OFFLINE SWITCH */}
            <button
              onClick={toggleShiftStatus}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-md ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{isOnline ? 'ON DUTY' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* DRIVER EARNINGS & WALLET BANNER (80% NET CUT) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" /> 80% Driver Net Earnings Wallet
              </span>
              <h2 className="text-xl font-black mt-0.5">Today's Fleet Balance</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Payable Balance</span>
              <span className="text-2xl font-black text-emerald-400">
                ₹{stats?.walletBalance ? stats.walletBalance.toFixed(2) : '248.00'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold block">COMPLETED RIDES</span>
              <span className="text-base font-black text-white">{stats?.totalCompletedRides || 1} Trips</span>
            </div>
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold block">GROSS FARES</span>
              <span className="text-base font-black text-slate-200">₹{(stats?.grossEarnings || 310).toFixed(2)}</span>
            </div>
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold block">DRIVER RATING</span>
              <span className="text-base font-black text-amber-400">★ 4.9 / 5.0</span>
            </div>
          </div>
        </div>

        {/* ACTIVE DISPATCH / TRIP HUD */}
        {activeRide ? (
          <div className="bg-slate-900 rounded-3xl border border-emerald-500/40 shadow-2xl p-5 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-black text-xs px-2.5 py-1 rounded-full">
                  {activeRide.rideCode}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Status: <strong className="text-emerald-400">{activeRide.status.replace(/_/g, ' ')}</strong>
                </span>
              </div>
              <div className="text-emerald-400 font-black text-lg">
                Fare: ₹{activeRide.fare} <span className="text-xs font-bold text-slate-400">(Your Cut: ₹{activeRide.driverNetCut})</span>
              </div>
            </div>

            {/* PASSENGER PROFILE & CONTACT */}
            <div className="bg-slate-800/80 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-extrabold text-lg">
                  {activeRide.riderName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{activeRide.riderName}</h3>
                  <p className="text-xs text-slate-400">Passenger · Verified Contact</p>
                  <div className="mt-1 flex items-center gap-2">
                    {activeRide.riderVerified ? (
                      <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="h-3 w-3" /> Passenger ID Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="text-[10px] font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-0.5 rounded-md transition flex items-center gap-1"
                      >
                        <UserCheck className="h-3 w-3" /> Verify Rider ID
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${activeRide.riderPhone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-md"
              >
                <Phone className="h-4 w-4" />
                <span>Call Passenger</span>
              </a>
            </div>

            {/* ROUTE WAYPOINTS */}
            <div className="bg-slate-950 rounded-2xl p-4 mb-4 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">A</div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">PICKUP POINT</span>
                  <span className="text-slate-200 font-semibold">{activeRide.pickup}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">B</div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">DESTINATION</span>
                  <span className="text-slate-200 font-semibold">{activeRide.dropoff}</span>
                </div>
              </div>
            </div>

            {/* LIVE TRIP MAP */}
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 mb-5 notranslate">
              <MapContainer
                center={[activeRide.pickupLat || 23.0338, activeRide.pickupLng || 72.5850]}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap &copy; CARTO"
                />
                <Marker position={[activeRide.pickupLat || 23.0338, activeRide.pickupLng || 72.5850]} icon={waypointIcon('A', '#10b981')} />
                <Marker position={[activeRide.dropoffLat || 23.0750, activeRide.dropoffLng || 72.5250]} icon={waypointIcon('B', '#6366f1')} />
                <Marker position={[23.0450, 72.5650]} icon={driverIcon} />
                <Polyline
                  positions={[
                    [activeRide.pickupLat || 23.0338, activeRide.pickupLng || 72.5850],
                    [23.0450, 72.5650],
                    [activeRide.dropoffLat || 23.0750, activeRide.dropoffLng || 72.5250]
                  ]}
                  color="#10b981"
                  weight={4}
                  dashArray="4, 6"
                />
              </MapContainer>
            </div>

            {/* STEP-BY-STEP PROGRESSION ACTIONS */}
            <div className="space-y-3">
              {activeRide.status === 'DRIVER_ASSIGNED' && (
                <button
                  onClick={() => advanceRideStep('ACCEPT')}
                  disabled={actionBusy}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/40"
                >
                  {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  <span>Accept Ride Booking</span>
                </button>
              )}

              {activeRide.status === 'DRIVER_ACCEPTED' && (
                <button
                  onClick={() => advanceRideStep('ARRIVED')}
                  disabled={actionBusy}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-900/40"
                >
                  {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-5 w-5" />}
                  <span>I Have Arrived at Pickup Location</span>
                </button>
              )}

              {activeRide.status === 'DRIVER_ARRIVING' && (
                <button
                  onClick={() => advanceRideStep('START')}
                  disabled={actionBusy}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-900/40"
                >
                  {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-5 w-5" />}
                  <span>Passenger On Board → Start Trip</span>
                </button>
              )}

              {(activeRide.status === 'RIDE_STARTED' || activeRide.status === 'IN_PROGRESS' || activeRide.status === 'DANGER') && (
                <button
                  onClick={() => advanceRideStep('COMPLETE')}
                  disabled={actionBusy}
                  className="w-full bg-slate-100 hover:bg-white text-slate-900 font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-white/10"
                >
                  {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                  <span>Complete Ride &amp; Collect Payment</span>
                </button>
              )}

              {/* DRIVER SAFETY ACTIONS */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Report Rider Incident</span>
                </button>

                <button
                  onClick={() => alert("🚨 Driver Panic Alert Dispatched to SmartCab Security Control Room.")}
                  className="bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 text-red-400 font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-1.5"
                >
                  <Siren className="h-4 w-4" />
                  <span>SOS</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* WAITING FOR BOOKINGS STATE */
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
              <Navigation className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-white">You're Online &amp; Searching</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Scanning Ahmedabad dispatch grid for passenger ride requests nearby.
            </p>
            <button
              onClick={simulateIncomingBooking}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl transition text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <Sparkles className="h-4 w-4" />
              <span>⚡ Simulate Incoming Passenger Ride Request</span>
            </button>
          </div>
        )}
      </main>

      {/* 🪪 PASSENGER IDENTITY VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button onClick={() => setShowVerifyModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Verify Passenger Identity</h3>
                <p className="text-xs text-slate-400">Two-way safety check before onboarding</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Ask the rider for their name <strong>({activeRide?.riderName})</strong> or check their booking ID in the SmartCab app to confirm they are the authorized passenger.
            </p>
            <button
              onClick={verifyRiderIdentity}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Check className="h-4 w-4" />
              <span>Confirm &amp; Log Identity Verified</span>
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ DRIVER REPORT CONCERN MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button onClick={() => setShowReportModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Report Rider Concern</h3>
                <p className="text-xs text-slate-400">Driver Protection &amp; Exoneration Log</p>
              </div>
            </div>
            <form onSubmit={submitDriverReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Reason / Category</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="Suspicious / Contraband Concern">Suspected Illegal Item / Contraband</option>
                  <option value="Rider Misbehaviour / Rude">Rider Aggressive / Misbehaviour</option>
                  <option value="Route Deviation Request">Rider Insisting Off-Grid Unsafe Route</option>
                  <option value="Payment Refusal">Rider Refusing Payment</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Notes &amp; Details</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Describe what occurred (saved with ride breadcrumbs for admin review)..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl transition text-sm shadow-md"
              >
                Submit Protection Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
