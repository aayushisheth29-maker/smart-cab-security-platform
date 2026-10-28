import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  X,
  CheckCircle2,
  Download,
  Scale,
  Printer,
  Trash2,
  Eye,
  Building2,
  Mail,
  Phone
} from 'lucide-react';

export default function DpdpPolicyModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('policy'); // 'policy' | 'rights' | 'consent'
  const [purged, setPurged] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePurgeData = () => {
    localStorage.removeItem('smartcab_last_ride');
    setPurged(true);
    setTimeout(() => setPurged(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Scale className="h-4 w-4" />
            <span>Digital Personal Data Protection (DPDP) Act 2023</span>
          </div>
          <h2 className="text-2xl font-black">
            Legal Privacy & Data Governance Center
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            SmartCab Technologies India Pvt Ltd · Statutory Legal Declarations
          </p>

          {/* TABS */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-3.5 py-1.5 rounded-full transition ${activeTab === 'policy' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              📜 Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('rights')}
              className={`px-3.5 py-1.5 rounded-full transition ${activeTab === 'rights' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              🛡️ Data Principal Rights
            </button>
            <button
              onClick={() => setActiveTab('consent')}
              className={`px-3.5 py-1.5 rounded-full transition ${activeTab === 'consent' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              📍 GPS Consent Terms
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs leading-relaxed">
          {activeTab === 'policy' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  1. Data Fiduciary Identification
                </h3>
                <p>
                  <strong>Entity:</strong> SmartCab Technologies India Private Limited<br />
                  <strong>CIN:</strong> U72900GJ2026PTC149812<br />
                  <strong>Registered Office:</strong> SG Highway, Ahmedabad, Gujarat, India - 380054.<br />
                  <strong>Regulatory Framework:</strong> Complies with Digital Personal Data Protection Act, 2023 (DPDP), Information Technology Act, 2000, and Motor Vehicle Aggregator Guidelines.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  2. Categories of Personal Data Processed
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Identity Information:</strong> Name, verified mobile phone number, emergency contacts.</li>
                  <li><strong>Geospatial Telemetry:</strong> Real-time GPS coordinates, speed, and heading strictly during active rides.</li>
                  <li><strong>Payment Data:</strong> Handled directly by RBI-licensed payment aggregators (Razorpay / UPI networks); zero card/CVV data stored on SmartCab servers.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  3. Purpose of Processing & AI Route Anomaly Radar
                </h4>
                <p>
                  Location telemetry is processed exclusively to calculate fares, provide live GPS tracking to passenger-selected emergency contacts, and run the Isolation Forest Machine Learning model for safety deviation detection. Data is never sold or monetized.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  4. Automatic 30-Day Data Pruning
                </h4>
                <p>
                  In compliance with the Data Minimization mandate of Section 6 of DPDP Act 2023, high-resolution GPS breadcrumbs are automatically purged 30 days post-ride completion.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 space-y-1">
                <strong>Grievance Redressal Officer (Section 13):</strong>
                <p className="text-[11px]">
                  Name: Grievance Officer, SmartCab Legal Desk<br />
                  Email: <code>grievance@smartcab.in</code> · Phone: +91 (079) 4001-9820<br />
                  Address: Legal Compliance Dept, SG Highway, Ahmedabad 380054.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rights' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Your Rights as a Data Principal (DPDP Act 2023)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <strong className="text-slate-900 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                    Right to Access Information
                  </strong>
                  <p className="text-slate-600 text-[11px]">
                    You have the right to obtain a summary of personal data and processing activities carried out by SmartCab.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <strong className="text-slate-900 flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-emerald-600" />
                    Right to Correction & Erasure
                  </strong>
                  <p className="text-slate-600 text-[11px]">
                    You may correct inaccurate data or request deletion of historical telemetry logs at any time.
                  </p>
                </div>
              </div>

              {/* 1-TAP INSTANT ERASURE BUTTON */}
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-rose-900 text-sm block">1-Tap Right to Erasure (Purge Ride Logs)</strong>
                    <span className="text-[11px] text-rose-700">Immediately clear your cached location and trip breadcrumbs.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePurgeData}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Purge My Data</span>
                  </button>
                </div>
                {purged && (
                  <p className="text-emerald-700 font-bold text-xs bg-emerald-100 p-2 rounded-lg">
                    ✅ Your local ride traces and cached telemetry have been securely erased.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'consent' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Explicit GPS Tracking & Cabin Security Consent
              </h3>
              <p>
                By requesting a ride on SmartCab, you grant explicit, revocable consent for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Acquiring high-accuracy GPS coordinates during trip progression.</li>
                <li>Transmitting live location coordinates to your designated Trusted Contacts when you activate <strong>Live Guard</strong>.</li>
                <li>Executing the Isolation Forest anomaly detector to verify that the vehicle remains within the planned route corridor.</li>
                <li>Optional client-side emergency cabin live streaming when you press the <strong>SOS Emergency Button</strong>.</li>
              </ul>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-medium text-xs">
                🛡️ Consent is granular and can be revoked anytime by disabling Live Guard in the ride settings.
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Official Declaration</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
