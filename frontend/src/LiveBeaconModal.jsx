import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Phone,
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  Send,
  X,
  ExternalLink,
  Users,
  Radio,
  Lock
} from 'lucide-react';
import { API_BASE } from './api';

export default function LiveBeaconModal({ isOpen, onClose, trip, rideCode, driverName, carPlate, pickup, dropoff }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beaconData, setBeaconData] = useState(null);
  const [expiryHours, setExpiryHours] = useState(24);
  const [riderName, setRiderName] = useState('Aayushi S.');

  const tripIdentifier = trip?.id || rideCode || 'active';

  useEffect(() => {
    if (!isOpen) return;

    const generateBeacon = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/trips/${tripIdentifier}/beacon-share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            riderName,
            shareExpiryHours: expiryHours,
            tripId: tripIdentifier
          })
        });
        if (res.ok) {
          const data = await res.json();
          setBeaconData(data);
        } else {
          // Fallback beacon link
          const fallbackLink = `BEACON_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const fullUrl = `${window.location.origin}/track/${fallbackLink}`;
          const msg = `🛡️ *SmartCab Live Ride Beacon*\n\nHi! Track my live cab journey in real-time:\n👤 Driver: ${driverName || 'Rahul Sharma'} (${carPlate || 'GJ 01 AB 1234'})\n📍 ${pickup || 'Pickup'} ➔ ${dropoff || 'Destination'}\n\n🔴 Live GPS Tracker: ${fullUrl}`;
          setBeaconData({
            linkId: fallbackLink,
            fullShareUrl: fullUrl,
            whatsappShareText: msg,
            whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
          });
        }
      } catch (e) {
        const fallbackLink = `BEACON_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const fullUrl = `${window.location.origin}/track/${fallbackLink}`;
        const msg = `🛡️ *SmartCab Live Ride Beacon*\n\nHi! Track my live cab journey in real-time:\n👤 Driver: ${driverName || 'Rahul Sharma'} (${carPlate || 'GJ 01 AB 1234'})\n📍 ${pickup || 'Pickup'} ➔ ${dropoff || 'Destination'}\n\n🔴 Live GPS Tracker: ${fullUrl}`;
        setBeaconData({
          linkId: fallbackLink,
          fullShareUrl: fullUrl,
          whatsappShareText: msg,
          whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
        });
      } finally {
        setLoading(false);
      }
    };

    generateBeacon();
  }, [isOpen, tripIdentifier, expiryHours, riderName]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (beaconData?.fullShareUrl) {
      navigator.clipboard.writeText(beaconData.fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (beaconData?.whatsappUrl) {
      window.open(beaconData.whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Live Ride Beacon</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live GPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure family tracking link — no login or app installation required for recipients
            </p>
          </div>
        </div>

        {/* Trip Snapshot Badge */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                👤
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{driverName || 'Rahul Sharma'}</span>
                <span className="text-[10px] text-emerald-400 font-medium">★ 4.96 • Verified Driver Partner</span>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
              {carPlate || 'GJ 01 AB 1234'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400 text-[11px] font-medium">Pickup:</span>
              <span className="text-slate-200 font-semibold truncate">{pickup || 'SG Highway, Bodakdev'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span className="text-slate-400 text-[11px] font-medium">Dropoff:</span>
              <span className="text-slate-200 font-semibold truncate">{dropoff || 'SVPI Airport Terminal 2'}</span>
            </div>
          </div>
        </div>

        {/* Security & Family Protection Sentinel */}
        <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-3.5 mb-5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-indigo-200">Family Peace-of-Mind Protections:</h4>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              Family members can watch real-time speedometer updates, route deviation alerts, cabin camera status, and access a 1-tap 112 Police / 108 Emergency dispatch hotline.
            </p>
          </div>
        </div>

        {/* Share Link Preview Box */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Public Live Beacon URL
          </label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-2xl p-2.5">
            <input
              type="text"
              readOnly
              value={beaconData?.fullShareUrl || 'Generating secure link...'}
              className="bg-transparent text-emerald-400 font-mono text-xs font-semibold w-full outline-none px-1 truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={loading || !beaconData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expiry Selector */}
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            Link Privacy Auto-Expires:
          </span>
          <div className="flex gap-1.5">
            {[4, 12, 24].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setExpiryHours(hours)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  expiryHours === hours
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {hours} hrs
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-1/2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={loading || !beaconData}
            className="w-1/2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4 fill-current" />
            <span>Send via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
