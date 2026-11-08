import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, ArrowRight, ShieldCheck, Star, Car, Clock, 
  Sparkles, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, 
  Sliders, User, Phone, MessageSquare, Zap, Loader2, Award, ChevronUp
} from 'lucide-react';
import { apiFetch } from './api';

const FareBiddingModal = ({
  isOpen,
  onClose,
  pickup = 'AIT College, Ognaj, Ahmedabad',
  dropoff = 'Iskcon Crossroads, SG Highway, Ahmedabad',
  pickupCoords = null,
  dropoffCoords = null,
  distanceKm = 10,
  recommendedFare = 180,
  selectedCar = 'SmartMini',
  onRideMatched = null
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState('OFFER'); // 'OFFER' | 'BROADCASTING' | 'MATCHED'
  const [riderOffer, setRiderOffer] = useState(Math.max(50, Math.round(recommendedFare * 0.9)));
  const [passengerNotes, setPassengerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [acceptedOffer, setAcceptedOffer] = useState(null);
  const [matchedTrip, setMatchedTrip] = useState(null);
  const [boostLoading, setBoostLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // Sync initial offer when modal opens
  useEffect(() => {
    setRiderOffer(Math.max(50, Math.round(recommendedFare * 0.9)));
  }, [recommendedFare]);

  // Countdown timer during broadcast
  useEffect(() => {
    let interval = null;
    if (step === 'BROADCASTING' && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Periodic poll for driver bids
  useEffect(() => {
    let pollInterval = null;
    if (step === 'BROADCASTING' && sessionId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await apiFetch(`/api/bidding/${sessionId}/offers`);
          if (res && res.offers) {
            setOffers(res.offers);
          }
        } catch (e) {
          console.warn('Offers poll error:', e);
        }
      }, 3000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, sessionId]);

  const handleStartBidding = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/bidding/create', {
        method: 'POST',
        body: JSON.stringify({
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          pickupCoords,
          dropoffCoords,
          distanceKm,
          recommendedFare,
          riderOfferFare: riderOffer,
          selectedCar,
          passengerNotes: passengerNotes || undefined,
          riderName: 'Aayushi S.',
          riderPhone: '+91 98250 12345',
        }),
      });

      if (res && res.success) {
        setSessionId(res.sessionId);
        setOffers(res.driverOffers || []);
        setStep('BROADCASTING');
        setTimer(60);
      } else {
        setError('Could not initialize bidding auction.');
      }
    } catch (err) {
      setError(err.message || 'Failed to start bidding session');
    } finally {
      setLoading(false);
    }
  };

  const handleBoostOffer = async (amount = 20) => {
    if (!sessionId) return;
    setBoostLoading(true);
    try {
      const res = await apiFetch(`/api/bidding/${sessionId}/boost`, {
        method: 'POST',
        body: JSON.stringify({ boostAmount: amount }),
      });
      if (res && res.success) {
        setRiderOffer(res.newRiderOffer);
        setOffers(res.offers || []);
      }
    } catch (err) {
      setError('Could not boost offer: ' + err.message);
    } finally {
      setBoostLoading(false);
    }
  };

  const handleAcceptDriverOffer = async (offer) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/bidding/${sessionId}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: offer.driverId,
          offerId: offer.offerId,
        }),
      });

      if (res && res.success) {
        setAcceptedOffer(offer);
        setMatchedTrip(res);
        setStep('MATCHED');

        if (onRideMatched) {
          onRideMatched(res);
        }
      }
    } catch (err) {
      setError('Failed to confirm driver offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (sessionId) {
      try {
        await apiFetch(`/api/bidding/${sessionId}/cancel`, { method: 'POST' });
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  const diffPercent = Math.round(((recommendedFare - riderOffer) / recommendedFare) * 100);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-black text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Name Your Fare™ (Bidding)</h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-black uppercase">
                  InDrive Mode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Propose your target price &amp; choose from live driver counter-offers
              </p>
            </div>
          </div>
          <button
            onClick={step === 'BROADCASTING' ? handleCancelSession : onClose}
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

          {/* STEP 1: PROPOSE OFFER FARE */}
          {step === 'OFFER' && (
            <div className="space-y-4">
              {/* Route Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-bold">
                  <span>TRIP DISTANCE: ~{distanceKm.toFixed(1)} km</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-black">
                    Standard Rate: ₹{recommendedFare}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 space-y-1">
                  <p className="truncate">🟢 <span className="font-bold">Pickup:</span> {pickup}</p>
                  <p className="truncate">🔴 <span className="font-bold">Dropoff:</span> {dropoff}</p>
                </div>
              </div>

              {/* Offer Selector Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl p-5 text-center space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Your Target Fare Proposal
                </p>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setRiderOffer(Math.max(40, riderOffer - 10))}
                    className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-emerald-200 font-black text-emerald-800 hover:bg-emerald-100 transition text-lg"
                  >
                    -
                  </button>
                  <div className="text-4xl font-black text-emerald-950 flex items-center justify-center">
                    ₹{riderOffer}
                  </div>
                  <button
                    onClick={() => setRiderOffer(riderOffer + 10)}
                    className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-emerald-200 font-black text-emerald-800 hover:bg-emerald-100 transition text-lg"
                  >
                    +
                  </button>
                </div>

                {/* Savings or Surge Meter */}
                <div className="flex items-center justify-center space-x-1.5 text-xs font-bold">
                  {riderOffer < recommendedFare ? (
                    <span className="text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full">
                      🎉 ₹{recommendedFare - riderOffer} ({diffPercent}%) Below Standard Rate
                    </span>
                  ) : riderOffer === recommendedFare ? (
                    <span className="text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">
                      ⚖️ Equal to Recommended Standard Rate
                    </span>
                  ) : (
                    <span className="text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full">
                      ⚡ Priority Express Bonus (+₹{riderOffer - recommendedFare})
                    </span>
                  )}
                </div>

                {/* Quick Offer Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {[
                    { label: 'Budget (-20%)', amount: Math.round(recommendedFare * 0.8) },
                    { label: 'Fair (-10%)', amount: Math.round(recommendedFare * 0.9) },
                    { label: 'Standard', amount: recommendedFare },
                    { label: 'Fast Match (+15%)', amount: Math.round(recommendedFare * 1.15) },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRiderOffer(p.amount)}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-xl border transition ${
                        riderOffer === p.amount
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}: ₹{p.amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Passenger Custom Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Rider Preference Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 bags, AC on chilled, pickup outside main gate..."
                  value={passengerNotes}
                  onChange={(e) => setPassengerNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={80}
                />
              </div>

              {/* Start Bidding Button */}
              <button
                onClick={handleStartBidding}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 hover:from-emerald-700 hover:to-black text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting to Nearby Drivers…</span>
                  </>
                ) : (
                  <>
                    <span>Broadcast Offer for ₹{riderOffer}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: LIVE BROADCAST & DRIVER BIDS AUCTION */}
          {step === 'BROADCASTING' && (
            <div className="space-y-4">
              {/* Radar Status Header */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full relative"></div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-emerald-400">Live Driver Bidding Auction</p>
                    <p className="text-xs text-slate-300">
                      Your offer: <strong className="text-white text-sm">₹{riderOffer}</strong> ({timer}s remaining)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleBoostOffer(10)}
                    disabled={boostLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                  >
                    <ChevronUp className="w-3 h-3" /> +₹10
                  </button>
                  <button
                    onClick={() => handleBoostOffer(20)}
                    disabled={boostLoading}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                  >
                    <ChevronUp className="w-3 h-3" /> +₹20
                  </button>
                </div>
              </div>

              {/* Driver Offers List */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>Incoming Driver Bids ({offers.length} active)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tap 'Accept &amp; Ride' to confirm</span>
                </p>

                {offers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                    <p className="text-xs font-bold text-slate-600">Waiting for driver counter-offers…</p>
                    <p className="text-[11px] text-slate-400">Nearby drivers in Ahmedabad are reviewing your ₹{riderOffer} offer.</p>
                  </div>
                ) : (
                  offers.map((offer) => (
                    <div
                      key={offer.offerId}
                      className={`p-3.5 rounded-2xl border transition shadow-sm flex flex-col space-y-2 ${
                        offer.bidType === 'ACCEPTED_OFFER'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={offer.photo}
                            alt={offer.driverName}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-300 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h3 className="font-extrabold text-sm text-slate-900">{offer.driverName}</h3>
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {offer.rating}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold">{offer.carModel} • <span className="font-mono text-[11px]">{offer.plate}</span></p>
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-black">
                              {offer.badge}
                            </span>
                          </div>
                        </div>

                        {/* Price & ETA */}
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">
                            ₹{offer.proposedFare}
                          </div>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            offer.bidType === 'ACCEPTED_OFFER'
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {offer.bidType === 'ACCEPTED_OFFER' ? 'MATCHED OFFER' : `+₹${offer.proposedFare - riderOffer}`}
                          </span>
                          <p className="text-[11px] text-slate-500 font-bold mt-0.5">{offer.etaMinutes} mins away</p>
                        </div>
                      </div>

                      {/* Driver message & Accept action */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-600 italic truncate flex-1">
                          "{offer.message}"
                        </p>
                        <button
                          onClick={() => handleAcceptDriverOffer(offer)}
                          disabled={loading}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow transition flex items-center space-x-1 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Accept &amp; Ride</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3: MATCHED & DISPATCHED */}
          {step === 'MATCHED' && acceptedOffer && (
            <div className="p-6 text-center space-y-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 rounded-3xl border border-emerald-200">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Fare Agreed: ₹{acceptedOffer.proposedFare}!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Driver Partner <strong>{acceptedOffer.driverName}</strong> is en route for pickup.
                </p>
              </div>

              {/* Driver Partner Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left flex items-center space-x-3 shadow-sm">
                <img
                  src={acceptedOffer.photo}
                  alt={acceptedOffer.driverName}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-sm text-slate-900">{acceptedOffer.driverName}</p>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ETA {acceptedOffer.etaMinutes} mins
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{acceptedOffer.carModel}</p>
                  <p className="text-xs font-mono font-bold text-slate-700">{acceptedOffer.plate}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={matchedTrip?.trackUrl || `/track/${matchedTrip?.tripId}`}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <Car className="w-4 h-4" /> Live GPS Tracking Screen
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  Close &amp; Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FareBiddingModal;
