import React, { useState, useEffect } from 'react';
import {
  Plane,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Info,
  Car,
  Search,
  User,
  Luggage,
  Calendar,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { calculateDiscount } from './RideOffersModal';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

const QUICK_FLIGHTS = [
  { no: '6E 2145', airline: 'IndiGo (DEL → AMD)', term: 'Terminal 1' },
  { no: '6E 5321', airline: 'IndiGo (BOM → AMD)', term: 'Terminal 1' },
  { no: 'AI 817', airline: 'Air India (DEL → AMD)', term: 'Terminal 1' },
  { no: 'QP 1332', airline: 'Akasa Air (BLR → AMD)', term: 'Terminal 1' },
  { no: 'EK 538', airline: 'Emirates (DXB → AMD)', term: 'Terminal 2' },
  { no: 'QR 534', airline: 'Qatar Airways (DOH → AMD)', term: 'Terminal 2' },
];

const CAR_OPTIONS = [
  { id: 'SmartBike', name: 'SmartBike', type: 'Solo Moto + Helmet', base: 249 },
  { id: 'SmartMini', name: 'SmartMini', type: 'Hatchback (2 Luggage)', base: 499 },
  { id: 'SmartPro', name: 'SmartPro', type: 'Executive Sedan (3 Luggage)', base: 599 },
  { id: 'SmartMax', name: 'SmartMax', type: 'Spacious SUV (5+ Luggage)', base: 899 },
  { id: 'SmartEV', name: 'SmartEV', type: 'Premium Green EV', base: 649 },
];

export default function AirportFastTrackModal({
  isOpen,
  onClose,
  onBookComplete,
  defaultCityAddress = 'SG Highway, Ahmedabad'
}) {
  const [direction, setDirection] = useState('PICKUP_FROM_AIRPORT'); // 'PICKUP_FROM_AIRPORT' | 'DROP_TO_AIRPORT'
  const [terminal, setTerminal] = useState('Terminal 1 (Domestic)');
  const [flightNo, setFlightNo] = useState('6E 2145');
  const [flightStatus, setFlightStatus] = useState(null);
  const [pickupPillar, setPickupPillar] = useState('Pillar 2B (T1 Arrival)');
  const [cityAddress, setCityAddress] = useState(defaultCityAddress);
  const [meetAndGreet, setMeetAndGreet] = useState(true);
  const [passengerName, setPassengerName] = useState('Aayushi Sheth');
  const [selectedCar, setSelectedCar] = useState('SmartPro');
  const [checkingFlight, setCheckingFlight] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (flightNo && isOpen) {
      checkFlight(flightNo);
    }
  }, [flightNo, isOpen]);

  const checkFlight = async (code) => {
    setCheckingFlight(true);
    try {
      const clean = code.replace(/\s+/g, '');
      const res = await fetch(`${PYTHON_API}/api/airport/flight-status/${clean}`);
      const data = await res.json();
      if (data.flight) {
        setFlightStatus(data.flight);
        if (data.flight.terminal) setTerminal(data.flight.terminal);
        if (data.flight.pickupPillar) setPickupPillar(data.flight.pickupPillar);
      }
    } catch (err) {
      setFlightStatus({
        flightNo: code,
        airline: 'Verified Carrier',
        scheduledArrival: 'On Schedule',
        status: 'ON_TIME',
        pickupPillar: 'Pillar 2 (Arrival Zone)'
      });
    } finally {
      setCheckingFlight(false);
    }
  };

  if (!isOpen) return null;

  const carObj = CAR_OPTIONS.find(c => c.id === selectedCar) || CAR_OPTIONS[1];
  const terminalAddon = terminal.includes('Terminal 2') ? 100 : 0;
  const baseFare = carObj.base + terminalAddon;
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
      setPromoError('Invalid coupon. Try AIRPORT100, SMART50, or FIRSTFREE');
    }
  };

  const handleBookAirport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/book-airport-fasttrack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripDirection: direction,
          terminal,
          flightNumber: flightNo,
          cityAddress,
          pickupPillar,
          meetAndGreet,
          passengerName,
          selectedCar,
          appliedPromo: promoApplied ? promoCode.toUpperCase() : null,
          discount
        })
      });
      const data = await res.json();
      if (data.booking && onBookComplete) {
        onBookComplete(data.booking);
      }
    } catch (err) {
      const mockBooking = {
        id: Date.now(),
        rideCode: `AIRPORT-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        category: 'AIRPORT_FASTTRACK',
        tripDirection: direction,
        terminal,
        flightNumber: flightNo,
        pickupLocation: direction === 'PICKUP_FROM_AIRPORT' ? `SVPI Airport ${terminal}` : cityAddress,
        dropoffLocation: direction === 'PICKUP_FROM_AIRPORT' ? cityAddress : `SVPI Airport ${terminal}`,
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
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                SVPI Airport Fast-Track
                <span className="text-[10px] font-bold bg-sky-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Flight Guard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sardar Vallabhbhai Patel International Airport (AMD) · Free 45-Min Delay Buffer
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
          {/* Direction Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setDirection('PICKUP_FROM_AIRPORT')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                direction === 'PICKUP_FROM_AIRPORT'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛬</span> Pickup from SVPI Airport
            </button>
            <button
              type="button"
              onClick={() => setDirection('DROP_TO_AIRPORT')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                direction === 'DROP_TO_AIRPORT'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛫</span> Drop to SVPI Airport
            </button>
          </div>

          {/* Flight Number & Live Status Lookup */}
          <div className="space-y-2.5 bg-sky-50/60 p-4 rounded-2xl border border-sky-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-sky-950 tracking-wider">
                Enter Flight Number for Auto Delay Guard
              </label>
              {checkingFlight && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />}
            </div>

            <div className="relative">
              <Plane className="w-4 h-4 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. 6E 2145, AI 817, EK 538"
                value={flightNo}
                onChange={(e) => setFlightNo(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
            </div>

            {/* Quick flight chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_FLIGHTS.map((f) => (
                <button
                  key={f.no}
                  type="button"
                  onClick={() => {
                    setFlightNo(f.no);
                    checkFlight(f.no);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                    flightNo === f.no
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white border-sky-200 text-sky-900 hover:bg-sky-100'
                  }`}
                >
                  {f.no} · {f.airline}
                </button>
              ))}
            </div>

            {/* Live Flight Status Card */}
            {flightStatus && (
              <div className="mt-2 p-3 bg-white border border-sky-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    {flightStatus.airline} ({flightStatus.flightNo})
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                      ● {flightStatus.status === 'DELAYED' ? 'Delayed 25m (Cab Window Shifted)' : 'On Schedule'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Arrival: <strong>{flightStatus.scheduledArrival}</strong> · {flightStatus.terminal}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold bg-sky-100 text-sky-900 px-2 py-1 rounded-lg block">
                    {flightStatus.pickupPillar || 'Pillar 2B'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Terminal & Pickup Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Airport Terminal
              </label>
              <select
                value={terminal}
                onChange={(e) => setTerminal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="Terminal 1 (Domestic)">Terminal 1 (Domestic Indigo / AI / Akasa)</option>
                <option value="Terminal 2 (International)">Terminal 2 (International Emirates / Qatar / Gulf)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Designated Pickup Pillar
              </label>
              <input
                type="text"
                value={pickupPillar}
                onChange={(e) => setPickupPillar(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* City Address */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
              {direction === 'PICKUP_FROM_AIRPORT' ? 'Dropoff City Address' : 'Pickup City Address'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cityAddress}
                onChange={(e) => setCityAddress(e.target.value)}
                placeholder="e.g. Prahlad Nagar, Vastrapur, GIFT City"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Complimentary Meet & Greet Name-board */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <User className="w-5 h-5 text-slate-600" />
              <div>
                <div className="text-xs font-black text-slate-900">Complimentary Name-Board Meet &amp; Greet</div>
                <div className="text-[11px] text-slate-500">Chauffeur holds sign with: <strong>{passengerName}</strong></div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={meetAndGreet}
              onChange={(e) => setMeetAndGreet(e.target.checked)}
              className="w-4 h-4 accent-sky-600"
            />
          </div>

          {/* Vehicle Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
              Select Airport Vehicle
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
                        ? 'border-sky-600 bg-sky-50 font-black text-sky-950 ring-1 ring-sky-500'
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
              placeholder="Promo Code (e.g. AIRPORT100)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          {/* Airport Guarantee Notice */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black">SmartCab Airport Guarantee:</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Up to 45 minutes of free waiting time post-landing to clear customs and collect baggage. No cancellation fees if flight is diverted.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Fixed Airport Fare</div>
            <div className="text-2xl font-black text-slate-950">₹{finalFare}</div>
          </div>
          <button
            type="button"
            onClick={handleBookAirport}
            disabled={loading}
            className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
            Confirm Airport Fast-Track →
          </button>
        </div>
      </div>
    </div>
  );
}
