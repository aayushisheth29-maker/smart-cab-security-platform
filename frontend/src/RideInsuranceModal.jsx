import React, { useState } from 'react';
import { 
  ShieldCheck, HeartPulse, CheckCircle2, X, PhoneCall, FileText,
  AlertCircle, Sparkles, Building2, Umbrella, Download, Check
} from 'lucide-react';
import { API_BASE } from './api';

export default function RideInsuranceModal({
  isOpen,
  onClose,
  tripId = 'SC-2026-000549',
  passengerName = 'Aayushi Sheth'
}) {
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const policyNumber = `SMARTCAB-INS-2026-${typeof tripId === 'string' ? tripId.toUpperCase() : 'TRIP'}`;

  if (!isOpen) return null;

  const coverageItems = [
    {
      title: 'Emergency Medical & First-Aid Expenses',
      amount: '₹15,000',
      desc: 'Immediate reimbursement for emergency outpatient care, wound dressing, X-ray, and medication at any clinic/ER in Ahmedabad.',
      badge: 'QUICK REIMBURSEMENT'
    },
    {
      title: 'Emergency 108 Ambulance Dispatch',
      amount: '₹5,000',
      desc: '100% emergency trauma ambulance and paramedic transit expenses covered.',
      badge: '100% COVERED'
    },
    {
      title: 'Transit Belongings & Bag Assistance',
      amount: '₹5,00,0',
      desc: 'Assistance for transit accidental damage to personal belongings or mobile phone during the trip.',
      badge: 'STARTER SHIELD'
    },
    {
      title: 'Accidental Road Safety Protection',
      amount: '₹50,000',
      desc: 'Starter accidental medical compensation protection for the passenger.',
      badge: 'DIRECT NOMINEE'
    }
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Umbrella className="h-4 w-4" />
            <span>SmartCab Starter Ride Micro-Protection</span>
          </div>
          <h2 className="text-2xl font-black">
            ₹50,000 Ride Safety Shield
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Policy #{policyNumber} · Complimentary Micro-Coverage for Every Active Ride
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* POLICY BANNER */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">
                Active Ride Micro-Cover
              </span>
              <p className="text-xs text-indigo-950 font-bold">
                Insured Passenger: {passengerName}
              </p>
              <p className="text-[11px] text-indigo-700">
                Ride Ref: <strong>{tripId}</strong> · ₹0 Extra Cost (Included in Every Trip)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">Total Micro-Sum</span>
              <span className="text-2xl font-black text-indigo-900">₹50,000</span>
            </div>
          </div>

          {/* COVERAGE LIST */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Starter Micro-Benefits &amp; Support
            </h4>
            {coverageItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {item.amount}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 pl-5">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 24/7 SUPPORT & CLAIMS */}
          <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">
                24/7 SmartCab Safety Desk
              </span>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                Helpline &amp; First-Aid Assistance: <strong>1800-2666 / 108</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setClaimSubmitted(true);
                alert(`🏥 Emergency Micro-Claim registered for Policy #${policyNumber}. SmartCab safety team notified.`);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <HeartPulse className="h-4 w-4" />
              <span>{claimSubmitted ? 'Claim Registered' : 'File First-Aid Claim'}</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Starter safety assistance policy for city rides.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Close Shield
          </button>
        </div>
      </div>
    </div>
  );
}
