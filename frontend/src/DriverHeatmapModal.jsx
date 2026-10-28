import React, { useState, useEffect } from 'react';
import { 
  Flame, Navigation, Zap, X, MapPin, TrendingUp, Users, Sparkles,
  ArrowRight, ShieldCheck, RefreshCw, Compass
} from 'lucide-react';
import { API_BASE } from './api';

export default function DriverHeatmapModal({
  isOpen,
  onClose,
  onNavigateHotspot = null
}) {
  const [hotspots, setHotspots] = useState([
    { name: "SG Highway Tech Corridor", lat: 23.0728, lng: 72.5165, demandLevel: "HIGH", surgeMultiplier: "1.2x", activeRidersWaiting: 14, bonusPerRide: "+₹20" },
    { name: "SVPI Airport Terminal 1 & 2", lat: 23.0772, lng: 72.6347, demandLevel: "VERY HIGH", surgeMultiplier: "1.4x", activeRidersWaiting: 26, bonusPerRide: "+₹40" },
    { name: "GIFT City Financial Zone", lat: 23.1601, lng: 72.6841, demandLevel: "MODERATE", surgeMultiplier: "1.25x", activeRidersWaiting: 11, bonusPerRide: "+₹25" },
    { name: "Sindhu Bhavan Road Hub", lat: 23.0450, lng: 72.5020, demandLevel: "HIGH", surgeMultiplier: "1.3x", activeRidersWaiting: 18, bonusPerRide: "+₹30" },
    { name: "Kalupur Railway Station", lat: 23.0253, lng: 72.6012, demandLevel: "MODERATE", surgeMultiplier: "1.15x", activeRidersWaiting: 9, bonusPerRide: "+₹15" },
    { name: "Prahlad Nagar Corporate Road", lat: 23.0118, lng: 72.5085, demandLevel: "MODERATE", surgeMultiplier: "1.15x", activeRidersWaiting: 8, bonusPerRide: "+₹15" }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchHotspots = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/driver/hotspots`);
        if (res.ok) {
          const data = await res.json();
          if (data.hotspots) setHotspots(data.hotspots);
        }
      } catch (e) {}
    };
    fetchHotspots();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-orange-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-orange-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="h-4 w-4" />
            <span>Ahmedabad Live Demand Radar</span>
          </div>
          <h2 className="text-2xl font-black">
            High-Surge Hotspot Zones
          </h2>
          <p className="text-orange-100 text-xs mt-1">
            Drive towards these high-demand zones to get instant bookings with up to 2.2x surge bonus
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>High-Demand Ahmedabad Clusters</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Dispatch Feed
            </span>
          </div>

          <div className="space-y-2.5">
            {hotspots.map((h, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/50 transition flex items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{h.name}</span>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {h.surgeMultiplier} Surge
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Users className="h-3.5 w-3.5" /> {h.activeRidersWaiting} riders looking
                    </span>
                    <span className="text-emerald-400 font-black">
                      {h.bonusPerRide} bonus / ride
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateHotspot) onNavigateHotspot(h);
                    alert(`🧭 GPS set towards ${h.name} (${h.surgeMultiplier} Surge). Safe driving!`);
                    onClose();
                  }}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Navigate</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Surge multipliers update dynamically every 60 seconds.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
}
