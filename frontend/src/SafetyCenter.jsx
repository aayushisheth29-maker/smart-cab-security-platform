import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Siren, MapPin, Users, Video, Loader2, Phone,
  Copy, Check, Smartphone, AlertTriangle, Share2, Plus, Trash2,
} from 'lucide-react';
import { apiFetch } from './api';

function readLastRide() {
  try {
    return JSON.parse(localStorage.getItem('smartcab_last_ride') || 'null');
  } catch (e) {
    return null;
  }
}

function readContacts() {
  try {
    const saved = JSON.parse(localStorage.getItem('smartcab_guest_contacts') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function saveLocalContacts(contacts) {
  try {
    localStorage.setItem('smartcab_guest_contacts', JSON.stringify(contacts));
  } catch (e) { /* noop */ }
}

function Card({ icon: Icon, tone = 'slate', title, subtitle, children, action }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
      <div className="flex items-start gap-4 mb-3">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function SafetyCenter() {
  const [user, setUser] = useState(null);
  const [lastRide, setLastRide] = useState(readLastRide);
  const [contacts, setContacts] = useState([]);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [sosActive, setSosActive] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [contactBusy, setContactBusy] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);
  const [routeCheck, setRouteCheck] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('smartcab_user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch (e) { /* noop */ }
    setContacts(readContacts());
    if (lastRide && lastRide.contacts) setContacts(lastRide.contacts);
  }, []);

  const persistContacts = (next) => {
    setContacts(next);
    saveLocalContacts(next);
    if (user && user.id) {
      apiFetch(`/api/users/${user.id}/emergency-contacts`, { method: 'POST', body: JSON.stringify(next[next.length - 1]) }).catch(() => {});
    }
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    persistContacts([...contacts, { name: newContact.name.trim(), phone: newContact.phone.trim() }]);
    setNewContact({ name: '', phone: '' });
  };

  const removeContact = (phone) => {
    persistContacts(contacts.filter((c) => c.phone !== phone));
  };

  const triggerSos = async () => {
    setSosLoading(true);
    try {
      const payload = {
        bookingId: lastRide?.bookingId ? String(lastRide.bookingId) : null,
        rideCode: lastRide?.rideCode || null,
        riderName: user?.name || lastRide?.riderName || 'Rider',
        driverName: lastRide?.driver?.name || '',
        carPlate: lastRide?.driver?.plate || '',
        pickup: lastRide?.pickup || '',
        dropoff: lastRide?.dropoff || '',
        lat: lastRide?.lat ?? null,
        lng: lastRide?.lng ?? null,
        contacts,
        reason: 'Manual SOS',
      };
      const data = await apiFetch('/api/emergency', { method: 'POST', body: JSON.stringify(payload) });
      setSosActive(data);
      setShowSosConfirm(false);
    } catch (err) {
      setNotice(`SOS could not reach the server: ${err.message}`);
      setShowSosConfirm(false);
    } finally {
      setSosLoading(false);
    }
  };

  const shareLiveRide = async () => {
    setShareBusy(true);
    setCopied(false);
    try {
      const ride = readLastRide();
      const data = await apiFetch('/api/safety/share-ride', {
        method: 'POST',
        body: JSON.stringify({
          rideCode: ride?.rideCode,
          riderName: user?.name || ride?.riderName || 'Rider',
          driverName: ride?.driver?.name || 'Verified Driver',
          carPlate: ride?.driver?.plate || '',
          carModel: ride?.driver?.carModel || 'SmartCab',
          pickup: ride?.pickup || '',
          dropoff: ride?.dropoff || '',
          lat: ride?.lat ?? undefined,
          lng: ride?.lng ?? undefined,
          contacts,
          notifyContacts: true,
        }),
      });
      setShareLink(`${window.location.origin}${data.trackUrl}`);
      if (data.notification) setNotifyResult(data.notification);
    } catch (err) {
      setNotice(`Could not create share link: ${err.message}`);
    } finally {
      setShareBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* noop */ }
  };

  const checkRoute = async () => {
    if (!navigator.geolocation) {
      setNotice('Geolocation is not available on this device.');
      return;
    }
    setRouteBusy(true);
    setNotice('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const ride = readLastRide();
          const data = await apiFetch('/api/ai/route-safety/check', {
            method: 'POST',
            body: JSON.stringify({
              pickupLat: ride?.pickupLat ?? null,
              pickupLng: ride?.pickupLng ?? null,
              dropoffLat: ride?.dropoffLat ?? null,
              dropoffLng: ride?.dropoffLng ?? null,
              currentLat: pos.coords.latitude,
              currentLng: pos.coords.longitude,
              rideCode: ride?.rideCode || null,
            }),
          });
          setRouteCheck(data);
        } catch (err) {
          setNotice(`Route check failed: ${err.message}`);
        } finally {
          setRouteBusy(false);
        }
      },
      () => {
        setNotice('📍 Location access is needed for the route check. Please enable location and try again.');
        setRouteBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:text-slate-300 transition">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-green-400" />
              <span className="font-extrabold text-xl">SmartCab</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/" className="hover:text-green-400 transition">Book Ride</Link>
            <Link to="/rides" className="hover:text-green-400 transition">My Rides</Link>
            <Link to="/safety" className="text-green-400">Safety Center</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <ShieldCheck className="h-4 w-4" /> You're protected
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Safety Center</h1>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
            One place for every safety feature — emergency SOS, live ride sharing, trusted contacts and route monitoring.
          </p>
        </div>

        {lastRide && (
          <div className="bg-slate-900 text-white rounded-2xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-bold tracking-wide">ACTIVE RIDE</div>
              <div className="font-extrabold text-lg">{lastRide.rideCode || '—'}</div>
              <div className="text-sm text-slate-300">
                {lastRide.driver?.name || 'Driver'} · {lastRide.driver?.carModel || ''} {lastRide.driver?.plate || ''}
              </div>
            </div>
            <Link to={`/track/${lastRide.linkId || ''}`} className="bg-green-500 text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-400 transition" onClick={(e) => { if (!lastRide.linkId) { e.preventDefault(); setNotice('Book a ride and tap "Share Live Location" to create a tracking link.'); } }}>
              Track ride
            </Link>
          </div>
        )}

        {notice && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 flex items-start justify-between gap-3">
            <span>⚠️ {notice}</span>
            <button onClick={() => setNotice('')} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* SOS ACTIVE STATE */}
        {sosActive && (
          <div className="mb-8 bg-red-600 text-white rounded-3xl p-6 shadow-lg shadow-red-200 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <Siren className="h-8 w-8" />
              <h2 className="text-2xl font-extrabold">EMERGENCY ALERT ACTIVE</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
              <div><span className="text-red-200">Ride ID:</span> <strong>{sosActive.rideCode || '—'}</strong></div>
              <div><span className="text-red-200">Driver:</span> <strong>{sosActive.driverName || '—'}</strong></div>
              <div><span className="text-red-200">Vehicle:</span> <strong>{sosActive.carPlate || '—'}</strong></div>
              <div><span className="text-red-200">Location:</span> <strong>{sosActive.lat ? `${sosActive.lat.toFixed(5)}, ${sosActive.lng?.toFixed(5)}` : 'recording…'}</strong></div>
            </div>
            <div className="bg-red-700/50 rounded-2xl p-4 text-sm mb-5">
              <div className="font-bold mb-2">Alert status</div>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Emergency alert created</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Location recorded</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Emergency contacts notified ({sosActive.checklist?.contacts?.length || 0})</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              {sosActive.quickDial?.map((d) => (
                <a key={d.number} href={`tel:${d.number}`} className="bg-white text-red-700 font-extrabold px-5 py-3 rounded-xl hover:bg-red-50 transition inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {d.label} · {d.number}
                </a>
              ))}
            </div>
            <p className="text-xs text-red-100 mt-4">⚠️ {sosActive.notice}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* SOS */}
          <Card
            icon={Siren} tone="red" title="Emergency SOS" subtitle="Get help during your ride"
            action={<span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">24/7</span>}
          >
            {!sosActive && (
              <button
                onClick={() => setShowSosConfirm(true)}
                className="w-full bg-red-600 text-white font-extrabold py-4 rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <Siren className="h-6 w-6" /> Trigger Emergency SOS
              </button>
            )}
            {sosActive && (
              <button onClick={() => setSosActive(null)} className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl hover:bg-slate-200 transition">
                Dismiss alert (safety team notified)
              </button>
            )}
          </Card>

          {/* Share live ride */}
          <Card icon={Share2} tone="green" title="Share Live Ride" subtitle="Share your location with family" action={<span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">24h link</span>}>
            <button
              onClick={shareLiveRide}
              disabled={shareBusy}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {shareBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
              {shareBusy ? 'Creating secure link…' : 'Create & share tracking link'}
            </button>
            {shareLink && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="text-xs text-green-700 font-bold mb-2 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Live tracking link ready</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 truncate">{shareLink}</code>
                  <button onClick={copyLink} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {notifyResult && (
                  <div className="mt-3 text-xs text-green-800">
                    <div className="font-bold mb-1">
                      {notifyResult.transport === 'twilio' ? 'SMS sent to contacts' : 'Message preview (SMS provider not configured)'}
                    </div>
                    <pre className="whitespace-pre-wrap bg-white border border-green-200 rounded-lg p-2 text-[11px]">{notifyResult.message}</pre>
                    {notifyResult.note && <p className="text-amber-700 mt-1">{notifyResult.note}</p>}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Emergency contacts */}
          <Card icon={Users} tone="blue" title="Emergency Contacts" subtitle="Manage trusted contacts">
            <div className="space-y-2 mb-4">
              {contacts.length === 0 ? (
                <p className="text-sm text-slate-400">No trusted contacts yet. Add someone so SOS alerts reach them.</p>
              ) : (
                contacts.map((c) => (
                  <div key={c.phone} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="text-sm">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-slate-500 text-xs">{c.phone}</div>
                    </div>
                    <button onClick={() => removeContact(c.phone)} className="text-red-400 hover:text-red-600 transition p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Name (e.g. Mom)"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+91 …"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <button onClick={addContact} disabled={contactBusy} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </Card>

          {/* Live Guard */}
          <Card icon={Video} tone="amber" title="Live Guard" subtitle="Camera & evidence features" action={<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">On</span>}>
            <p className="text-sm text-slate-500 mb-4">
              After booking a ride, open <strong>Live Guard</strong> from the ride screen to stream
              camera evidence to your family's tracking page. Clips are uploaded every few seconds
              and kept in a rolling buffer.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p>Every share link <strong>auto-expires after 24 hours</strong> for your privacy. You can always create a new one.</p>
            </div>
          </Card>

          {/* Route monitoring */}
          <Card icon={AlertTriangle} tone="amber" title="Route Monitoring" subtitle="Check your position against the expected route" action={<button onClick={checkRoute} disabled={routeBusy} className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-800" >
              {routeBusy ? 'Checking…' : 'Check now'}
            </button>}>
            {routeCheck ? (
              <div className={`rounded-xl p-4 text-sm ${routeCheck.status === 'DEVIATION' ? 'bg-red-50 border border-red-200' : routeCheck.status === 'WARNING' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="font-bold mb-1">
                  {routeCheck.status === 'DEVIATION' ? '⚠️ Route deviation detected' : routeCheck.status === 'WARNING' ? '⚠️ Route deviation warning' : '✅ Vehicle is on the expected route'}
                </div>
                {routeCheck.distanceFromRouteMeters != null && (
                  <p className="text-slate-600">Vehicle is approximately <strong>{Math.round(routeCheck.distanceFromRouteMeters)} m</strong> from the expected route (threshold {routeCheck.thresholdMeters} m).</p>
                )}
                <p className="text-xs text-slate-400 mt-2">{routeCheck.honestNote}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">We compare your live GPS position against the pickup → dropoff route. If you're more than 500 m off, you get a clear warning — a rule-based check, not a guess.</p>
            )}
          </Card>
        </div>
      </main>

      {/* SOS CONFIRMATION MODAL */}
      {showSosConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="bg-red-50 rounded-2xl p-5 mb-5 text-center">
              <Siren className="h-10 w-10 text-red-600 mx-auto mb-2" />
              <h2 className="text-xl font-extrabold text-slate-900">Emergency assistance</h2>
              <p className="text-slate-600 text-sm mt-1">Are you sure you want to trigger an emergency alert?</p>
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 mb-5 space-y-1">
              <div><strong>Ride ID:</strong> {lastRide?.rideCode || (sosActive?.bookingId ? `#${sosActive.bookingId}` : '—')}</div>
              <div><strong>Driver:</strong> {lastRide?.driver?.name || '—'}</div>
              <div><strong>Vehicle:</strong> {lastRide?.driver?.plate || '—'}</div>
              <div><strong>Contacts:</strong> {contacts.length ? contacts.map((c) => c.name).join(', ') : 'none added'}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSosConfirm(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition">
                Cancel
              </button>
              <button onClick={triggerSos} disabled={sosLoading} className="flex-1 bg-red-600 text-white font-extrabold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {sosLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Siren className="h-5 w-5" />} Confirm SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
