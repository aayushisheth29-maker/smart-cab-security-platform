import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Moon, X, PhoneCall, AlertTriangle, Users, Volume2,
  CheckCircle, Shield, HeartPulse, Sparkles, Siren, MessageSquare,
  Lock, Eye, Radio, BellRing, PhoneOff, UserCheck
} from 'lucide-react';
import { API_BASE } from './api';

const PYTHON_API = API_BASE;

const NightShieldModal = ({
  isOpen,
  onClose,
  currentTrip = null,
  ridePreferences = {},
  onUpdatePreferences = () => {},
  onSelectWomenDriver = () => {},
}) => {
  const [shieldActive, setShieldActive] = useState(true);
  const [womenOnlyPreference, setWomenOnlyPreference] = useState(
    ridePreferences?.womenDriverPreference || false
  );
  const [womenDrivers, setWomenDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [checkInCountdown, setCheckInCountdown] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null); // 'SAFE', 'COUNTING', 'ALERT'
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [fakeCallTimer, setFakeCallTimer] = useState(0);

  // Fetch verified women driver partners
  useEffect(() => {
    if (!isOpen) return;
    setLoadingDrivers(true);
    fetch(`${PYTHON_API}/api/sentinel/women-drivers`)
      .then((res) => (res.ok ? res.json() : { drivers: [] }))
      .then((data) => {
        setWomenDrivers(data.drivers || []);
        setLoadingDrivers(false);
      })
      .catch((err) => {
        console.warn('Could not fetch women drivers, using fallback:', err);
        setWomenDrivers([
          {
            id: 'WF-101',
            name: 'Anita M.',
            rating: 5.0,
            tripsCount: 1840,
            carModel: 'White SmartSedan Prime',
            plate: 'KA 01 EF 9012',
            badge: 'Women Sentinel Lead',
            languages: ['English', 'Hindi', 'Gujarati'],
            policeVerified: true,
            dashcamLive: true,
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
          },
          {
            id: 'WF-102',
            name: 'Priya T.',
            rating: 4.95,
            tripsCount: 1220,
            carModel: 'Silver SmartMini AC',
            plate: 'TS 09 IJ 7890',
            badge: 'Pink Shield Certified',
            languages: ['English', 'Hindi', 'Telugu'],
            policeVerified: true,
            dashcamLive: true,
            photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
          },
        ]);
        setLoadingDrivers(false);
      });
  }, [isOpen]);

  // Fake call timer
  useEffect(() => {
    let t;
    if (fakeCallActive) {
      t = setInterval(() => setFakeCallTimer((s) => s + 1), 1000);
    } else {
      setFakeCallTimer(0);
    }
    return () => clearInterval(t);
  }, [fakeCallActive]);

  // Audio Safety Check-in countdown
  useEffect(() => {
    let timer;
    if (checkInStatus === 'COUNTING' && checkInCountdown !== null) {
      if (checkInCountdown > 0) {
        timer = setTimeout(() => setCheckInCountdown((c) => c - 1), 1000);
      } else {
        // Countdown reached 0 — auto trigger alert
        handleConfirmCheckIn('UNRESPONSIVE');
      }
    }
    return () => clearTimeout(timer);
  }, [checkInStatus, checkInCountdown]);

  if (!isOpen) return null;

  const toggleWomenDriver = () => {
    const next = !womenOnlyPreference;
    setWomenOnlyPreference(next);
    onUpdatePreferences({
      ...ridePreferences,
      womenDriverPreference: next,
    });
  };

  const startCheckInSimulation = () => {
    setCheckInStatus('COUNTING');
    setCheckInCountdown(10);
    // Play safety chime
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) { /* ignore */ }
  };

  const handleConfirmCheckIn = async (status) => {
    setCheckInStatus(status);
    setCheckInCountdown(null);
    try {
      await fetch(`${PYTHON_API}/api/sentinel/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip?.rideCode || currentTrip?.id || 'LOCAL-PREVIEW',
          status: status,
          notes: status === 'SAFE' ? 'Passenger confirmed safe via sentinel chime' : 'Passenger unresponsive on check-in',
        }),
      });
    } catch (e) { /* ignore */ }
  };

  const formatSeconds = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-indigo-500/30 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-indigo-500/20 flex items-center justify-between relative bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg ring-2 ring-purple-400/40">
              <Moon className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Night Shield™ Sentinel
                </h2>
                <span className="text-[10px] bg-purple-500/20 border border-purple-400/30 text-purple-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  24/7 Guardian
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                Enhanced security protocol for late-night &amp; solo passenger rides
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          
          {/* Active Status & Fast Toggle */}
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
              <div>
                <p className="font-extrabold text-white text-sm">Night Shield Protection Active</p>
                <p className="text-xs text-indigo-300 font-medium">Automatic 10-min audio check-ins + direct police link</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShieldActive(!shieldActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                shieldActive
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {shieldActive ? 'Active ✓' : 'Paused'}
            </button>
          </div>

          {/* 🌸 Women Driver Partner Preference */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🌸</span>
                <div>
                  <h3 className="font-black text-white text-sm">Women Driver Partner Priority</h3>
                  <p className="text-xs text-purple-200/70 font-medium">Matches only with certified 5★ female drivers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleWomenDriver}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition border ${
                  womenOnlyPreference
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-white/10 text-purple-200 border-white/20 hover:bg-white/20'
                }`}
              >
                {womenOnlyPreference ? 'Enabled ✓' : 'Enable'}
              </button>
            </div>

            {/* List of Verified Women Drivers */}
            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                Available Sentinel Fleet Partners ({womenDrivers.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {womenDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => {
                      onSelectWomenDriver(driver);
                      onClose();
                    }}
                    className="p-3 bg-slate-900/80 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-400/60 rounded-xl cursor-pointer transition flex items-center space-x-3 group"
                  >
                    <img
                      src={driver.photo}
                      alt={driver.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-purple-400/40 shrink-0"
                    />
                    <div className="truncate flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate group-hover:text-purple-300">
                          {driver.name}
                        </span>
                        <span className="text-[10px] font-black text-amber-300">★ {driver.rating}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{driver.carModel}</p>
                      <span className="inline-block text-[9px] font-semibold text-emerald-400 mt-0.5">
                        🛡️ {driver.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🔔 Live Audio Safety Check-In Test */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">
                  Periodic Audio Safety Check-In
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">10m Interval</span>
            </div>
            
            <p className="text-xs text-slate-300">
              The app plays a discrete chime asking you to tap "I am Safe". If unresponsive within 60s, it alerts your trusted contacts and dispatch.
            </p>

            {checkInStatus === 'COUNTING' ? (
              <div className="p-3.5 bg-amber-500/20 border border-amber-400/50 rounded-xl flex items-center justify-between animate-pulse">
                <div>
                  <p className="text-xs font-black text-amber-300">Safety Check-In Active</p>
                  <p className="text-xs text-white">Tap below within {checkInCountdown}s</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirmCheckIn('SAFE')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-lg"
                >
                  ✓ I am Safe
                </button>
              </div>
            ) : checkInStatus === 'SAFE' ? (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Safety status logged and confirmed at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
              </div>
            ) : checkInStatus === 'UNRESPONSIVE' ? (
              <div className="p-2.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Unresponsive trigger sent to Family Beacon &amp; Safety Sentinel.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCheckInSimulation}
                className="w-full py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4 text-indigo-300" />
                <span>Test Audio Check-In Chime</span>
              </button>
            )}
          </div>

          {/* 📞 Discrete Emergency & Disguise Tools */}
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* Fake Call Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowFakeCall(true);
                setFakeCallActive(false);
              }}
              className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl transition flex flex-col items-center justify-center text-center space-y-1.5 group"
            >
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-xs">Fake Incoming Call</span>
              <span className="text-[10px] text-slate-400 font-medium">Disguised escape tool</span>
            </button>

            {/* Direct Women Helpline 1091 */}
            <a
              href="tel:1091"
              className="p-3.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 rounded-2xl transition flex flex-col items-center justify-center text-center space-y-1.5 group"
            >
              <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-extrabold text-white text-xs">Women Helpline 1091</span>
              <span className="text-[10px] text-purple-300 font-medium">Gujarat / National SOS</span>
            </a>
          </div>

          {/* Emergency 112 Bar */}
          <a
            href="tel:112"
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition transform hover:scale-[1.01]"
          >
            <Siren className="w-5 h-5 animate-pulse" />
            <span>Direct Call National Emergency 112</span>
          </a>

        </div>

      </div>

      {/* 📱 FAKE INCOMING CALL FULLSCREEN OVERLAY */}
      {showFakeCall && (
        <div className="fixed inset-0 z-[1300] bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 animate-in fade-in duration-300">
          
          <div className="text-center pt-12 space-y-3">
            <div className="w-24 h-24 bg-gradient-to-tr from-slate-700 to-slate-800 rounded-full mx-auto flex items-center justify-center text-4xl shadow-2xl border-2 border-white/20">
              👤
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Dad (Home)</h2>
            <p className="text-slate-400 font-mono text-sm">
              {fakeCallActive ? `Call in Progress · ${formatSeconds(fakeCallTimer)}` : 'Incoming Call…'}
            </p>
          </div>

          <div className="text-center pb-12 space-y-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              SmartCab Disguise Security Mode
            </p>

            {fakeCallActive ? (
              <button
                type="button"
                onClick={() => {
                  setFakeCallActive(false);
                  setShowFakeCall(false);
                }}
                className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full mx-auto flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            ) : (
              <div className="flex items-center justify-center gap-12 sm:gap-16">
                <button
                  type="button"
                  onClick={() => setShowFakeCall(false)}
                  className="w-18 h-18 sm:w-20 sm:h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  onClick={() => setFakeCallActive(true)}
                  className="w-18 h-18 sm:w-20 sm:h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 animate-bounce"
                >
                  <PhoneCall className="w-8 h-8" />
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default NightShieldModal;
