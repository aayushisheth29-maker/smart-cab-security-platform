import React, { useState, useEffect } from 'react';
import { 
  X, Eye, AlertTriangle, ShieldCheck, Clock, Coffee, Bell, 
  Activity, CheckCircle2, Volume2, RefreshCw, Zap, Video, User
} from 'lucide-react';
import { apiFetch } from './api';
import { Chimes } from './ttsService';

const DriverFatigueModal = ({
  isOpen,
  onClose,
  driverId = 'DRV-101',
  driverName = 'Rahul Sharma'
}) => {
  if (!isOpen) return null;

  const [telemetry, setTelemetry] = useState({
    continuousDrivingMinutes: 145,
    perclosPercentage: 24.5,
    yawnCountLast10Min: 1,
    headNodCount: 0,
    fatigueLevel: 'NORMAL',
    breakMandatory: false,
    recommendedAction: 'Driver alert & fit for duty',
  });
  const [loading, setLoading] = useState(false);
  const [restLoading, setRestLoading] = useState(false);
  const [restSuccess, setRestSuccess] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await apiFetch(`/api/driver/fatigue/status/${driverId}`);
      if (res && res.success) {
        setTelemetry(res);
      }
    } catch (e) {
      console.warn('Fatigue status fetch error:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [driverId]);

  const handleSimulateTelemetry = async (continuousMins, perclos, yawns, nods) => {
    setLoading(true);
    setRestSuccess('');
    try {
      const res = await apiFetch('/api/driver/fatigue/telemetry', {
        method: 'POST',
        body: JSON.stringify({
          driverId,
          driverName,
          continuousDrivingMinutes: continuousMins,
          perclosPercentage: perclos,
          yawnCountLast10Min: yawns,
          headNodCount: nods,
        }),
      });

      if (res && res.success) {
        setTelemetry(res);
        if (res.breakMandatory) {
          Chimes.sosAlert();
        }
      }
    } catch (e) {
      console.warn('Telemetry simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeBreak = async () => {
    setRestLoading(true);
    try {
      const res = await apiFetch('/api/driver/fatigue/take-break', {
        method: 'POST',
        body: JSON.stringify({ driverId, breakMinutes: 15 }),
      });
      if (res && res.success) {
        setRestSuccess('15-Minute Tea Break Active! Continuous driving timer has been reset.');
        fetchStatus();
      }
    } catch (e) {
      console.warn('Break error:', e);
    } finally {
      setRestLoading(false);
    }
  };

  const hours = Math.floor(telemetry.continuousDrivingMinutes / 60);
  const mins = telemetry.continuousDrivingMinutes % 60;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-black text-white flex items-center justify-between border-b border-amber-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Driver Shift &amp; Fatigue AI</h2>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-black uppercase">
                  Vision Guard
                </span>
              </div>
              <p className="text-xs text-slate-300">
                In-cabin eye blink, PERCLOS &amp; continuous driving safety monitor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {restSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{restSuccess}</span>
            </div>
          )}

          {/* Real-Time Fatigue Meter Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            telemetry.fatigueLevel === 'CRITICAL_FATIGUE'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : telemetry.fatigueLevel === 'MILD_DROWSINESS'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${
                telemetry.fatigueLevel === 'CRITICAL_FATIGUE'
                  ? 'bg-rose-200 text-rose-800'
                  : telemetry.fatigueLevel === 'MILD_DROWSINESS'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-emerald-200 text-emerald-800'
              }`}>
                {telemetry.fatigueLevel === 'CRITICAL_FATIGUE' ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  Fatigue Status: {telemetry.fatigueLevel.replace('_', ' ')}
                </p>
                <p className="text-xs font-semibold">{telemetry.recommendedAction}</p>
              </div>
            </div>

            {telemetry.breakMandatory && (
              <span className="text-[10px] bg-rose-600 text-white font-black px-2.5 py-1 rounded-full animate-bounce">
                STOP NOW
              </span>
            )}
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500">Continuous Shift</p>
              <p className="text-xl font-black text-slate-900">{hours}h {mins}m</p>
              <p className="text-[10px] text-slate-400">Max limit: 4h 00m</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-500">Eye Closure (PERCLOS)</p>
              <p className={`text-xl font-black ${
                telemetry.perclosPercentage >= 80 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {telemetry.perclosPercentage.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400">Drowsy threshold: &gt;80%</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase text-slate-500">Yawns / Head Nods</p>
              <p className="text-xl font-black text-slate-900">{telemetry.yawnCountLast10Min} / {telemetry.headNodCount}</p>
              <p className="text-[10px] text-slate-400">In last 10 mins</p>
            </div>
          </div>

          {/* Simulated In-Cabin Camera Preview Overlay */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                <span className="font-mono text-emerald-400 font-bold">IN-CABIN AI VISION CAM [LIVE]</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                FPS: 30 • 1080p
              </span>
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-700 rounded-xl bg-slate-900/60">
              <User className="w-12 h-12 text-slate-400" />
              <p className="text-xs font-semibold text-slate-300">
                Driver: <strong className="text-white">{driverName}</strong> ({driverId})
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Gaze: Center</span> • <span>Face Detected: Yes</span> • <span>Pupil Tracking: Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => Chimes.driverArrival()}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Test Wake-Up Chime
              </button>
              <span className="text-[11px] text-slate-400 font-mono">DPDP In-Cabin Encrypted</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleTakeBreak}
              disabled={restLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Coffee className="w-4 h-4" />
              <span>Log 15-Minute Tea Break (Reset Shift Timer)</span>
            </button>

            {/* Simulation Scenarios for Testing */}
            <div className="pt-2 border-t border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">Audition AI Sensor Telemetry:</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleSimulateTelemetry(120, 20.0, 0, 0)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition"
                >
                  🟢 2h Shift (Normal)
                </button>
                <button
                  onClick={() => handleSimulateTelemetry(190, 65.0, 3, 1)}
                  className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-[11px] font-bold transition"
                >
                  🟡 3.2h Shift (Drowsy)
                </button>
                <button
                  onClick={() => handleSimulateTelemetry(260, 88.0, 5, 2)}
                  className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-[11px] font-bold transition"
                >
                  🔴 4.3h Shift (Critical)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverFatigueModal;
