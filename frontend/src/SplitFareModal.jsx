import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  QrCode,
  Sparkles,
  Phone,
  User,
  BadgePercent,
  Wallet,
  Loader2
} from 'lucide-react';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

export default function SplitFareModal({
  isOpen,
  onClose,
  bookingDetails
}) {
  const [friends, setFriends] = useState([
    { name: '', phone: '' }
  ]);
  const [splitData, setSplitData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'qr' | 'status'

  if (!isOpen || !bookingDetails) return null;

  const totalFare = Number(bookingDetails.finalFare || bookingDetails.fare || 240);
  const riderName = bookingDetails.riderName || 'You (Host)';
  const totalCount = friends.filter(f => f.name.trim()).length + 1;
  const perPersonEstimated = Math.round(totalFare / totalCount);

  const handleAddFriend = () => {
    if (friends.length < 3) {
      setFriends([...friends, { name: '', phone: '' }]);
    }
  };

  const handleRemoveFriend = (index) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleFriendChange = (index, field, value) => {
    const updated = [...friends];
    updated[index][field] = value;
    setFriends(updated);
  };

  const handleCreateSplit = async () => {
    const validFriends = friends.filter(f => f.name.trim());
    if (validFriends.length === 0) {
      alert("Please add at least one friend's name to split the fare.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/split-fare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: bookingDetails.bookingId,
          rideCode: bookingDetails.rideCode || `SC-${bookingDetails.bookingId}`,
          riderName: bookingDetails.riderName || 'Host Rider',
          totalFare,
          friends: validFriends
        })
      });
      const data = await res.json();
      if (data.split) {
        setSplitData(data.split);
        setActiveTab('status');
      }
    } catch (err) {
      // Local fallback simulator
      const perShare = Math.round(totalFare / (validFriends.length + 1));
      const mockSplit = {
        splitId: `SPLIT_${Date.now().toString(36)}`,
        totalFare,
        totalParticipants: validFriends.length + 1,
        perPersonShare: perShare,
        collectedAmount: perShare,
        pendingAmount: totalFare - perShare,
        status: 'ACTIVE',
        participants: [
          { id: 'p0', name: riderName, role: 'HOST', share: perShare, status: 'PAID' },
          ...validFriends.map((f, i) => ({
            id: `p${i + 1}`,
            name: f.name,
            phone: f.phone,
            role: 'FRIEND',
            share: perShare,
            status: 'PENDING',
            splitUrl: `${window.location.origin}/split/SPLIT_${Date.now().toString(36)}?pid=p${i + 1}`,
            whatsappText: `🚕 SmartCab Fare Split: Hey ${f.name}! ${riderName} split the cab fare (Total: ₹${totalFare}). Your equal share is ₹${perShare}. Pay via UPI here: ${window.location.origin}/split/SPLIT_${Date.now().toString(36)}?pid=p${i + 1}`
          }))
        ]
      };
      setSplitData(mockSplit);
      setActiveTab('status');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(''), 2000);
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
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                Split Fare with Friends
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  UPI 1-Tap
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Ride #{bookingDetails.rideCode || bookingDetails.bookingId || 'Active'} · Total Fare: ₹{totalFare}
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

        {/* Tab Navigation if split already created */}
        {splitData && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-700 font-black bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 Live Split Status
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeTab === 'qr'
                  ? 'border-blue-600 text-blue-700 font-black bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              📱 Instant UPI QR
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Fare Summary Pill */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-800 font-bold">Total Trip Fare</div>
              <div className="text-2xl font-black text-slate-950">₹{totalFare}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-800 font-bold">Your Share ({totalCount} People)</div>
              <div className="text-2xl font-black text-emerald-700">₹{splitData ? splitData.perPersonShare : perPersonEstimated}</div>
            </div>
          </div>

          {!splitData || activeTab === 'invite' ? (
            /* Invite Friends Step */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Add Riding Companions (Up to 3)
                </label>
                {friends.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddFriend}
                    className="text-xs font-black text-blue-700 hover:text-blue-800 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Friend
                  </button>
                )}
              </div>

              {friends.map((friend, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-600">
                      Friend #{idx + 1}
                    </span>
                    {friends.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Friend's Name (e.g. Priya)"
                        value={friend.name}
                        onChange={(e) => handleFriendChange(idx, 'name', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="Phone (optional for WhatsApp)"
                        value={friend.phone}
                        onChange={(e) => handleFriendChange(idx, 'phone', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleCreateSplit}
                disabled={loading}
                className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Generate UPI Split Links (₹{perPersonEstimated} each) →
              </button>
            </div>
          ) : activeTab === 'status' ? (
            /* Active Live Status Step */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase">
                <span>Split Participants</span>
                <span className="text-emerald-700">
                  Collected ₹{splitData.collectedAmount} / ₹{splitData.totalFare}
                </span>
              </div>

              <div className="space-y-2">
                {splitData.participants.map((p) => {
                  const isPaid = p.status === 'PAID';
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border-2 transition ${
                        isPaid ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              {p.name}
                              {p.role === 'HOST' && (
                                <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">
                                  HOST
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold">
                              Share: <strong className="text-slate-900">₹{p.share}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isPaid ? (
                            <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons for pending friends */}
                      {!isPaid && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-2">
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(p.whatsappText || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl text-center shadow-sm transition flex items-center justify-center gap-1"
                          >
                            <span>💬</span> Send WhatsApp Invite
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.splitUrl)}
                            className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-xl transition flex items-center gap-1"
                          >
                            {copiedLink === p.splitUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Need to split with more friends?</span>
                <button
                  type="button"
                  onClick={() => setSplitData(null)}
                  className="text-blue-700 hover:underline font-black"
                >
                  Edit Friends
                </button>
              </div>
            </div>
          ) : (
            /* QR Code Step */
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=smartcab.rides@icici&pn=SmartCab+Split&am=${splitData.perPersonShare}&cu=INR&tn=Split+Fare+${splitData.splitId}`
                  )}`}
                  alt="UPI Payment QR"
                  className="w-44 h-44 mx-auto"
                />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Scan &amp; Pay ₹{splitData.perPersonShare}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan with Google Pay, PhonePe, Paytm, or any UPI app
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            🔒 SmartCab Instant UPI Split · Zero transaction fees for riders.
          </p>
        </div>
      </div>
    </div>
  );
}
