import React, { useState } from 'react';
import {
  Clock,
  Car,
  MapPin,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Loader2,
  Zap
} from 'lucide-react';
import { calculateDiscount } from './RideOffersModal';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

const RENTAL_PACKAGES = [
  {
    id: 'PKG_2HR_20KM',
    name: '2 Hours · 20 km',
    duration: 2,
    km: 20,
    popular: false,
    desc: 'Quick shopping, clinic visits & errands',
    fares: { SmartMini: 399, SmartPro: 449, SmartMax: 699, SmartEV: 499 }
  },
  {
    id: 'PKG_4HR_40KM',
    name: '4 Hours · 40 km',
    duration: 4,
    km: 40,
    popular: true,
    desc: 'Half-day city meetings & client visits',
    fares: { SmartMini: 720, SmartPro: 799, SmartMax: 1199, SmartEV: 899 }
  },
  {
    id: 'PKG_8HR_80KM',
    name: '8 Hours · 80 km',
    duration: 8,
    km: 80,
    popular: false,
    desc: 'Full-day standby cab with private chauffeur',
    fares: { SmartMini: 1349, SmartPro: 1499, SmartMax: 2199, SmartEV: 1699 }
  },
  {
    id: 'PKG_12HR_120KM',
    name: '12 Hours · 120 km',
    duration: 12,
    km: 120,
    popular: false,
    desc: 'Extended day tour, wedding events & multi-city',
    fares: { SmartMini: 1999, SmartPro: 2199, SmartMax: 3199, SmartEV: 2499 }
  }
];

const CAR_TYPES = [
  { id: 'SmartMini', name: 'SmartMini', desc: 'Compact Hatchback (4 Seater)', icon: '🚗' },
  { id: 'SmartPro', name: 'SmartPro', desc: 'Comfort Sedan with AC (4 Seater)', icon: '🚘' },
  { id: 'SmartMax', name: 'SmartMax', desc: 'Spacious SUV (6 Seater)', icon: '🚙' },
  { id: 'SmartEV', name: 'SmartEV', desc: 'Zero Emission Electric Cab', icon: '⚡' }
];

export default function HourlyRentalsModal({
  isOpen,
  onClose,
  onBookComplete,
  defaultPickup = 'SG Highway, Ahmedabad'
}) {
  const [selectedPkgId, setSelectedPkgId] = useState('PKG_4HR_40KM');
  const [selectedCar, setSelectedCar] = useState('SmartPro');
  const [pickup, setPickup] = useState(defaultPickup);
  const [stops, setStops] = useState(['']);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const activePkg = RENTAL_PACKAGES.find(p => p.id === selectedPkgId) || RENTAL_PACKAGES[1];
  const baseFare = activePkg.fares[selectedCar] || 799;
  const finalFare = Math.max(0, baseFare - discount);

  const handleAddStop = () => {
    if (stops.length < 4) setStops([...stops, '']);
  };

  const handleRemoveStop = (idx) => {
    setStops(stops.filter((_, i) => i !== idx));
  };

  const handleStopChange = (idx, val) => {
    const updated = [...stops];
    updated[idx] = val;
    setStops(updated);
  };

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const res = calculateDiscount(code, baseFare);
    if (res.offer && res.discount > 0) {
      setDiscount(res.discount);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try SMART50 or FIRSTFREE');
    }
  };

  const handleBookRental = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/book-rental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: activePkg.id,
          selectedCar,
          pickupLocation: pickup,
          stops: stops.filter(s => s.trim()),
          appliedPromo: promoApplied ? promoCode.toUpperCase() : null,
          discount,
          riderName: 'Verified Rider'
        })
      });
      const data = await res.json();
      if (data.booking && onBookComplete) {
        onBookComplete(data.booking);
      }
    } catch (err) {
      // Offline fallback
      const mockBooking = {
        id: Date.now(),
        rideCode: `RENTAL-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        category: 'RENTAL_HOURLY',
        packageName: activePkg.name,
        pickupLocation: pickup,
        selectedCar,
        fare: finalFare,
        baseFare,
        discount
      };
      if (onBookComplete) onBookComplete(mockBooking);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                Hourly Cab Rentals
                <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Multi-Stop Standby
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Keep the cab &amp; chauffeur with you for multiple stops throughout the day
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Package Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
              1. Choose Rental Package
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {RENTAL_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const fare = pkg.fares[selectedCar] || 799;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-md ring-1 ring-amber-400'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Most Popular
                      </span>
                    )}
                    <div className="font-black text-sm text-slate-900">{pkg.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{pkg.desc}</div>
                    <div className="text-base font-black text-slate-950 mt-2">
                      ₹{fare}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Vehicle Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
              2. Select Vehicle Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAR_TYPES.map((car) => {
                const isSelected = selectedCar === car.id;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car.id)}
                    className={`p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 font-black text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xl">{car.icon}</div>
                    <div className="text-xs font-bold mt-1">{car.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Pickup & Multi-Stops */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                3. Pickup &amp; Planned Stops
              </label>
              {stops.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </button>
              )}
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pickup Location (e.g. SG Highway, Ahmedabad)"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {stops.map((stop, idx) => (
              <div key={idx} className="relative flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  {idx + 1}
                </div>
                <input
                  type="text"
                  placeholder={`Stop #${idx + 1} (e.g. Iscon Mall, Sindhu Bhavan Road)`}
                  value={stop}
                  onChange={(e) => handleStopChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo Code (e.g. SMART50)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition"
            >
              Apply
            </button>
          </div>
          {promoError && <p className="text-[11px] font-bold text-rose-600">{promoError}</p>}
          {promoApplied && <p className="text-[11px] font-bold text-emerald-600">✓ Coupon applied: -₹{discount} discount</p>}

          {/* Rate Card Clarity */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black">Package Inclusions &amp; Overtime Rates:</p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Includes {activePkg.km} km &amp; {activePkg.duration} hours. Extra distance is charged at ₹12/km, extra time at ₹2.5/min. Tolls and parking (if applicable) paid as actuals.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Estimated Total</div>
            <div className="text-2xl font-black text-slate-950">₹{finalFare}</div>
          </div>
          <button
            type="button"
            onClick={handleBookRental}
            disabled={loading}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            Confirm Hourly Rental →
          </button>
        </div>
      </div>
    </div>
  );
}
