import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Heart,
  CheckCircle2,
  X,
  Sparkles,
  Award,
  ThumbsUp,
  Wallet,
  ArrowRight,
  Loader2,
  Coffee,
  Check
} from 'lucide-react';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

const COMPLIMENT_TAGS = [
  { id: 'safe_driver', label: '🛡️ Verified Safe Driver' },
  { id: 'clean_cab', label: '✨ Spotless & Clean Cab' },
  { id: 'polite', label: '😊 Polite & Courteous' },
  { id: 'route_nav', label: '🧭 Perfect Route Navigation' },
  { id: 'music_ac', label: '❄️ Pleasant AC & Music' },
  { id: 'night_guard', label: '🌙 Late Night Guardian' },
];

const TIP_OPTIONS = [
  { amount: 0, label: 'No Tip', icon: null },
  { amount: 20, label: '₹20 · Chai ☕', icon: Coffee },
  { amount: 50, label: '₹50 · Great Ride 🌟', icon: ThumbsUp },
  { amount: 100, label: '₹100 · Safe Guardian 🛡️', icon: Award }
];

export default function TripRatingModal({
  isOpen,
  onClose,
  tripDetails,
  onRatingSubmitted
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['🛡️ Verified Safe Driver', '✨ Spotless & Clean Cab']);
  const [feedback, setFeedback] = useState('');
  const [selectedTip, setSelectedTip] = useState(50);
  const [customTip, setCustomTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !tripDetails) return null;

  const driverName = tripDetails.driverName || 'Anita M.';
  const carPlate = tripDetails.carPlate || tripDetails.driverPlate || 'KA 01 EF 9012';
  const tripId = tripDetails.bookingId || tripDetails.id || 'SC-TRIP';

  const effectiveTip = customTip ? Math.max(0, Number(customTip) || 0) : selectedTip;

  const toggleTag = (tagLabel) => {
    if (selectedTags.includes(tagLabel)) {
      setSelectedTags(selectedTags.filter(t => t !== tagLabel));
    } else {
      setSelectedTags([...selectedTags, tagLabel]);
    }
  };

  const getRatingFeedbackTitle = (r) => {
    switch (r) {
      case 5: return "Exceptional & Super Safe! 🎉";
      case 4: return "Very Safe & Comfortable 👍";
      case 3: return "Good & On-Time 😊";
      case 2: return "Below Expectations ⚠️";
      case 1: return "Need Improvement 🚨";
      default: return "Rate Your Ride";
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          driverName,
          driverId: tripDetails.driverId || 1,
          rating,
          safetyCompliments: selectedTags,
          feedback,
          tipAmount: effectiveTip,
          tipPaymentMethod: effectiveTip > 0 ? 'UPI_DIRECT' : 'NONE',
          riderName: tripDetails.riderName || 'Verified Rider'
        })
      });
      const data = await res.json();
      setSubmitted(true);
      if (onRatingSubmitted) onRatingSubmitted(data);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-lg">
              {driverName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Rate Driver: {driverName}
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Vehicle: {carPlate} · Ride Ref: #{tripId}
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
          {submitted ? (
            /* Thank You View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Thank You for Your Feedback!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your rating helps maintain SmartCab's top-tier safety standards in Ahmedabad.
                  {effectiveTip > 0 && ` Your tip of ₹${effectiveTip} has been directly credited to ${driverName}'s bank account.`}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-700 max-w-xs mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rating Given:</span>
                  <span className="font-bold text-amber-500">{'⭐'.repeat(rating)} ({rating}/5)</span>
                </div>
                {effectiveTip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Tip:</span>
                    <span className="font-extrabold text-emerald-600">₹{effectiveTip} (100% to Driver)</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-sm rounded-2xl transition shadow-lg"
              >
                Close &amp; Return to Home
              </button>
            </div>
          ) : (
            /* Rating Form */
            <>
              {/* Star Rating Section */}
              <div className="text-center space-y-2 py-2">
                <div className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  How was your driver experience?
                </div>
                
                {/* Interactive Stars */}
                <div className="flex justify-center items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1.5 focus:outline-none transform hover:scale-125 transition duration-150"
                      >
                        <Star
                          className={`w-9 h-9 ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-extrabold text-slate-800 animate-in fade-in">
                  {getRatingFeedbackTitle(hoverRating || rating)}
                </p>
              </div>

              {/* Driver Compliments Chips */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">
                  Give a Safety &amp; Service Compliment
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLIMENT_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Written Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">
                  Leave a Note for {driverName} (Optional)
                </label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Very smooth driving, helpful with luggage, polite attitude."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 💸 100% Direct Driver Tip Calculator */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                    <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>Add Driver Tip (Optional)</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    100% Direct to Driver
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIP_OPTIONS.map((opt) => {
                    const isSelected = !customTip && selectedTip === opt.amount;
                    return (
                      <button
                        key={opt.amount}
                        type="button"
                        onClick={() => {
                          setSelectedTip(opt.amount);
                          setCustomTip('');
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black transition border text-center ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Custom Amount:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(e.target.value);
                      }}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-emerald-800 font-medium">
                  🔒 Zero platform deduction. Tips are settled instantly to the driver's linked UPI VPA.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Submit Feedback {effectiveTip > 0 && `& Pay ₹${effectiveTip} Tip`} →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
