import React, { useState } from 'react';
import { 
  X, Package, Bike, ArrowRight, ShieldCheck, CheckCircle2, 
  MapPin, Phone, User, FileText, Lock, Key, AlertCircle, 
  Camera, Loader2, Sparkles, Navigation, Clock
} from 'lucide-react';
import { apiFetch } from './api';

const PACKAGE_TYPES = [
  { id: 'DOCUMENTS', label: 'Documents & Deeds', icon: '📄', desc: 'Passports, legal papers, contracts' },
  { id: 'FOOD_TIFFIN', label: 'Food & Tiffin Box', icon: '🍱', desc: 'Home lunchbox, sweets, groceries' },
  { id: 'ELECTRONICS', label: 'Electronics & Gadgets', icon: '📱', desc: 'Laptops, chargers, accessories' },
  { id: 'MEDICINES', label: 'Medicines & Health', icon: '💊', desc: 'Emergency pharmacy prescriptions' },
  { id: 'CLOTHING_GIFTS', label: 'Clothes & Gifts', icon: '🎁', desc: 'Apparel, party gifts, retail items' },
  { id: 'GENERAL', label: 'General Parcel', icon: '📦', desc: 'Keys, small boxes up to 15 kg' },
];

const ParcelDeliveryModal = ({
  isOpen,
  onClose,
  initialPickup = 'AIT College, Ognaj, Ahmedabad',
  initialDropoff = 'Iskcon Crossroads, SG Highway, Ahmedabad',
  distanceKm = 8.5
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState('FORM'); // 'FORM' | 'TRACKING'
  const [senderName, setSenderName] = useState('Pooja Patel');
  const [senderPhone, setSenderPhone] = useState('+91 98250 11111');
  const [pickupAddress, setPickupAddress] = useState(initialPickup);

  const [receiverName, setReceiverName] = useState('Karan Shah');
  const [receiverPhone, setReceiverPhone] = useState('+91 98250 22222');
  const [deliveryAddress, setDeliveryAddress] = useState(initialDropoff);

  const [packageType, setPackageType] = useState('DOCUMENTS');
  const [weightKg, setWeightKg] = useState(1.5);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Fare estimation: Base ₹25 + ₹8/km + weight surcharge
  const estimatedFare = Math.round(25 + (distanceKm * 8) + Math.max(0, (weightKg - 2) * 5));

  const handleCreateParcelOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/parcel/create', {
        method: 'POST',
        body: JSON.stringify({
          senderName,
          senderPhone,
          pickupAddress,
          receiverName,
          receiverPhone,
          deliveryAddress,
          packageType,
          weightKg,
          distanceKm,
          deliveryNotes: deliveryNotes || undefined,
        }),
      });

      if (res && res.success) {
        setOrderData(res);
        setStep('TRACKING');
      } else {
        setError('Failed to dispatch express parcel.');
      }
    } catch (err) {
      setError(err.message || 'Parcel booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!orderData?.parcelId) return;
    setOtpLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/parcel/${orderData.parcelId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ enteredOtp }),
      });
      if (res && res.success) {
        setOtpVerified(true);
      }
    } catch (err) {
      setError('OTP Verification Error: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-black text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">SmartBike Express Parcel</h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-black uppercase">
                  OTP Release PIN
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Door-to-door express courier with 4-digit handover OTP &amp; photo proof
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} className="font-bold underline ml-2">Dismiss</button>
            </div>
          )}

          {step === 'FORM' && (
            <div className="space-y-4">
              {/* Package Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Select Package Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PACKAGE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setPackageType(t.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        packageType === t.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl mb-1">{t.icon}</span>
                      <div>
                        <p className="text-xs font-black">{t.label}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <p className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  🟢 1. Sender (Pickup Details)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Sender Full Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                  />
                  <input
                    type="tel"
                    placeholder="Sender Mobile Phone"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Complete Pickup Address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              {/* Receiver Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <p className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  🔴 2. Receiver (Dropoff Details)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Receiver Full Name"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                  />
                  <input
                    type="tel"
                    placeholder="Receiver Mobile Phone"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Complete Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              {/* Weight & Fare Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-emerald-950">Estimated Express Delivery Fare</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    ~{distanceKm.toFixed(1)} km distance • Bike courier partner
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-950">₹{estimatedFare}</span>
                  <p className="text-[10px] text-emerald-800 font-bold">Includes Transit Shield</p>
                </div>
              </div>

              {/* Dispatch Button */}
              <button
                onClick={handleCreateParcelOrder}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 hover:from-emerald-700 hover:to-black text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Express Bike Courier…</span>
                  </>
                ) : (
                  <>
                    <Bike className="w-4 h-4" />
                    <span>Book SmartBike Express for ₹{estimatedFare}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: ACTIVE ORDER TRACKING & 4-DIGIT OTP RELEASE */}
          {step === 'TRACKING' && orderData && (
            <div className="space-y-4">
              {/* Order Status Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">
                  Order Active • ID: {orderData.parcelId}
                </span>
                <h3 className="text-xl font-black text-emerald-950">Express Courier Dispatched</h3>
                <p className="text-xs text-emerald-800">
                  Rider <strong>{orderData.assignedRider?.name}</strong> ({orderData.assignedRider?.vehicle} - {orderData.assignedRider?.plate}) is en route.
                </p>
              </div>

              {/* 4-Digit Handover Delivery OTP Security Card */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 text-center space-y-2 shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  Receiver Handover Release OTP
                </div>
                <div className="text-4xl font-mono font-black tracking-widest text-emerald-400 py-1">
                  {orderData.deliveryOtp}
                </div>
                <p className="text-xs text-slate-300">
                  Share this 4-digit code with recipient <strong>{receiverName}</strong> for package release.
                </p>
              </div>

              {/* OTP Verification Handover Simulator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  Recipient OTP Handover Verification Simulator
                </p>

                {otpVerified ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Package Delivered &amp; Verified successfully! Digital proof recorded.</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 4-digit delivery OTP..."
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      maxLength={4}
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || enteredOtp.length !== 4}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                    >
                      {otpLoading ? 'Verifying…' : 'Release Package'}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Done / Return to Booking Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParcelDeliveryModal;
