import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Fuel,
  Wallet,
  Target,
  Award,
  Zap,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  BarChart2,
  ArrowUpRight,
  Gauge
} from 'lucide-react';
import { API_BASE } from './api';

export default function DriverWeeklyAnalyticsModal({ isOpen, onClose, driverName }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWeeklyData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/driver/weekly-analytics?driver_name=${encodeURIComponent(driverName || 'Rahul Sharma')}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
          // Default active day to Friday (today) or current
          setActiveDay(data.days?.[4] || data.days?.[0]);
        }
      } catch (e) {
        console.warn("Could not fetch weekly analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [isOpen, driverName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Weekly Earnings &amp; Fuel Mileage ROI</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Diamond Partner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {analytics?.weekLabel || 'Week 40 • Sep 28 - Oct 04, 2026'} • Driver: {driverName || 'Rahul Sharma'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Calculating weekly revenue ledger and mileage metrics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">WEEKLY GROSS</span>
                <span className="text-base font-black text-white">₹{analytics.kpis.totalWeeklyGross.toFixed(2)}</span>
                <span className="text-[9px] text-emerald-400 block font-semibold mt-0.5">{analytics.kpis.totalTripsCompleted} Completed Trips</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold block">DRIVER 80% CUT</span>
                <span className="text-base font-black text-emerald-400">₹{analytics.kpis.driverNet80Cut.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">+₹{analytics.kpis.targetBonusesUnlocked} Bonuses</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-orange-400 font-bold block">CNG / FUEL SPENT</span>
                <span className="text-base font-black text-orange-300">-₹{analytics.kpis.totalFuelExpense.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">₹{analytics.mileageIntelligence.fuelCostPerKm}/km running</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-950 p-3 rounded-2xl border border-emerald-800/60 shadow-lg">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">NET TAKE-HOME</span>
                <span className="text-lg font-black text-emerald-400">₹{analytics.kpis.netTakeHomeProfit.toFixed(2)}</span>
                <span className="text-[9px] text-emerald-300 font-bold block mt-0.5">
                  {analytics.mileageIntelligence.shiftProfitMargin} Net Margin
                </span>
              </div>
            </div>

            {/* 7-Day Interactive Visual Bar Chart */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-indigo-400" />
                  7-Day Earnings &amp; Shift Profit Curve (Mon – Sun)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Tap any day for details</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 items-end h-32 pt-4 px-1 border-b border-slate-800">
                {analytics.days.map((d, idx) => {
                  const maxGross = 2500;
                  const heightPercent = Math.min(100, Math.max(20, (d.gross / maxGross) * 100));
                  const isSelected = activeDay?.day === d.day;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDay(d)}
                      className="flex flex-col items-center gap-1.5 h-full justify-end group focus:outline-none"
                    >
                      <span className={`text-[9px] font-mono font-bold transition ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        ₹{d.takeHome}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      />
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {d.day}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Inspector */}
              {activeDay && (
                <div className="mt-3 pt-3 flex flex-wrap items-center justify-between text-xs bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{activeDay.day} ({activeDay.date}):</span>
                    <span className="text-slate-400">{activeDay.rides} Rides</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300">Gross: <strong>₹{activeDay.gross}</strong></span>
                    <span className="text-emerald-400 font-bold">80% Net: ₹{activeDay.net80}</span>
                    <span className="text-amber-400 font-bold">+{activeDay.bonus} Bonus</span>
                    <span className="text-orange-400 font-semibold">-₹{activeDay.fuel} Fuel</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mileage & Fuel ROI Intelligence Banner */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  Fuel &amp; Distance ROI Intelligence
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {analytics.mileageIntelligence.fuelEfficiencyKmPerKg} km/kg CNG Average
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Distance Logged</span>
                  <strong className="text-white font-bold">{analytics.mileageIntelligence.totalKilometersDriven} km</strong>
                  <span className="text-[9px] text-slate-500 block">Est. ~{analytics.mileageIntelligence.estimatedCngConsumptionKg} kg CNG</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Running Cost / KM</span>
                  <strong className="text-orange-400 font-bold">₹{analytics.mileageIntelligence.fuelCostPerKm} / km</strong>
                  <span className="text-[9px] text-slate-500 block">CNG tariff in Ahmedabad</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Gross Revenue / KM</span>
                  <strong className="text-emerald-400 font-bold">₹{analytics.mileageIntelligence.grossRevenuePerKm} / km</strong>
                  <span className="text-[9px] text-emerald-400 block font-semibold">Healthy Unit Economics</span>
                </div>
              </div>
            </div>

            {/* Diamond Partner Perks & Rewards */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                Diamond Partner Active Perks &amp; Fuel Cashbacks
              </h4>
              <div className="space-y-2">
                {analytics.partnerPerks.map((p, idx) => (
                  <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.title}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                    </div>
                    <span className="text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-md shrink-0 ml-3">
                      {p.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close / Action Button */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition"
              >
                Close Weekly Intelligence Hub
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
