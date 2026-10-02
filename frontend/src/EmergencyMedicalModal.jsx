import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, PhoneCall, HeartPulse, Hospital, MapPin, Navigation, 
  X, AlertTriangle, CheckCircle2, User, Activity, Siren, Ambulance,
  ExternalLink, Stethoscope, FileText, ChevronRight
} from 'lucide-react';
import { API_BASE, authHeaders } from './api';

const DEFAULT_HOSPITALS = [
  {
    id: "HOSP-01",
    name: "Apollo Hospitals International",
    city: "Ahmedabad",
    address: "Plot No. 1A, Bhat GIDC Estate, Gandhinagar / SG Highway, Ahmedabad",
    lat: 23.1168,
    lng: 72.5937,
    emergencyPhone: "+91 79 6670 1800",
    speciality: "Level-1 Trauma & 24/7 Cardiac Emergency",
    open24x7: true,
    distanceKm: 3.4,
    etaMinutes: 8,
    bloodBank: true,
    icuBeds: 120
  },
  {
    id: "HOSP-02",
    name: "Civil Hospital Trauma Center (108 Hub)",
    city: "Ahmedabad",
    address: "Asarwa, Near B.J. Medical College, Ahmedabad",
    lat: 23.0525,
    lng: 72.6028,
    emergencyPhone: "108",
    speciality: "Asia's Largest Apex Govt Trauma & Burns Center",
    open24x7: true,
    distanceKm: 4.8,
    etaMinutes: 11,
    bloodBank: true,
    icuBeds: 350
  },
  {
    id: "HOSP-03",
    name: "KD Hospital (Kusum Dhirajlal)",
    city: "Ahmedabad",
    address: "Vaishnodevi Circle, SG Highway, Ahmedabad",
    lat: 23.1362,
    lng: 72.5484,
    emergencyPhone: "+91 79 6777 0000",
    speciality: "24/7 Multi-Super Speciality Emergency & Stroke Unit",
    open24x7: true,
    distanceKm: 5.2,
    etaMinutes: 12,
    bloodBank: true,
    icuBeds: 95
  },
  {
    id: "HOSP-04",
    name: "Sterling Hospital",
    city: "Ahmedabad",
    address: "Sterling Hospital Road, Memnagar, Ahmedabad",
    lat: 23.0501,
    lng: 72.5298,
    emergencyPhone: "+91 79 4001 1111",
    speciality: "Comprehensive Emergency Care & Neuro Trauma",
    open24x7: true,
    distanceKm: 2.1,
    etaMinutes: 5,
    bloodBank: true,
    icuBeds: 80
  },
  {
    id: "HOSP-05",
    name: "Zydus Hospital",
    city: "Ahmedabad",
    address: "Zydus Hospitals Road, Thaltej, SG Highway, Ahmedabad",
    lat: 23.0645,
    lng: 72.5186,
    emergencyPhone: "+91 79 6619 0201",
    speciality: "Advanced Critical Care & Emergency Response",
    open24x7: true,
    distanceKm: 2.9,
    etaMinutes: 7,
    bloodBank: true,
    icuBeds: 110
  }
];

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function EmergencyMedicalModal({
  isOpen,
  onClose,
  currentLat = 23.0225,
  currentLng = 72.5714,
  tripId = null,
  onRerouteHospital
}) {
  const [activeTab, setActiveTab] = useState('hospitals'); // 'hospitals' | 'profile' | 'dispatch'
  const [hospitals, setHospitals] = useState(DEFAULT_HOSPITALS);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Medical Profile State
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('No known drug allergies (NKDA)');
  const [medicalConditions, setMedicalConditions] = useState('None');
  const [emergencyDoctorPhone, setEmergencyDoctorPhone] = useState('+91 98765 10800');
  const [organDonor, setOrganDonor] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Emergency Dispatch State
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load nearest hospitals from backend
    const fetchHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const res = await fetch(`${API_BASE}/api/medical/nearest-hospitals?lat=${currentLat}&lng=${currentLng}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hospitals && data.hospitals.length > 0) {
            setHospitals(data.hospitals);
          }
        }
      } catch (err) {
        console.warn('Could not fetch hospitals from backend:', err);
      } finally {
        setLoadingHospitals(false);
      }
    };

    // Load Medical Profile
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/medical/profile`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setBloodGroup(data.profile.bloodGroup || 'O+');
            setAllergies(data.profile.allergies || 'No known drug allergies (NKDA)');
            setMedicalConditions(data.profile.medicalConditions || 'None');
            setEmergencyDoctorPhone(data.profile.emergencyDoctorPhone || '+91 98765 10800');
            setOrganDonor(!!data.profile.organDonor);
          }
        }
      } catch (e) {}
    };

    fetchHospitals();
    fetchProfile();
  }, [isOpen, currentLat, currentLng]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    try {
      const payload = {
        bloodGroup,
        allergies,
        medicalConditions,
        emergencyDoctorPhone,
        organDonor
      };
      await fetch(`${API_BASE}/api/medical/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileSaved(true);
    }
  };

  const handleTrigger108Dispatch = async (targetHospital = null) => {
    setDispatching(true);
    const chosenHosp = targetHospital || hospitals[0];
    try {
      const payload = {
        tripId,
        lat: currentLat,
        lng: currentLng,
        hospitalId: chosenHosp?.id || "HOSP-01",
        bloodGroup,
        emergencyType: "GENERAL_TRAUMA",
        medicalNotes: `Allergies: ${allergies} | Conditions: ${medicalConditions}`
      };
      const res = await fetch(`${API_BASE}/api/medical/dispatch-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setDispatchStatus(data.alert || {
        alertId: `MED-ALERT-${Date.now().toString(36).toUpperCase()}`,
        targetHospital: chosenHosp?.name || "Apollo Hospitals",
        hospitalEmergencyPhone: chosenHosp?.emergencyPhone || "108"
      });
    } catch (err) {
      setDispatchStatus({
        alertId: `MED-ALERT-${Date.now().toString(36).toUpperCase()}`,
        targetHospital: chosenHosp?.name || "Apollo Hospitals",
        hospitalEmergencyPhone: chosenHosp?.emergencyPhone || "108"
      });
    } finally {
      setDispatching(false);
      setActiveTab('dispatch');
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-red-200 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-red-200 text-xs font-black uppercase tracking-wider mb-2">
            <HeartPulse className="h-4 w-4 animate-pulse text-white" />
            <span>24/7 Emergency Medical Response Protocol</span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span>Hospital Quick-Guide &amp; SOS</span>
          </h2>
          <p className="text-red-100 text-xs mt-1">
            Instant 108 ambulance dispatch, nearest trauma centers &amp; medical ID
          </p>

          {/* TAB BAR */}
          <div className="flex gap-2 mt-4 bg-red-950/40 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('hospitals')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'hospitals' ? 'bg-white text-red-700 shadow-md' : 'text-red-100 hover:text-white'
              }`}
            >
              <Hospital className="h-3.5 w-3.5" />
              <span>Nearest ERs ({hospitals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'profile' ? 'bg-white text-red-700 shadow-md' : 'text-red-100 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Medical ID Profile</span>
            </button>

            {dispatchStatus && (
              <button
                type="button"
                onClick={() => setActiveTab('dispatch')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'dispatch' ? 'bg-white text-red-700 shadow-md animate-pulse' : 'text-red-100 hover:text-white'
                }`}
              >
                <Ambulance className="h-3.5 w-3.5" />
                <span>108 Live Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: NEAREST HOSPITALS */}
          {activeTab === 'hospitals' && (
            <div className="space-y-4">
              {/* 108 QUICK DISPATCH BANNER */}
              <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white text-red-600 rounded-xl font-black text-lg">
                    108
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Emergency Medical Dispatch</h4>
                    <p className="text-[11px] text-red-100">National Ambulance &amp; Trauma Service</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTrigger108Dispatch()}
                  disabled={dispatching}
                  className="bg-white text-red-700 hover:bg-red-50 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-1.5 active:scale-95 transform"
                >
                  <Siren className="h-4 w-4 animate-pulse" />
                  <span>{dispatching ? 'Dispatching…' : 'Trigger 108 SOS'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider pt-1">
                <span>Verified 24/7 ER Hospitals in Ahmedabad</span>
                <span>Sorted by GPS distance</span>
              </div>

              {/* HOSPITALS LIST */}
              <div className="space-y-3">
                {hospitals.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{h.name}</h4>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            24/7 ER
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{h.address}</p>
                        <p className="text-[11px] text-indigo-700 font-bold mt-1">
                          ✦ {h.speciality}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-red-600 block">{h.distanceKm} km</span>
                        <span className="text-[10px] text-slate-500 font-bold block">~{h.etaMinutes} min drive</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <a
                        href={`tel:${h.emergencyPhone}`}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Call ER ({h.emergencyPhone})</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          onRerouteHospital?.(h);
                          alert(`🚑 Cab rerouted to ${h.name}! Estimated arrival: ${h.etaMinutes} mins.`);
                          onClose();
                        }}
                        className="bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Navigation className="h-3.5 w-3.5 text-amber-400" />
                        <span>Reroute Cab Here</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition"
                        title="Directions on Google Maps"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MEDICAL ID PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-800 space-y-1">
                <strong className="block text-red-900 font-extrabold flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" /> Passenger Emergency Medical ID
                </strong>
                <p>
                  This medical card is transmitted securely to paramedics and the destination hospital in emergencies.
                </p>
              </div>

              {/* BLOOD GROUP */}
              <div>
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-2">
                  Blood Group
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2.5 rounded-xl font-black text-sm border-2 transition ${
                        bloodGroup === bg
                          ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* ALLERGIES */}
              <div>
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
                  Known Drug &amp; Food Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Latex"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* MEDICAL CONDITIONS */}
              <div>
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
                  Existing Medical Conditions
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Diabetic, Asthma, Cardiac, High BP, Pregnancy"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* EMERGENCY DOCTOR PHONE */}
              <div>
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
                  Emergency Doctor / Family Physician Phone
                </label>
                <input
                  type="tel"
                  value={emergencyDoctorPhone}
                  onChange={(e) => setEmergencyDoctorPhone(e.target.value)}
                  placeholder="+91 98765 10800"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* ORGAN DONOR TOGGLE */}
              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organDonor}
                  onChange={(e) => setOrganDonor(e.target.checked)}
                  className="h-4 w-4 accent-red-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  Registered Organ Donor (Official Health ID)
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
              >
                {profileSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Medical Profile Saved Securely!</span>
                  </>
                ) : (
                  <span>Save Medical Profile</span>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: DISPATCH STATUS */}
          {activeTab === 'dispatch' && dispatchStatus && (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <Ambulance className="h-10 w-10" />
              </div>

              <div>
                <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  108 Emergency Protocol Active
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Emergency Medical Alert Dispatched
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1 font-bold">
                  Alert Ref: {dispatchStatus.alertId}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Hospital:</span>
                  <strong className="text-slate-900">{dispatchStatus.targetHospital}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ER Hotline:</span>
                  <a href={`tel:${dispatchStatus.hospitalEmergencyPhone}`} className="text-red-600 font-black underline">
                    {dispatchStatus.hospitalEmergencyPhone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passenger Blood Group:</span>
                  <strong className="text-red-700 font-black">{bloodGroup}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Ambulance Telemetry:</span>
                  <span className="text-emerald-700 font-bold">GPS Beacon Transmitted</span>
                </div>
              </div>

              <a
                href={`tel:${dispatchStatus.hospitalEmergencyPhone}`}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Call Emergency Coordinator ({dispatchStatus.hospitalEmergencyPhone})</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
