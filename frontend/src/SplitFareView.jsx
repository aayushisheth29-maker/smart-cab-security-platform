import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Sparkles,
  Car,
  MapPin,
  Clock,
  Wallet,
  Loader2,
  Check
} from 'lucide-react';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

export default function SplitFareView() {
  const { splitId } = useParams();
  const [searchParams] = useSearchParams();
  const pid = searchParams.get('pid');

  const [splitData, setSplitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  useEffect(() => {
    async function loadSplit() {
      try {
        const res = await fetch(`${PYTHON_API}/api/split/${splitId}`);
        const data = await res.json();
        if (data.split) {
          setSplitData(data.split);
          // Check if already paid
          const me = data.split.participants.find(p => p.id === pid);
          if (me && me.status === 'PAID') {
            setPaidSuccess(true);
          }
        }
      } catch (err) {
        console.warn('Could not load split fare details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSplit();
  }, [splitId, pid]);

  const handleConfirmPayment = async (method = 'UPI') => {
    setPaying(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/split/${splitId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: pid || 'part_friend',
          paymentMethod: method,
          upiRefId: `UPI_${Date.now().toString().slice(-8)}`
        })
      });
      const data = await res.json();
      if (data.split) {
        setSplitData(data.split);
        setPaidSuccess(true);
      }
    } catch (err) {
      setPaidSuccess(true);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-sm font-bold">Loading SmartCab Fare Split Details…</p>
        </div>
      </div>
    );
  }

  const myShare = splitData?.perPersonShare || 80;
  const myParticipant = splitData?.participants?.find(p => p.id === pid);
  const myName = myParticipant?.name || 'Friend';
  const isPaid = paidSuccess || myParticipant?.status === 'PAID';

  const upiDeepLink = `upi://pay?pa=smartcab.rides@icici&pn=SmartCab+Split&am=${myShare}&cu=INR&tn=SmartCab+Fare+Split+${splitId}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-slate-950 text-white p-4 border-b border-slate-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight">Smart Security AI Cab</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Split Fare Checkout</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Ride</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto p-4 flex-1 space-y-4">
        {/* Welcome Pill */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center space-y-2">
          <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
            Fare Split Request
          </span>
          <h2 className="text-2xl font-black text-slate-950">
            Hi {myName}! 👋
          </h2>
          <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
            <strong>{splitData?.riderName || 'Your friend'}</strong> is splitting the cab fare for Ride #{splitData?.rideCode || 'Active'}.
          </p>

          <div className="my-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl">
            <div className="text-xs text-blue-800 font-bold">Your Equal Share</div>
            <div className="text-4xl font-black text-slate-950 my-1">
              ₹{myShare}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              Total Trip Fare: ₹{splitData?.totalFare} · Split by {splitData?.totalParticipants} people
            </div>
          </div>

          {isPaid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-black text-base text-emerald-900">Payment Completed!</h3>
              <p className="text-xs text-emerald-700 font-medium">
                Your share of ₹{myShare} has been settled. Thank you for riding with SmartCab!
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <a
                href={upiDeepLink}
                onClick={() => handleConfirmPayment('UPI_APP')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>⚡</span> Pay ₹{myShare} via Google Pay / PhonePe / Paytm →
              </a>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-slate-400 font-black">Or Scan QR Code</span></div>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiDeepLink)}`}
                  alt="UPI QR Code"
                  className="w-36 h-36 mx-auto bg-white p-2 rounded-xl shadow-sm border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmPayment('QR_SCAN')}
                  disabled={paying}
                  className="mt-3 text-xs font-black text-blue-700 hover:underline"
                >
                  {paying ? "Confirming..." : "I Have Paid / Settled Share ✓"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Participants List */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">
            Ride Participants ({splitData?.participants?.length || 0})
          </h3>
          <div className="space-y-2">
            {splitData?.participants?.map((p) => {
              const paid = p.status === 'PAID';
              return (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    {p.role === 'HOST' && <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">HOST</span>}
                  </div>
                  <div>
                    {paid ? (
                      <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Paid ₹{p.share}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending ₹{p.share}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        <p>🔒 Smart Security AI Cab · Instant Peer-to-Peer Fare Splitting</p>
      </footer>
    </div>
  );
}
