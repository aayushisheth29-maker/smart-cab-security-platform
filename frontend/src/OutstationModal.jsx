import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Info,
  Navigation,
  Loader2,
  ArrowLeftRight,
  TrendingUp
} from 'lucide-react';
import { calculateDiscount } from './RideOffersModal';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

const POPULAR_OUTSTATION_ROUTES = [
  { id: 'gnd', city: 'Gandhinagar / GIFT City', dist: '32 km', oneWay: 549, round: 949, toll: 0 },
  { id: 'bdq', city: 'Vadodara (Baroda)', dist: '115 km', oneWay: 1499, round: 2499, toll: 185 },
  { id: 'raj', city: 'Rajkot (Saurashtra)', dist: '215 km', oneWay: 2699, round: 4499, toll: 280 },
  { id: 'st', city: 'Surat (Diamond City)', dist: '265 km', oneWay: 3299, round: 5499, toll: 395 },
  { id: 'udr', city: 'Udaipur (Rajasthan)', dist: '260 km', oneWay: 3499, round: 5799, toll: 450 },
  { id: 'dwrk', city: 'Dwarka / Somnath', dist: '440 km', oneWay: 5499, round: 8999, toll: 560 },
];

const CAR_OPTIONS = [
  { id: 'SmartBike', name: 'SmartBike', type: 'Cruiser Moto (Solo)', multiplier: 0.55 },
  { id: 'SmartMini', name: 'SmartMini', type: 'Hatchback (4 Seater)', multiplier: 0.9 },
  { id: 'SmartPro', name: 'SmartPro', type: 'Sedan AC (4 Seater)', multiplier: 1.0 },
  { id: 'SmartMax', name: 'SmartMax', type: 'SUV (6-7 Seater)', multiplier: 1.5 },
  { id: 'SmartEV', name: 'SmartEV', type: 'Long-Range EV', multiplier: 1.15 },
];

export default function OutstationModal({
  isOpen,
  onClose,
  onBookComplete,
  defaultOrigin = 'Ahmedabad'
}) {
  const [tripType, setTripType] = useState('ONE_WAY'); // 'ONE_WAY' | 'ROUND_TRIP'
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState('Vadodara (Baroda)');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [selectedCar, setSelectedCar] = useState('SmartPro');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const matchedRoute = POPULAR_OUTSTATION_ROUTES.find(r => r.city.toLowerCase() === destination.toLowerCase()) || POPULAR_OUTSTATION_ROUTES[1];
  const carMultiplier = CAR_OPTIONS.find(c => c.id === selectedCar)?.multiplier || 1.0;
  
  const rawBaseFare = tripType === 'ROUND_TRIP' ? matchedRoute.round : matchedRoute.oneWay;
  const baseFare = Math.round(rawBaseFare * carMultiplier);
  const finalFare = Math.max(0, baseFare - discount);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const res = calculateDiscount(code, baseFare);
    if (res.offer && res.discount > 0) {
      setDiscount(res.discount);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try SMART50, FIRSTFREE, or HIGHWAY200');
    }
  };

  const handleBookOutstation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/book-outstation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripType,
          origin,
          destination,
          selectedCar,
          departureDate,
          returnDate: tripType === 'ROUND_TRIP' ? returnDate : null,
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
      const mockBooking = {
        id: Date.now(),
        rideCode: `OUTSTATION-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        category: 'OUTSTATION',
        tripType,
        origin,
        destination,
        selectedCar,
        fare: finalFare,
        baseFare,
        tollsEstimate: matchedRoute.toll,
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
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                Outstation Intercity Cabs
                <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">
                  Verified Chauffeurs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comfortable highway rides with 24/7 AI GPS telemetry &amp; SOS assistance
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
          {/* Step 1: Trip Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setTripType('ONE_WAY')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                tripType === 'ONE_WAY'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" /> One-Way Drop
            </button>
            <button
              type="button"
              onClick={() => setTripType('ROUND_TRIP')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                tripType === 'ROUND_TRIP'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" /> Round-Trip (Same/Next Day)
            </button>
          </div>

          {/* Popular Cities Quick Select */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
              Popular Gujarat &amp; Rajasthan Destinations
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_OUTSTATION_ROUTES.map((r) => {
                const isSelected = destination.toLowerCase() === r.city.toLowerCase();
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setDestination(r.city)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-black text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{r.city}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.dist} · From ₹{tripType === 'ROUND_TRIP' ? r.round : r.oneWay}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Inputs */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="relative">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Origin City</span>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="relative">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Destination City / Town</span>
              <div className="relative">
                <Navigation className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Departure Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              {tripType === 'ROUND_TRIP' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
              Select Highway Vehicle
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {CAR_OPTIONS.map((car) => {
                const isSelected = selectedCar === car.id;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car.id)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-black ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">{car.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{car.type}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo Code (e.g. HIGHWAY200)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Transparent Highway Inclusions */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-950">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black">Highway Inclusions &amp; Safety Guarantee:</p>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                All SmartCab outstation drivers are police-verified with 5+ years highway experience. Includes fast-tag expressway toll estimate (~₹{matchedRoute.toll}) &amp; driver allowance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">
              {tripType === 'ROUND_TRIP' ? 'Round-Trip Fare' : 'One-Way Fare'}
            </div>
            <div className="text-2xl font-black text-slate-950">₹{finalFare}</div>
          </div>
          <button
            type="button"
            onClick={handleBookOutstation}
            disabled={loading}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
            Confirm Outstation Cab →
          </button>
        </div>
      </div>
    </div>
  );
}
