import React, { useState } from 'react';
import {
  X,
  Tag,
  Gift,
  Sparkles,
  Percent,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  Plane,
  Moon,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';

export const PROMO_OFFERS = [
  {
    code: 'FIRSTFREE',
    title: '🎁 100% OFF First Ride',
    tagline: 'Your first ride is completely free! (Up to ₹150)',
    type: 'percentage',
    value: 100,
    maxDiscount: 150,
    badge: 'NEW RIDER',
    badgeTone: 'bg-amber-500 text-slate-950 font-black',
    cardBg: 'bg-amber-50 hover:bg-amber-100/80',
    borderTone: 'border-amber-300',
    icon: Gift,
    iconColor: 'text-amber-600',
    expiresIn: 'Valid for next 7 days',
    terms: 'Valid on first booking for any SmartCab vehicle (SmartBike, SmartMini, SmartSedan, SmartSUV).'
  },
  {
    code: 'SMART50',
    title: '⚡ Flat 50% OFF Super Deal',
    tagline: 'Enjoy 50% discount on any ride (Up to ₹100)',
    type: 'percentage',
    value: 50,
    maxDiscount: 100,
    badge: 'POPULAR',
    badgeTone: 'bg-emerald-600 text-white font-black',
    cardBg: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderTone: 'border-emerald-300',
    icon: Zap,
    iconColor: 'text-emerald-600',
    expiresIn: 'Ends in 24 hours',
    terms: 'Valid on all SmartMini and SmartSedan trips within city limits.'
  },
  {
    code: 'NIGHTSAFE',
    title: '🌙 20% OFF Night Owl Pass',
    tagline: 'Safe, verified night rides with 24/7 AI telemetry',
    type: 'percentage',
    value: 20,
    maxDiscount: 80,
    badge: 'NIGHT SPECIAL',
    badgeTone: 'bg-indigo-600 text-white font-black',
    cardBg: 'bg-indigo-50 hover:bg-indigo-100/80',
    borderTone: 'border-indigo-300',
    icon: Moon,
    iconColor: 'text-indigo-600',
    expiresIn: 'Valid 8:00 PM – 6:00 AM',
    terms: 'Applicable automatically on night rides with active Live Police 112 Guard.'
  },
  {
    code: 'AIRPORT75',
    title: '✈️ Flat ₹75 OFF Airport Trip',
    tagline: 'Reliable rides to SVPI Airport Terminals 1 & 2',
    type: 'flat',
    value: 75,
    maxDiscount: 75,
    badge: 'AIRPORT RIDES',
    badgeTone: 'bg-blue-600 text-white font-black',
    cardBg: 'bg-blue-50 hover:bg-blue-100/80',
    borderTone: 'border-blue-300',
    icon: Plane,
    iconColor: 'text-blue-600',
    expiresIn: 'Valid anytime',
    terms: 'Flat ₹75 savings on airport pickups and dropoffs.'
  },
  {
    code: 'WOMENSAFE',
    title: '🛡️ 25% OFF Women Guardian Pass',
    tagline: 'Dedicated female passenger safety and priority dispatch',
    type: 'percentage',
    value: 25,
    maxDiscount: 120,
    badge: 'SAFETY PASS',
    badgeTone: 'bg-rose-600 text-white font-black',
    cardBg: 'bg-rose-50 hover:bg-rose-100/80',
    borderTone: 'border-rose-300',
    icon: ShieldCheck,
    iconColor: 'text-rose-600',
    expiresIn: 'Valid anytime',
    terms: 'Special discount with auto-SMS family broadcast and priority driver matching.'
  },
  {
    code: 'UPIPAY',
    title: '📱 Flat ₹30 UPI Instant Discount',
    tagline: 'Pay with Google Pay, PhonePe, Paytm, or BHIM',
    type: 'flat',
    value: 30,
    maxDiscount: 30,
    badge: 'INSTANT UPI',
    badgeTone: 'bg-violet-600 text-white font-black',
    cardBg: 'bg-violet-50 hover:bg-violet-100/80',
    borderTone: 'border-violet-300',
    icon: Sparkles,
    iconColor: 'text-violet-600',
    expiresIn: 'Valid on UPI checkout',
    terms: 'Applicable directly on UPI & QR code instant settlements.'
  }
];

export function calculateDiscount(offerOrCode, rawFare) {
  const fare = Number(rawFare || 0);
  if (!offerOrCode || fare <= 0) return { discount: 0, finalFare: fare, offer: null };

  let offer = typeof offerOrCode === 'string'
    ? PROMO_OFFERS.find(o => o.code.toUpperCase() === offerOrCode.trim().toUpperCase())
    : offerOrCode;

  if (!offer) {
    // Custom fallback codes
    const upper = String(offerOrCode).toUpperCase().trim();
    if (upper === 'SAFETYFIRST' || upper === 'SMARTCAB50') {
      const disc = Math.min(50, fare);
      return { discount: disc, finalFare: Math.max(0, fare - disc), offer: { code: upper, title: '₹50 Safety Discount' } };
    }
    if (upper === 'FREERIDE' || upper === 'FIRST100') {
      const disc = Math.min(100, fare);
      return { discount: disc, finalFare: Math.max(0, fare - disc), offer: { code: upper, title: '₹100 First Ride Discount' } };
    }
    return { discount: 0, finalFare: fare, offer: null };
  }

  let disc = 0;
  if (offer.type === 'flat') {
    disc = Math.min(offer.value, fare);
  } else if (offer.type === 'percentage') {
    const calc = (fare * offer.value) / 100;
    disc = Math.min(calc, offer.maxDiscount || calc, fare);
  }

  disc = Math.round(disc);
  return {
    discount: disc,
    finalFare: Math.max(0, fare - disc),
    offer
  };
}

export default function RideOffersModal({
  isOpen,
  onClose,
  currentFare = 150,
  appliedOfferCode = '',
  onApplyOffer
}) {
  const [copiedCode, setCopiedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customError, setCustomError] = useState('');

  if (!isOpen) return null;

  const handleCopy = (code, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    setCustomError('');
    const code = customCode.trim().toUpperCase();
    if (!code) return;

    const result = calculateDiscount(code, currentFare);
    if (result.offer) {
      onApplyOffer?.(result.offer);
      onClose();
    } else {
      setCustomError('Invalid promo code. Try FIRSTFREE, SMART50, or NIGHTSAFE');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                Exclusive Ride Offers
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Uber-Style Deals
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Apply a promo code to get instant discounts on your ride
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

        {/* Custom Coupon Input */}
        <div className="p-4 sm:p-5 bg-slate-100 border-b border-slate-200">
          <form onSubmit={handleCustomApply} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Promo Code (e.g. FIRSTFREE)"
                value={customCode}
                onChange={(e) => {
                  setCustomCode(e.target.value);
                  setCustomError('');
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-950 uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition shrink-0"
            >
              Apply Code
            </button>
          </form>
          {customError && (
            <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1">
              <span>⚠️</span> {customError}
            </p>
          )}
        </div>

        {/* Offers List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
          {PROMO_OFFERS.map((offer) => {
            const Icon = offer.icon;
            const isApplied = appliedOfferCode.toUpperCase() === offer.code.toUpperCase();
            const { discount, finalFare } = calculateDiscount(offer, currentFare);

            return (
              <div
                key={offer.code}
                className={`pt-3.5 first:pt-0 group relative rounded-2xl p-4 border-2 transition-all ${
                  isApplied
                    ? 'border-emerald-600 bg-emerald-50 shadow-md'
                    : `${offer.cardBg} ${offer.borderTone} hover:shadow-md`
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl bg-white shadow-sm shrink-0 border border-slate-200 ${offer.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${offer.badgeTone}`}>
                          {offer.badge}
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-950 text-white px-2 py-0.5 rounded-md text-xs font-mono font-bold tracking-wider">
                          <span>{offer.code}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(offer.code, e)}
                            className="hover:text-emerald-400"
                            title="Copy Code"
                          >
                            {copiedCode === offer.code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <h3 className="font-black text-base text-slate-950 mt-1">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {offer.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {currentFare > 0 && discount > 0 && (
                      <div className="mb-1">
                        <span className="text-xs text-slate-400 line-through mr-1 font-semibold">
                          ₹{currentFare}
                        </span>
                        <span className="text-base font-black text-emerald-700">
                          ₹{finalFare}
                        </span>
                        <div className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-0.5">
                          Save ₹{discount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-300/60 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {offer.expiresIn}
                  </span>

                  {isApplied ? (
                    <div className="flex items-center gap-1 text-emerald-700 font-black">
                      <CheckCircle2 className="w-4 h-4" />
                      Applied
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyOffer?.(offer);
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-black rounded-xl shadow transition flex items-center gap-1"
                    >
                      Apply Offer <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            🔒 All promotional discounts are backed by SmartCab Gujarat Platform &amp; Safe-Rider Guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
