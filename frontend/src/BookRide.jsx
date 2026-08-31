import React, { useState, useEffect, useRef } from 'react'; 
import { Link } from 'react-router-dom';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield,
  User, Phone, Mail, Building, CheckCircle, CheckCircle2, ArrowLeft, Loader2,
  CreditCard, Users, Plane, Box, AlertCircle, PhoneCall, Siren, Plus,
  Lock, Settings, History, LogOut, Search, Compass, Video, Download, RefreshCw , Mic,
  FileWarning
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { API_BASE, authHeaders } from './api';

// --- CUSTOM MAP ICONS ---
// Small pickup dot — just a black circle so the car isn't covered
// by a giant label. The actual "Pickup: <address>" text is shown
// in the bottom panel instead.
// Last updated: 2026-08-18 — Our Mission page is live ✨
// Manual redeploy triggered at 12:18 IST for the About page to surface
const pickupIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: black; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [9, 9]
});

// Small dropoff dot — green circle, same size as pickup
const dropoffIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #16a34a; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [9, 9]
});

const carIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #2563eb; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconAnchor: [18, 18]
});

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map, center, zoom]);
  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const BookRide = () => {
  // 📸 Camera direction state (user = front selfie, environment = back dashcam)
  const [facingMode, setFacingMode] = useState("user");

  // 🚗 Dynamic Driver Database
  const DRIVERS = [
    { name: "Rahul S.", rating: 4.8, dl: "MH02-2019-1234567", plate: "MH 02 AB 1234", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Vikram P.", rating: 4.9, dl: "DL04-2018-9876543", plate: "DL 04 CD 5678", photo: "https://randomuser.me/api/portraits/men/44.jpg" },
    { name: "Anita M.", rating: 5.0, dl: "KA01-2020-4567890", plate: "KA 01 EF 9012", photo: "https://randomuser.me/api/portraits/women/68.jpg" },
    { name: "Suresh K.", rating: 4.7, dl: "GJ01-2017-3456789", plate: "GJ 01 GH 3456", photo: "https://randomuser.me/api/portraits/men/22.jpg" },
    { name: "Priya T.", rating: 4.9, dl: "TS09-2021-1122334", plate: "TS 09 IJ 7890", photo: "https://randomuser.me/api/portraits/women/45.jpg" }
  ];
  
  const [assignedDriver, setAssignedDriver] = useState(DRIVERS[0]);

  // Java backend retired — everything now lives on the Python (FastAPI)
  // backend, whose URL is configured in one place (./api.js).
  const PYTHON_API = API_BASE;

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // 📱 PHONE COMPATIBILITY CHECK — runs a real diagnostic on the user's
  // device so they know if their phone/browser can run Smart Security AI Cab's live
  // tracking + camera features. Honest pass/fail per capability.
  const [compatCheck, setCompatCheck] = useState(null);
  const [compatRunning, setCompatRunning] = useState(false);
  const runCompatCheck = async () => {
    setCompatRunning(true);
    const results = {
      geolocation: typeof navigator !== 'undefined' && !!navigator.geolocation,
      mediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia,
      localStorage: (() => { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; } })(),
      webSocket: typeof WebSocket !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      browser: (() => {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS Safari';
        if (/Android.*Chrome/.test(ua)) return 'Android Chrome';
        if (/Android.*SamsungBrowser/.test(ua)) return 'Samsung Internet';
        if (/Android.*Firefox/.test(ua)) return 'Android Firefox';
        if (/Chrome/.test(ua)) return 'Chrome';
        if (/Safari/.test(ua)) return 'Safari';
        if (/Firefox/.test(ua)) return 'Firefox';
        return 'Unknown';
      })(),
      isInAppBrowser: /FBAN|FBAV|Instagram|Line|Twitter|WeChat|Telegram|LinkedInApp/i.test(navigator.userAgent),
      online: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
    // Try to actually request camera permission
    let cameraTest = 'not-tested';
    if (results.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraTest = 'granted';
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        cameraTest = err && err.name === 'NotAllowedError' ? 'denied' : 'error';
      }
    }
    results.cameraTest = cameraTest;
    setCompatCheck(results);
    setCompatRunning(false);
  };
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [shareTripEnabled, setShareTripEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
  const [activeTab, setActiveTab] = useState('request');
  const [mainView, setMainView] = useState('ride'); 
  const [dashTab, setDashTab] = useState('history'); 
  
  const [parcelMode, setParcelMode] = useState('send');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [pickupTime, setPickupTime] = useState('Pick up now');
  const [showForWhoDropdown, setShowForWhoDropdown] = useState(false);
  const [forWho, setForWho] = useState('For me');

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 🚗 DRIVER APPLICATION — real form payload + submit state
  const [driverForm, setDriverForm] = useState({
    fullName: '', phone: '', email: '', city: 'Ahmedabad',
    vehicleType: 'SmartMini', licenseNumber: '', experienceYears: '',
    ownVehicle: true, agreeTerms: false,
    criminalRecordDeclaration: false, policeVerificationNumber: '',
  });
  // 🛡️ Vet documents (licence / vehicle / police certificate) — uploaded after
  // the application is created so they can be reviewed before approval.
  const [driverDocs, setDriverDocs] = useState({
    licence: null, vehicle: null, police_certificate: null,
  });
  const [driverDocsStatus, setDriverDocsStatus] = useState({});
  const [driverDocsMessage, setDriverDocsMessage] = useState('');
  const [driverDocsBusy, setDriverDocsBusy] = useState(null);
  const [driverSubmitLoading, setDriverSubmitLoading] = useState(false);
  const [driverSubmitError, setDriverSubmitError] = useState('');
  const [driverApplicationResult, setDriverApplicationResult] = useState(null);
  const readDriverAppRef = () => {
    try { return localStorage.getItem('smartcab_driver_app_ref') || ''; } catch (e) { return ''; }
  };
  const [driverAppRef, setDriverAppRef] = useState(readDriverAppRef);
  const [driverAppStatus, setDriverAppStatus] = useState(null);
  const [driverStatusLoading, setDriverStatusLoading] = useState(false);

  const handleDriverFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDriverForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDriverFormNext = () => {
    setDriverSubmitError('');
    if (formStep === 1) {
      if (!driverForm.fullName.trim() || !driverForm.phone.trim()) {
        setDriverSubmitError('Please enter your full name and phone number.');
        return;
      }
      if (driverForm.phone.replace(/[^0-9]/g, '').length < 7) {
        setDriverSubmitError('Please enter a valid phone number (e.g. +91 98765 43210).');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (!driverForm.licenseNumber.trim()) {
        setDriverSubmitError('Please enter your driving licence number.');
        return;
      }
      if (!driverForm.agreeTerms) {
        setDriverSubmitError('Please accept the Driver Terms to continue.');
        return;
      }
      if (!driverForm.criminalRecordDeclaration) {
        setDriverSubmitError('Please confirm your criminal-record declaration to continue.');
        return;
      }
      submitDriverApplication();
    }
  };

  const submitDriverApplication = async () => {
    setDriverSubmitLoading(true);
    setDriverSubmitError('');
    try {
      const res = await fetch(`${PYTHON_API}/api/drivers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: driverForm.fullName.trim(),
          phone: driverForm.phone.trim(),
          email: driverForm.email.trim(),
          city: driverForm.city.trim(),
          vehicleType: driverForm.vehicleType,
          licenseNumber: driverForm.licenseNumber.trim(),
          experienceYears: parseFloat(driverForm.experienceYears || 0),
          ownVehicle: driverForm.ownVehicle,
          agreeTerms: driverForm.agreeTerms,
          criminalRecordDeclaration: driverForm.criminalRecordDeclaration,
          policeVerificationNumber: driverForm.policeVerificationNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = (data && data.detail) || 'Application failed. Please try again.';
        setDriverSubmitError(typeof detail === 'string' ? detail : 'Application failed. Please try again.');
        return;
      }
      setDriverApplicationResult(data.application);
      try { localStorage.setItem('smartcab_driver_app_ref', data.application.reference); } catch (e) { /* noop */ }
      setDriverAppRef(data.application.reference);
      setFormSubmitted(true);
      setFormStep(1);
    } catch (err) {
      setDriverSubmitError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setDriverSubmitLoading(false);
    }
  };

  const checkDriverApplicationStatus = async () => {
    if (!driverAppRef) return;
    setDriverStatusLoading(true);
    setDriverSubmitError('');
    try {
      const res = await fetch(`${PYTHON_API}/api/drivers/application/${encodeURIComponent(driverAppRef)}`);
      const data = await res.json();
      if (res.ok && data.application) {
        setDriverAppStatus(data.application.status);
      } else {
        setDriverSubmitError('Could not find that application. Check the reference and try again.');
      }
    } catch (err) {
      setDriverSubmitError('Could not reach the server. Please try again later.');
    } finally {
      setDriverStatusLoading(false);
    }
  };

  // 🛡️ UPLOAD A VETTING DOCUMENT (licence / vehicle / police certificate)
  const uploadDriverDocument = async (docType) => {
    const file = driverDocs[docType];
    if (!file || !driverApplicationResult?.id) {
      setDriverDocsMessage('Select a file first.');
      return;
    }
    setDriverDocsBusy(docType);
    setDriverDocsMessage('');
    try {
      const fd = new FormData();
      fd.append(
        docType === 'licence' ? 'licencePhoto' :
        docType === 'vehicle' ? 'vehiclePhoto' : 'policeCertificate',
        file
      );
      const res = await fetch(`${PYTHON_API}/api/drivers/apply/${driverApplicationResult.id}/documents`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = (data && data.detail) || 'Upload failed.';
        setDriverDocsMessage(typeof detail === 'string' ? detail : 'Upload failed (check file type/size).');
        return;
      }
      setDriverDocsStatus((prev) => ({ ...prev, [docType]: 'uploaded' }));
      setDriverDocsMessage('✅ Document uploaded securely. Our team will review it.');
    } catch (err) {
      setDriverDocsMessage('Could not reach the server. Please try again.');
    } finally {
      setDriverDocsBusy(null);
    }
  };

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [showPrices, setShowPrices] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [selectedCar, setSelectedCar] = useState('SmartMini');
  
  const [focusedInput, setFocusedInput] = useState(null);
    // 🎤 VOICE TYPING — speak the place name instead of typing it.
  // Uses the browser's built-in speech recognition (free, no dataset):
  // listens in Gujarati / Hindi / Indian-English depending on the
  // language the rider currently has the site in.
  const [listeningInput, setListeningInput] = useState(null);
  const startVoiceInput = (type) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("🎤 Voice typing needs Chrome or Edge browser. Please type the address instead.");
      return;
    }
    const langMatch = document.cookie.match(/googtrans=\/en\/([a-z]{2,3})/);
    const siteLang = langMatch ? langMatch[1] : 'en';
    const rec = new SR();
    rec.lang = siteLang === 'gu' ? 'gu-IN' : siteLang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListeningInput(type);
    rec.onresult = (e) => {
      const text = (e.results[0][0].transcript || '').trim();
      if (text) {
        if (type === 'pickup') setPickup(text); else setDropoff(text);
      }
    };
    rec.onerror = (e) => {
      console.warn('Voice input error:', e.error);
      if (e.error === 'not-allowed') alert('🎤 Please allow microphone permission to use voice typing.');
    };
    rec.onend = () => setListeningInput(null);
    rec.start();
  };

  const [rideProgress, setRideProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const [mapCenter, setMapCenter] = useState([23.0225, 72.5714]); // Ahmedabad
  const [mapZoom, setMapZoom] = useState(11);

  // 📍 User's live GPS location (lat, lng) — populated when they tap
  // "Use my location" so the map can show their actual position.
  const [userLocation, setUserLocation] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [dashboardBookings, setDashboardBookings] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Guest',
    email: '',
    phone: '',
    address: ''
  });

  // 🔐 Real auth state — talks to backend at /api/auth/signup, /api/auth/login
  // Persists to localStorage so refresh keeps you signed in.
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartcab_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Keep loggedInUser mirrored into localStorage
  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('smartcab_user', JSON.stringify(loggedInUser));
      // Also seed the profile from logged-in user so the dashboard shows the right name
      setUserProfile((prev) => ({
        ...prev,
        name: loggedInUser.name || prev.name,
        email: loggedInUser.email || prev.email,
        phone: loggedInUser.phone || prev.phone,
      }));
    } else {
      localStorage.removeItem('smartcab_user');
    }
  }, [loggedInUser]);

  const handleSignup = async () => {
    setAuthError('');
    if (!signupForm.name || !signupForm.email || !signupForm.phone || !signupForm.password) {
      setAuthError('All fields are required, bestie 💛');
      return;
    }
    if (signupForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || 'Sign up failed. Please try again.');
        return;
      }
      console.log('✅ Signup success:', data);
      setLoggedInUser(data);
      setSignupForm({ name: '', email: '', phone: '', password: '' });
      setMainView('dashboard');
      alert(`Welcome to Smart Security AI Cab, ${data.name}! 🎉`);
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError('Could not reach the server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    if (!loginForm.email || !loginForm.password) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${PYTHON_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || 'Invalid email or password.');
        return;
      }
      console.log('✅ Login success:', data);
      setLoggedInUser(data);
      setLoginForm({ email: '', password: '' });
      setMainView('dashboard');
      alert(`Welcome back, ${data.name}! 💛`);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Could not reach the server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserProfile({ name: 'Guest', email: '', phone: '', address: '' });
    localStorage.removeItem('smartcab_user');
    localStorage.removeItem('smartcab_token');
    setDashboardBookings([]);
    setMainView('ride');
    console.log('👋 Logged out');
  };

  // 🔐 SESSION VALIDATION — on app load, if we think we're logged in but the
  // backend no longer knows this user/token (e.g. the service restarted and
  // reset in-memory data), clear the stale session so the app never crashes.
  useEffect(() => {
    if (!loggedInUser || !loggedInUser.id) return;
    let cancelled = false;
    fetch(`${PYTHON_API}/api/auth/me`, { headers: authHeaders() })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem('smartcab_user');
          localStorage.removeItem('smartcab_token');
          setLoggedInUser(null);
          setUserProfile({ name: 'Guest', email: '', phone: '', address: '' });
          setAuthError("Your session has expired. Please log in again.");
        }
      })
      .catch(() => { /* backend unreachable — keep the session and try later */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mainView === 'dashboard' && dashTab === 'history') {
      if (!loggedInUser) {
        setDashboardBookings([]);
        return;
      }
      fetch(`${PYTHON_API}/api/users/${loggedInUser.id}/trips`, { headers: authHeaders() })
        .then(async (res) => {
          if (res.status === 401) {
            // Session is no longer valid (token expired / user removed after
            // a backend restart). Clear it gracefully instead of crashing.
            localStorage.removeItem('smartcab_user');
            localStorage.removeItem('smartcab_token');
            setLoggedInUser(null);
            setDashboardBookings([]);
            setAuthError('Your session has expired. Please log in again.');
            return;
          }
          const data = await res.json();
          setDashboardBookings(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("Error fetching history:", err));
    }
  }, [mainView, dashTab, loggedInUser]);

  const [showSOSPopup, setShowSOSPopup] = useState(false);
  const [showDeviationPopup, setShowDeviationPopup] = useState(false);
  const [showGPSLostPopup, setShowGPSLostPopup] = useState(false);
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false); 

  // 🛡️ TWO-WAY SAFETY — driver records rider identity verification at pickup
  // and can report a rider concern (e.g. suspicious/illegal items). The
  // report is attached to the trip and an admin can EXONERATE the driver.
  const [riderVerified, setRiderVerified] = useState(false);
  const [riderVerifyBusy, setRiderVerifyBusy] = useState(false);
  const [riderVerifyMessage, setRiderVerifyMessage] = useState('');
  const [showDriverAlertModal, setShowDriverAlertModal] = useState(false);
  const [driverAlertReason, setDriverAlertReason] = useState('');
  const [driverAlertNotes, setDriverAlertNotes] = useState('');
  const [driverAlertBusy, setDriverAlertBusy] = useState(false);
  const [driverAlertResult, setDriverAlertResult] = useState('');
  const [driverAlertError, setDriverAlertError] = useState('');

  const [showLiveGuardModal, setShowLiveGuardModal] = useState(false);
  const [showSilentSOSModal, setShowSilentSOSModal] = useState(false);
  const [liveGuardLink, setLiveGuardLink] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);

  const videoRef = useRef(null);
  const [searchModalType, setSearchModalType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

      // 🚨 EMERGENCY CONTACTS — NEVER hardcoded. The list belongs to the
  // rider: logged-in users load their saved profile contacts from the
  // backend; guests get whatever they saved locally (default: empty).
  const readGuestContacts = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('smartcab_guest_contacts') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  };
  const [emergencyContacts, setEmergencyContacts] = useState(readGuestContacts);
  useEffect(() => {
    if (loggedInUser && loggedInUser.id) {
      fetch(`${PYTHON_API}/api/users/${loggedInUser.id}/emergency-contacts`, { headers: authHeaders() })
        .then(res => (res.ok ? res.json() : []))
        .then(contacts => setEmergencyContacts(Array.isArray(contacts) ? contacts : []))
        .catch(() => { /* keep whatever is currently shown */ });
    } else {
      setEmergencyContacts(readGuestContacts());
    }
  }, [loggedInUser]);

  const persistContactsLocally = (contacts) => {
    try {
      localStorage.setItem('smartcab_guest_contacts', JSON.stringify(contacts));
    } catch (e) { /* storage may be unavailable — non-fatal */ }
  };
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
    // 🎥 NEW VIDEO RECORDING STATES
  const [videoChunks, setVideoChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [shareableLocationLink, setShareableLocationLink] = useState("");

  // 📹 LIVE STREAM state — when active, we record 5-second webm chunks
  // and upload each to the backend so the rider's family can see the
  // cab interior in real time on the TrackRide page.
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamLinkId, setStreamLinkId] = useState(null);
  const streamRecorderRef = useRef(null);
  const streamChunksRef = useRef([]);
  // A MediaRecorder timeslice is not guaranteed to be a standalone WebM
  // file: only its first slice may contain the container header. Keep a
  // separate recorder for each clip instead, so every upload is playable
  // by a receiver who joins the live feed at any point.
  const liveStreamActiveRef = useRef(false);
  const liveStreamTimerRef = useRef(null);

  const locationSuggestions = [
    { title: "Kalupur Railway Station", subtitle: "Kalupur Railway Station Rd, Kapasia Bazar" },
    { title: "Ahmedabad Junction", subtitle: "Sakar Bazzar, Kalupur, Ahmedabad" },
    { title: "Saraspur", subtitle: "Ahmedabad, Gujarat" },
    { title: "D86", subtitle: "Uttamnagar, Thakkarbapanagar, Ahmedabad" },
    { title: "Aai Shri Khodiyar Mata", subtitle: "Nikol Gam Road, Ahmedabad, Gujarat" },
    { title: "Gota", subtitle: "Ahmedabad, Gujarat" },
    { title: "Chandlodia", subtitle: "Ahmedabad, Gujarat" },
    { title: "Delhi Airport", subtitle: "Indira Gandhi International Airport" },
    { title: "Mumbai Central", subtitle: "Mumbai, Maharashtra" }
  ];

  const airportList = [
    { name: "Indira Gandhi International Airport (DEL)", code: "DEL", city: "New Delhi", state: "Delhi", activeCabs: "140+ Smart Security AI Cabs Nearby" },
    { name: "Chhatrapati Shivaji Maharaj International Airport (BOM)", code: "BOM", city: "Mumbai", state: "Maharashtra", activeCabs: "185+ Smart Security AI Cabs Nearby" },
    { name: "Kempegowda International Airport (BLR)", code: "BLR", city: "Bengaluru", state: "Karnataka", activeCabs: "120+ Smart Security AI Cabs Nearby" },
    { name: "Sardar Vallabhbhai Patel International Airport (AMD)", code: "AMD", city: "Ahmedabad", state: "Gujarat", activeCabs: "95+ Smart Security AI Cabs Nearby" }
  ];

  const cityList = [
    { name: "Ahmedabad", state: "Gujarat", activeVehicles: "1,240 Cabs Available", coverage: "100% AI Security Active" },
    { name: "Delhi / NCR", state: "Delhi", activeVehicles: "3,850 Cabs Available", coverage: "100% AI Security Active" },
    { name: "Mumbai", state: "Maharashtra", activeVehicles: "4,120 Cabs Available", coverage: "100% AI Security Active" },
    { name: "Bengaluru", state: "Karnataka", activeVehicles: "2,980 Cabs Available", coverage: "100% AI Security Active" }
  ];

  // 📸 UPGRADED WEBCAM LOGIC: Supports Front/Back Camera Switching!
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: true,
        }).catch(async (err) => {
          // No mic (or mic blocked) — fall back to silent video instead of failing
          console.warn('Mic unavailable — continuing with silent video:', err);
          return navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    };

    if (showLiveGuardModal) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showLiveGuardModal, facingMode]); // Re-runs when facingMode changes!

  const handleSelectLocationFromModal = (locationName) => {
    if (!pickup) {
      setPickup(locationName);
    } else {
      setDropoff(locationName);
    }
    setSearchModalType(null);
    setSearchQuery('');
    setMainView('ride');
    setActiveTab('request');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

 
    const handleAddContact = () => {
    const name = newContactName.trim();
    const phone = newContactPhone.trim();
    if (!name || phone.replace(/\D/g, '').length < 6) {
      alert('Please enter a name and a valid phone number (6+ digits).');
      return;
    }
    // Replace an entry with the same name instead of duplicating it
    const next = [
      ...emergencyContacts.filter(c => c.name.toLowerCase() !== name.toLowerCase()),
      { name, phone },
    ];
    setEmergencyContacts(next);
    persistContactsLocally(next);
    // Save to the rider's profile so it's there on their next session/device
    if (loggedInUser && loggedInUser.id) {
      fetch(`${PYTHON_API}/api/users/${loggedInUser.id}/emergency-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, phone }),
      }).catch(err => console.warn('Could not save contact to profile:', err.message));
    }
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContactModal(false);
  };
  const handleRemoveContact = (phone) => {
    const next = emergencyContacts.filter(c => c.phone !== phone);
    setEmergencyContacts(next);
    persistContactsLocally(next);
    if (loggedInUser && loggedInUser.id) {
      fetch(`${PYTHON_API}/api/users/${loggedInUser.id}/emergency-contacts/${encodeURIComponent(phone)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(err => console.warn('Could not remove contact from profile:', err.message));
    }
  };
    // 🎥 START VIDEO RECORDING
  const startVideoRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      alert("❌ Camera not active. Please enable Live Guard first.");
      return;
    }

    const stream = videoRef.current.srcObject;
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    const chunks = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoURL(url);
      setVideoChunks(chunks);
      uploadVideoEvidence(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecordingVideo(true);
    setRecordingTimer(10);

    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        setIsRecordingVideo(false);
      }
    }, 10000);
  };

  // 📹 LIVE STREAM — records the camera in 5-second chunks and uploads
  // each chunk to the backend so the family member on the TrackRide page
  // can see the cab interior in real time. Same backend endpoint that
  // the TrackRide page polls to display the latest frame.
  const startLiveStream = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      alert("❌ Camera not active. Please allow camera access first.");
      return;
    }
    if (!currentBookingId) {
      alert("❌ No active ride — please book a ride first.");
      return;
    }
    if (isLiveStreaming) return;

    // The stream key MUST match the share-link key, otherwise the
    // TrackRide page polls a different ID and never sees the camera.
    // FIX: reuse the already-shared link ID when one exists (or the
    // previously generated stream ID), instead of minting a new random
    // key every time — that mismatch was breaking live video streaming.
    const linkKey = shareableLocationLink
      ? shareableLocationLink.split('/track/')[1]
      : (streamLinkId || `RIDE_${currentBookingId}_${Date.now().toString(36)}`);
    setStreamLinkId(linkKey);

    const stream = videoRef.current.srcObject;
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported('video/webm')) {
      alert("❌ Your browser doesn't support live video recording.");
      return;
    }

    // Do NOT use recorder.start(5000). Browser timeslices are fragments of
    // one WebM stream, and Chrome commonly omits the EBML header from all
    // but the first fragment. The tracker then receives the newest fragment
    // and stays at 0:00 with a black spinner. A fresh recorder per clip
    // produces a complete, independently decodable WebM file every time.
    const uploadClip = async (blob) => {
      if (!blob || blob.size <= 100) return;
      const fd = new FormData();
      fd.append('file', blob, `chunk_${Date.now()}.webm`);
      if (pickupCoords) { fd.append('lat', String(pickupCoords[0])); }
      if (pickupCoords) { fd.append('lng', String(pickupCoords[1])); }
      try {
        await fetch(`${PYTHON_API}/api/video/stream/${linkKey}/chunk`, {
          method: 'POST', body: fd,
        });
      } catch (err) {
        console.warn("Chunk upload failed:", err);
      }
    };

    liveStreamActiveRef.current = true;
    const recordOneCompleteClip = () => {
      if (!liveStreamActiveRef.current) return;
      let clipRecorder;
      try {
        clipRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch (err) {
        console.warn("Unable to create live video clip:", err);
        liveStreamActiveRef.current = false;
        setIsLiveStreaming(false);
        return;
      }
      const clipParts = [];
      clipRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) clipParts.push(event.data);
      };
      clipRecorder.onstop = () => {
        // onstop fires only after the final dataavailable event, so this
        // Blob contains the WebM header and all frames for this clip.
        void uploadClip(new Blob(clipParts, { type: 'video/webm' }));
        if (liveStreamActiveRef.current) recordOneCompleteClip();
      };
      streamRecorderRef.current = clipRecorder;
      clipRecorder.start();
      liveStreamTimerRef.current = window.setTimeout(() => {
        if (clipRecorder.state === 'recording') clipRecorder.stop();
      }, 5000);
    };

    recordOneCompleteClip();
    setIsLiveStreaming(true);
    console.log("📹 Live stream started for", linkKey);
  };

  const stopLiveStream = () => {
    liveStreamActiveRef.current = false;
    if (liveStreamTimerRef.current) {
      clearTimeout(liveStreamTimerRef.current);
      liveStreamTimerRef.current = null;
    }
    if (streamRecorderRef.current && streamRecorderRef.current.state !== 'inactive') {
      try { streamRecorderRef.current.stop(); } catch (e) { /* ignore */ }
    }
    streamRecorderRef.current = null;
    setIsLiveStreaming(false);
    console.log("📹 Live stream stopped");
  };

  // Auto-stop live stream when the modal closes or the camera turns off
  useEffect(() => {
    if (!showLiveGuardModal && isLiveStreaming) {
      stopLiveStream();
    }
  }, [showLiveGuardModal]);

  // 🎥 UPLOAD VIDEO
  const uploadVideoEvidence = async (videoBlob) => {
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `evidence_${currentBookingId}_${Date.now()}.webm`);
      formData.append('bookingId', currentBookingId);
      formData.append('timestamp', new Date().toISOString());
      formData.append('location', JSON.stringify({
        lat: pickupCoords ? pickupCoords[0] : 0,
        lng: pickupCoords ? pickupCoords[1] : 0
      }));

      const response = await fetch(`${PYTHON_API}/api/evidence/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Video Evidence Uploaded:", result);
        alert(`✅ Video Evidence Saved!\nEvidence ID: ${result.evidenceId || 'LOCAL'}`);
      }
    } catch (error) {
      console.error("❌ Video upload failed:", error);
      downloadVideoLocally(videoBlob);
    }
  };
    // 🎥 DOWNLOAD VIDEO LOCALLY
  const downloadVideoLocally = (videoBlob) => {
    // Force save as MP4 so Android/iPhone can open it directly!
    const mp4Blob = new Blob([videoBlob], { type: 'video/mp4' });
    const url = URL.createObjectURL(mp4Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart Security AI Cab_Evidence_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("✅ Video downloaded as MP4! You can now open it directly in your phone gallery!");
  };

  // 🎥 GENERATE SHAREABLE LINK
 const generateShareableLink = (isRetry = false) => {
  // If no booking ID yet, generate a fresh one so the rider can still
  // share a tracking link right after booking (the link ID just won't
  // be linked to a stored trip record, but the share link itself works).
  if (!pickupCoords || !dropoffCoords) {
    alert("❌ Please book a ride first so we can capture the pickup and dropoff locations.");
    return;
  }
  const bookingId = currentBookingId || Math.floor(Date.now() / 1000);

    // Keep the SAME linkId across a retry — otherwise a retry would create
    // a second, different link instead of actually fixing the first one.
    // Also reuse the live-stream key if the camera stream started first,
    // so the video chunks and the shared link always share ONE ID.
    const linkId = shareableLocationLink
      ? shareableLocationLink.split('/track/')[1]
      : (streamLinkId || `RIDE_${bookingId}_${Date.now().toString(36)}`);
    setStreamLinkId(linkId);

  // Use the rider's own origin so the link works on Vercel AND in local
  // dev / previews (a hardcoded Vercel URL broke testing locally).
  const FRONTEND_URL = window.location.origin;
  const shareLink = `${FRONTEND_URL}/track/${linkId}`;

  fetch(`${PYTHON_API}/api/location/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: currentBookingId,
      linkId: linkId,
      driverName: assignedDriver.name,
      driverLicense: assignedDriver.dl,
      carPlate: assignedDriver.plate,
      pickup: pickup,
      dropoff: dropoff,
      currentLocation: { lat: pickupCoords[0], lng: pickupCoords[1] },
      riderName: loggedInUser ? loggedInUser.name : userProfile.name,
      userId: loggedInUser ? loggedInUser.id : null,
      emergencyContacts: emergencyContacts,
      createdAt: new Date().toISOString()
    })
  })
  .then(res => {
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log("✅ Shareable link created successfully:", data);
    setShareableLocationLink(shareLink);
    try { navigator.clipboard.writeText(shareLink); } catch (e) { /* clipboard may be blocked */ }
  })
  .catch(err => {
    console.error("Link creation failed:", err);
    if (!isRetry) {
      // The backend may have just been asleep (Render free tier cold
      // start). Wait 4s for it to fully wake up, then try ONE more time
      // before telling the rider anything is wrong.
      console.log("Retrying in 4s — backend may have been waking up...");
      setTimeout(() => generateShareableLink(true), 4000);
      return;
    }
    // Both attempts failed — be honest about it instead of pretending
    // the link works. A rider needs to know NOT to trust this link.
    alert(
      "⚠️ Couldn't create your live tracking link — the security server " +
      "didn't respond. Please check your internet connection and tap " +
      "'Share Live Location' again. Do not send this link to family until " +
      "you see a confirmation that it was created."
    );
  });
};

  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.setAttribute('src', 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
      document.body.appendChild(addScript);
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
      };
    }
  }, []);

  const handleLanguageChange = (langCode) => {
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname};`;
    }
    setIsLangModalOpen(false);
    window.location.reload(); 
  };

  useEffect(() => {
    if (rideConfirmed && rideProgress < 100 && !showDeviationPopup && !showGPSLostPopup) {
      const timer = setInterval(() => {
        setRideProgress((prev) => {
          const next = prev + 1;
          return next > 100 ? 100 : next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rideConfirmed, rideProgress, showDeviationPopup, showGPSLostPopup]);

  // 📍 Push live GPS updates to the backend every 5s so the family's
  // tracking link shows the car actually moving along the route, not
  // frozen at the pickup point. Previously nothing ever called the
  // /ping endpoint, so the map on the shared link never updated.
  //
  // Uses a ref so the interval (created once) always reads the LATEST
  // ride state without needing to be torn down and recreated every
  // second — recreating it every render was the bug that would have
  // made this never actually fire on a 5s cadence.
  const pingStateRef = useRef({});
  useEffect(() => {
    pingStateRef.current = {
      rideProgress, pickupCoords, dropoffCoords, pickup, dropoff,
      assignedDriver, loggedInUser, userProfile, emergencyContacts,
    };
  });

  useEffect(() => {
    if (!rideConfirmed || !shareableLocationLink) return;
    const linkId = shareableLocationLink.split('/track/')[1];
    if (!linkId) return;

    const sendPing = () => {
      const {
        rideProgress, pickupCoords, dropoffCoords, pickup, dropoff,
        assignedDriver, loggedInUser, userProfile, emergencyContacts,
      } = pingStateRef.current;
      if (!pickupCoords || !dropoffCoords) return;

      const lat = pickupCoords[0] + (dropoffCoords[0] - pickupCoords[0]) * (rideProgress / 100);
      const lng = pickupCoords[1] + (dropoffCoords[1] - pickupCoords[1]) * (rideProgress / 100);

      fetch(`${PYTHON_API}/api/location/track/${linkId}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat, lng,
          status: rideProgress >= 100 ? 'ARRIVED' : 'ON_ROUTE',
          pickupName: pickup,
          dropoffName: dropoff,
          riderName: loggedInUser ? loggedInUser.name : userProfile.name,
          driverName: assignedDriver ? assignedDriver.name : undefined,
          carPlate: assignedDriver ? assignedDriver.plate : undefined,
                    // Family page stays in sync if the rider adds/removes contacts mid-ride
          emergencyContacts: emergencyContacts,
        })
      }).catch((err) => {
        // A single missed ping isn't worth alarming the rider over — the
        // next one fires in 5s regardless. Just log it for debugging.
        console.warn('Location ping failed (will retry in 5s):', err.message);
      });
    };

    sendPing(); // send one immediately instead of waiting 5s for the first update
    const pingInterval = setInterval(sendPing, 5000);
    return () => clearInterval(pingInterval);
  }, [rideConfirmed, shareableLocationLink]);
    // 🎥 Recording Timer
  useEffect(() => {
    if (isRecordingVideo && recordingTimer > 0) {
      const timer = setTimeout(() => {
        setRecordingTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRecordingVideo, recordingTimer]);

  // 💰 Compute the displayed fare for a car type from the actual
  // Haversine distance (km) between two [lat, lng] points.
  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLng = (b[1] - a[1]) * Math.PI / 180;
    const x = Math.sin(dLat/2) ** 2 +
               Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) *
               Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  // Wall-clock hour in India. Surge bands follow IST (like the backend's
  // _calc_surge), even if the rider's device clock is in another timezone.
  const getIstHour = () => {
    try {
      return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }), 10);
    } catch (e) {
      return new Date().getHours();
    }
  };

  // Same surge bands as the backend pricing engine.
  const currentSurge = () => {
    const h = getIstHour();
    if ((h >= 7 && h < 10) || (h >= 17 && h < 21)) {
      return { surge: 1.5, reason: h < 12 ? 'Morning peak (7-10am)' : 'Evening peak (5-9pm)' };
    }
    if (h >= 22 || h < 6) return { surge: 1.2, reason: 'Late-night safety premium (10pm-6am)' };
    return { surge: 1.0, reason: 'Off-peak: standard rates' };
  };

  // Per-car pricing — MUST mirror the backend PRICING_TABLE in main.py.
  const CAR_PRICING = {
    SmartBike:  { base: 20, perKm: 6 },
    SmartMini:  { base: 40, perKm: 10 },
    SmartSedan: { base: 50, perKm: 14 },
    SmartSUV:   { base: 80, perKm: 20 },
  };

  // Local replica of the backend's _estimate_fare — used ONLY when the
  // backend's /api/pricing/estimate is unreachable, so the rider still sees
  // the correct per-car, surge-aware price.
  const localFareEstimate = (distKm, carType) => {
    const cfg = CAR_PRICING[carType] || CAR_PRICING.SmartMini;
    const { surge, reason } = currentSurge();
    const baseFare = cfg.base;
    const distanceFare = Math.round(distKm * cfg.perKm * 100) / 100;
    return {
      baseFare,
      distanceFare,
      surgeMultiplier: surge,
      surgeReason: reason,
      totalFare: Math.round(Math.max(baseFare, baseFare + distanceFare) * surge * 100) / 100,
      bookingTime: new Date().toISOString(),
    };
  };

  // Haversine distance between pickup and dropoff for the price cards.
  // NOW surge-aware (peak 1.5x, late-night 1.2x) so the card price matches
  // the price that is actually charged at booking time.
  const displayFare = (base, perKm) => {
    let distKm = 0;
    if (pickupCoords && dropoffCoords) {
      distKm = haversineKm(pickupCoords, dropoffCoords);
    }
    const { surge } = currentSurge();
    return Math.round((base + distKm * perKm) * surge);
  };

  // 🗺️ CITY-SCOPED GEOCODING
  // The old version searched Nominatim for "<address>, India" with limit=1
  // and NO geographic constraint — so "Saraspur" (a locality in Ahmedabad)
  // could match a same-named place hundreds of km away. If the map API was
  // unreachable it was even worse: the "backup plan" dropped the pin at a
  // RANDOM point in central India (20.59, 78.96). A Ranip → Saraspur ride
  // (9.7 km, ~₹165) once rendered as 718.8 km / ₹7,228 because of this.
  //
  // Now: every search is biased + bounded to the detected city, and results
  // are distance-validated against the city centre. On failure we return
  // null so the rider gets a clear "couldn't find that place" message —
  // the app NEVER invents a random location again.
  const CITY_GEO = {
    // viewbox for Nominatim: left(minLon), top(maxLat), right(maxLon), bottom(minLat)
    ahmedabad: { name: 'Ahmedabad', center: [23.0225, 72.5714], viewbox: '72.30,23.40,72.90,22.65' },
    mumbai:    { name: 'Mumbai',    center: [19.0760, 72.8777], viewbox: '72.70,19.35,73.05,18.85' },
    delhi:     { name: 'Delhi',     center: [28.7041, 77.1025], viewbox: '76.80,28.90,77.40,28.35' },
    bangalore: { name: 'Bengaluru', center: [12.9716, 77.5946], viewbox: '77.35,13.20,77.85,12.75' },
    pune:      { name: 'Pune',      center: [18.5204, 73.8567], viewbox: '73.60,18.75,74.10,18.30' },
    chennai:   { name: 'Chennai',   center: [13.0827, 80.2707], viewbox: '80.00,13.30,80.45,12.80' },
    kolkata:   { name: 'Kolkata',   center: [22.5726, 88.3639], viewbox: '88.15,22.80,88.60,22.35' },
    hyderabad: { name: 'Hyderabad', center: [17.3850, 78.4867], viewbox: '78.20,17.65,78.75,17.15' },
    surat:     { name: 'Surat',     center: [21.1702, 72.8311], viewbox: '72.60,21.40,73.05,20.95' },
    jaipur:    { name: 'Jaipur',    center: [26.9124, 75.7873], viewbox: '75.55,27.10,76.05,26.65' }, // fixed: was previously pointing at Chhattisgarh!
        rajkot:      { name: 'Rajkot',      center: [22.3039, 70.8022], viewbox: '70.60,22.50,71.05,22.10' },
    vadodara:    { name: 'Vadodara',    center: [22.3072, 73.1812], viewbox: '73.00,22.50,73.35,22.10' },
    gandhinagar: { name: 'Gandhinagar', center: [23.2156, 72.6369], viewbox: '72.45,23.40,72.80,23.05' },
    bhavnagar:   { name: 'Bhavnagar',   center: [21.7645, 72.1519], viewbox: '71.95,21.95,72.35,21.60' },
    jamnagar:    { name: 'Jamnagar',    center: [22.4707, 70.0577], viewbox: '69.85,22.65,70.30,22.30' },
    udaipur:     { name: 'Udaipur',     center: [24.5854, 73.7125], viewbox: '73.50,24.80,73.95,24.40' },
  };

  // 📖 OFFLINE AHMEDABAD GAZETTEER — last resort when the map API is
  // unreachable (ad-blockers / flaky networks were exactly what triggered
  // the old random-central-India fallback). Coordinates are approximate
  // locality centres — good enough for a demo ride estimate, and the
  // city-scoped Nominatim search above remains the primary source.
  const AHMEDABAD_GAZETTEER = [
    ['new ranip', [23.0906, 72.5702]], ['ranip', [23.0862, 72.5715]],
    ['chandlodia', [23.0728, 72.5459]], ['chandlodiya', [23.0728, 72.5459]],
    ['gota', [23.0722, 72.5409]],
    ['saraspur', [23.0252, 72.5990]],
    ['kalupur railway station', [23.0253, 72.6012]], ['kalupur', [23.0280, 72.5997]],
    ['ahmedabad junction', [23.0253, 72.6012]],
    ['sabarmati', [23.0701, 72.5908]], ['ashram road', [23.0325, 72.5710]],
    ['navrangpura', [23.0317, 72.5628]], ['naranpura', [23.0552, 72.5670]],
    ['maninagar', [22.9997, 72.6010]], ['bopal', [22.9928, 72.4680]],
    ['satellite', [23.0155, 72.5270]], ['vastrapur', [23.0366, 72.5270]],
    ['paldi', [23.0101, 72.5685]], ['ellis bridge', [23.0225, 72.5650]],
    ['thaltej', [23.0502, 72.5143]], ['motera', [23.0914, 72.5974]],
    ['narendra modi stadium', [23.0914, 72.5974]],
    ['shahibaug', [23.0547, 72.5959]], ['naroda', [23.0730, 72.6530]],
    ['vastral', [22.9600, 72.6620]], ['sarkhej', [22.9868, 72.5050]],
    ['sg highway', [23.0265, 72.5084]], ['sola', [23.0730, 72.5162]],
    ['nirma university', [23.0301, 72.5177]],
    ['airport', [23.0772, 72.6347]],
  ];

  const gazetteerLookup = (addrLower) => {
    // Longest-name first so "New Ranip" wins over "Ranip", and
    // "Kalupur Railway Station" over "Kalupur".
    const sorted = [...AHMEDABAD_GAZETTEER].sort((a, b) => b[0].length - a[0].length);
    const hit = sorted.find(([name]) => addrLower.includes(name));
    return hit ? hit[1] : null;
  };

  const detectCityKey = (addrLower) => {
    if (addrLower.includes('mumbai')) return 'mumbai';
    if (addrLower.includes('delhi')) return 'delhi';
    if (addrLower.includes('bangalore') || addrLower.includes('bengaluru')) return 'bangalore';
    if (addrLower.includes('pune')) return 'pune';
    if (addrLower.includes('chennai')) return 'chennai';
    if (addrLower.includes('kolkata')) return 'kolkata';
    if (addrLower.includes('hyderabad')) return 'hyderabad';
    if (addrLower.includes('jaipur')) return 'jaipur';
    if (addrLower.includes('surat') && !addrLower.includes('ahmedabad')) return 'surat';
    if (addrLower.includes('rajkot')) return 'rajkot';
    if (addrLower.includes('vadodara') || addrLower.includes('baroda')) return 'vadodara';
    if (addrLower.includes('gandhinagar') && !addrLower.includes('ahmedabad')) return 'gandhinagar';
    if (addrLower.includes('bhavnagar')) return 'bhavnagar';
    if (addrLower.includes('jamnagar')) return 'jamnagar';
    if (addrLower.includes('udaipur')) return 'udaipur';
    return 'ahmedabad'; // Smart Security AI Cab's home city — the safe default
  };

  const geocodeLocation = async (address) => {
    const lowerAddress = address.toLowerCase();
    const cityKey = detectCityKey(lowerAddress);
    const city = CITY_GEO[cityKey];

    // Sanity check: a valid result must be within ~100 km of the city.
    // Anything farther away means the geocoder resolved the wrong
    // same-named place — reject it rather than drawing a wrong route.
    const withinCity = (coords) => haversineKm(coords, city.center) <= 100;

    const mentionsCity = lowerAddress.includes(cityKey) ||
      (cityKey === 'bangalore' && lowerAddress.includes('bengaluru'));
    const namedQuery = mentionsCity ? address : `${address}, ${city.name}`;

    // Pass 1: bounded to the city viewbox (precise for local areas).
    // Pass 2: unbounded but city-qualified, still distance-validated.
    const attempts = [
      { q: `${namedQuery}, India`, viewbox: `&viewbox=${city.viewbox}&bounded=1` },
      { q: `${address}, ${city.name}, India`, viewbox: '' },
    ];
    for (const attempt of attempts) {
      try {
        const searchQuery = encodeURIComponent(attempt.q);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=4&countrycodes=in${attempt.viewbox}`
        );
        const data = await response.json();
        const hit = (data || [])
          .map(r => [parseFloat(r.lat), parseFloat(r.lon)])
          .find(withinCity);
        if (hit) return hit;
      } catch (error) {
        console.warn("Map API blocked the request, trying backup coordinates...");
      }
    }

    // 🛡️ THE BACKUP PLAN — map API unreachable or no valid hit:
    // a) if it's a known Ahmedabad locality, use the offline gazetteer
    if (cityKey === 'ahmedabad') {
      const gazHit = gazetteerLookup(lowerAddress);
      if (gazHit) return gazHit;
    }
    // b) only addresses that explicitly name a known city fall back to a
    //    city CENTRE. NEVER a random point in the middle of India.
    if (mentionsCity) return city.center;
    if (lowerAddress.includes('ahmedabad')) return CITY_GEO.ahmedabad.center;

    return null; // caller shows the friendly "couldn't find it" message
  };

  // How far apart the two resolved points currently are (null if unknown).
  const resolvedDistanceKm = (pickupCoords && dropoffCoords)
    ? haversineKm(pickupCoords, dropoffCoords)
    : null;

  // A trip is "suspicious" when both fields look like LOCAL addresses (no
  // other city named — outstation is allowed) but the map says >150 km.
  // That's the signature of a same-name geocoding mix-up; never let it
  // turn into a booking with a ₹7000 fare.
  const isSuspiciousLocalTrip = (distKm, pickupText, dropoffText) => {
    if (distKm == null || distKm <= 150) return false;
    const outstationHint = /(mumbai|delhi|bangalore|bengaluru|pune|chennai|kolkata|hyderabad|surat|jaipur|vadodara|baroda|rajkot|udaipur|outstation)/i;
    return !outstationHint.test(`${pickupText} ${dropoffText}`);
  };

  // 📍 USE MY LOCATION — asks the browser for the rider's real GPS
  // coordinates, fills the pickup field, and centers the map.
  // This is what gives the customer the accurate ~3 km price for a
  // short trip instead of the 15.5 km fallback.
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support GPS. Type the pickup address instead.");
      return;
    }
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setLocatingMe(false);
        // Reverse-geocode to fill the pickup field with a real address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
          const data = await res.json();
          if (data && data.display_name) {
            const short = data.display_name.split(', ').slice(0, 3).join(', ');
            setPickup(short);
          } else {
            setPickup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (e) {
          setPickup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      (err) => {
        setLocatingMe(false);
        alert("Couldn't get your location. Please type the pickup address instead, or allow location permission in your browser.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleMapClick = async (latlng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        const shortAddress = data.display_name.split(', ').slice(0, 2).join(', ');
        if (focusedInput === 'dropoff' || (pickup && !dropoff)) {
          setDropoff(shortAddress);
        } else {
          setPickup(shortAddress);
        }
      }
    } catch (error) {
      console.error("Could not fetch address from map click");
    }
  };

  const triggerBackendSOS = async () => {
    if (!currentBookingId) {
      console.warn("No booking ID yet — book a ride first so the backend has a row to update");
      return;
    }
    try {
      const res = await fetch(`${PYTHON_API}/api/bookings/${currentBookingId}/sos`, {
        method: "PUT"
      });
      if (res.ok) {
        const updated = await res.json();
        console.log("✅ SOS updated to DANGER:", updated);
      }
    } catch (err) {
      console.error("Backend SOS failed:", err);
    }
  };

  // 🛡️ DRIVER verifies the rider's identity at pickup — recorded on the trip
  // as proof, so the driver cannot be blamed if a rider behaves badly.
  const verifyRiderIdentity = async () => {
    if (!currentBookingId) {
      setRiderVerifyMessage('Ride not saved yet — try again in a moment.');
      return;
    }
    setRiderVerifyBusy(true);
    setRiderVerifyMessage('');
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/${currentBookingId}/rider-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ verified: true, method: 'In-person ID check at pickup' }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = (data && data.detail) || 'Verification failed.';
        setRiderVerifyMessage(typeof detail === 'string' ? detail : 'Verification failed.');
        return;
      }
      setRiderVerified(true);
      setRiderVerifyMessage('✅ Rider identity verified — recorded on this trip.');
    } catch (err) {
      setRiderVerifyMessage('Could not reach the server. Please try again.');
    } finally {
      setRiderVerifyBusy(false);
    }
  };

  // 🛡️ DRIVER reports a rider concern (e.g. suspicious / illegal items) —
  // tied to the ride so an admin can review and EXONERATE the driver.
  const submitDriverAlert = async () => {
    if (!driverAlertReason.trim()) {
      setDriverAlertError('Please select or describe your concern.');
      return;
    }
    if (!currentBookingId) {
      setDriverAlertError('Ride not saved yet — try again in a moment.');
      return;
    }
    setDriverAlertBusy(true);
    setDriverAlertError('');
    setDriverAlertResult('');
    try {
      const res = await fetch(`${PYTHON_API}/api/trips/${currentBookingId}/driver-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          reason: driverAlertReason.trim(),
          notes: driverAlertNotes.trim(),
          riderName: loggedInUser ? loggedInUser.name : 'Guest Rider',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = (data && data.detail) || 'Report failed.';
        setDriverAlertError(typeof detail === 'string' ? detail : 'Report failed.');
        return;
      }
      setDriverAlertResult(
        `✅ Concern reported as ${data.alert?.reference || 'ALERT'}. Support has been notified — ` +
        'if you were not at fault, an admin will review and mark you EXONERATED.'
      );
    } catch (err) {
      setDriverAlertError('Could not reach the server. Please try again.');
    } finally {
      setDriverAlertBusy(false);
    }
  };

  // 🔍 SEARCH PRICES — geocode BOTH points up front so the ride cards
  // show the REAL distance-based fare (not just base rates), and so a
  // same-name geocoding mix-up (e.g. the wrong "Saraspur") is caught
  // BEFORE the rider ever sees a price.
  const handleSearchPrices = async () => {
    setShowPrices(true);
    setPricingLoading(true);
    const [p, d] = await Promise.all([geocodeLocation(pickup), geocodeLocation(dropoff)]);
    setPricingLoading(false);
    if (p && d) {
      const distKm = haversineKm(p, d);
      if (isSuspiciousLocalTrip(distKm, pickup, dropoff)) {
        alert(
          `\u26a0\ufe0f These places look like a LOCAL ride, but the map found them ${distKm.toFixed(0)} km apart.\n\n` +
          `Please re-enter the addresses with the area + city (e.g. "Saraspur, Ahmedabad") so prices are correct.`
        );
        setPickupCoords(null);
        setDropoffCoords(null);
        setShowPrices(false);
        setActiveTab('request');
        return;
      }
      setPickupCoords(p);
      setDropoffCoords(d);
      setMapCenter(p);
      setMapZoom(12);
    } else {
      // One address did not resolve — cards fall back to base rates and
      // booking will show the "couldn't find it" message if retried.
      setPickupCoords(null);
      setDropoffCoords(null);
    }
  };

  const handleConfirmRide = async () => {
    setIsSearching(true);
    const pCoords = await geocodeLocation(pickup);
    const dCoords = await geocodeLocation(dropoff);
    setIsSearching(false);

    if (pCoords && dCoords) {
      // 🚗 Assign a RANDOM dynamic driver every time!
      const randomDriver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
      setAssignedDriver(randomDriver);

      try {
        const response = await fetch(`${PYTHON_API}/api/ai/check-route?driver_id=${randomDriver.name.replace(' ', '_')}&current_lat=${pCoords[0]}&current_lng=${pCoords[1]}`);
        const aiData = await response.json();
        console.log("Python AI Check:", aiData);
      } catch (error) {
        console.error("Could not reach Python AI server");
      }

      // Real distance between the two geocoded points
      const distKm = haversineKm(pCoords, dCoords);

      // 🛡️ SANITY GUARD — if two apparently-local addresses resolved to
      // points >150 km apart, the geocoder almost certainly picked the
      // wrong same-named place. Stop before creating a bogus booking
      // (this exact mistake once produced a 718.8 km / ₹7,228 "ride").
      if (isSuspiciousLocalTrip(distKm, pickup, dropoff)) {
        alert(
          `⚠️ These places look like a LOCAL ride, but the map found them ${distKm.toFixed(0)} km apart.\n\n` +
          `Please re-enter the addresses with the area + city (e.g. "Saraspur, Ahmedabad") so the route is correct. No booking was made.`
        );
        return;
      }

      // 💰 FARE — ask the backend pricing engine (the same rates and IST
      // surge the dashboard stores), with a local replica as fallback, so
      // the price on screen ALWAYS matches the saved trip record.
      let estimate;
      try {
        const estRes = await fetch(`${PYTHON_API}/api/pricing/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distanceKm: parseFloat(distKm.toFixed(2)),
            selectedCar,
            bookingTime: new Date().toISOString(),
          }),
        });
        if (!estRes.ok) throw new Error(`estimate failed: ${estRes.status}`);
        estimate = await estRes.json();
      } catch (e) {
        console.warn('Backend pricing unavailable, using local estimate:', e);
        estimate = localFareEstimate(distKm, selectedCar);
      }
      const totalFare = estimate.totalFare;

      try {
        const bookingData = {
          userId: loggedInUser ? loggedInUser.id : null,
          riderName: loggedInUser ? loggedInUser.name : "Guest Rider",
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          distanceKm: parseFloat(distKm.toFixed(2)),
          fare: totalFare,
          baseFare: estimate.baseFare,
          distanceFare: estimate.distanceFare,
          surgeMultiplier: estimate.surgeMultiplier,
          bookingTime: estimate.bookingTime,
          selectedCar,
          status: "PENDING"
        };

        // ALWAYS set a local booking ID first, so "Share Live Location"
        // works even if the backend is down. The backend will sync the
        // trip record in the background.
        const localId = Math.floor(Date.now() / 1000);
        setCurrentBookingId(localId);

        const tripResponse = await fetch(`${PYTHON_API}/api/trips`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify(bookingData)
        });

        let savedBooking = null;
        if (tripResponse.ok) {
          savedBooking = await tripResponse.json();
          // If the backend returned a real ID, use it instead
          if (savedBooking && savedBooking.id) {
            setCurrentBookingId(savedBooking.id);
            console.log("✅ Booking saved to Smart Security AI Cab Python backend:", savedBooking);
          }
        }
        // 🏷️ Remember this ride (Ride ID, driver, route, coords) so the
        // Safety Center + My Rides can show it without another booking.
        try {
          localStorage.setItem('smartcab_last_ride', JSON.stringify({
            bookingId: savedBooking?.id || localId,
            rideCode: savedBooking?.rideCode || null,
            riderName: bookingData.riderName,
            driver: {
              name: randomDriver.name,
              plate: randomDriver.plate,
              carModel: randomDriver.carModel,
              rating: randomDriver.rating,
            },
            pickup,
            dropoff,
            pickupLat: pCoords[0], pickupLng: pCoords[1],
            dropoffLat: dCoords[0], dropoffLng: dCoords[1],
            lat: pCoords[0], lng: pCoords[1],
          }));
        } catch (e) { /* storage may be unavailable */ }
        const surgeNote = estimate.surgeMultiplier > 1
          ? ` (${estimate.surgeMultiplier}x — ${estimate.surgeReason || 'surge pricing'})`
          : '';
        const rideIdLine = savedBooking?.rideCode ? `\n🏷️ Ride ID: ${savedBooking.rideCode}\n` : '';
        alert(`🎉 ${selectedCar} Booked Successfully!${rideIdLine}\n📍 ${pickup} → ${dropoff}\n📏 ${distKm.toFixed(1)} km\n🚗 Driver ${randomDriver.name}\n💰 Fare: ₹${totalFare}${surgeNote}\n\nTap 'Live Guard' to share your ride with family!`);

      } catch (error) {
        console.warn("Could not reach Smart Security AI Cab Python backend:", error);
        // setCurrentBookingId is already set above (localId), so Share
        // Live Location will still work. The link will use the local
        // ID as a fallback if the backend doesn't have it.
        try {
          localStorage.setItem('smartcab_last_ride', JSON.stringify({
            bookingId: localId,
            rideCode: null,
            riderName: bookingData.riderName,
            driver: { name: randomDriver.name, plate: randomDriver.plate, carModel: randomDriver.carModel, rating: randomDriver.rating },
            pickup, dropoff,
            pickupLat: pCoords[0], pickupLng: pCoords[1],
            dropoffLat: dCoords[0], dropoffLng: dCoords[1],
            lat: pCoords[0], lng: pCoords[1],
          }));
        } catch (e) { /* storage may be unavailable */ }
        alert(`🎉 ${selectedCar} Booked!\n\n📍 ${pickup} → ${dropoff}\n📏 ${distKm.toFixed(1)} km\n🚗 Driver ${randomDriver.name}\n💰 Fare: ₹${totalFare}\n\n(Booking saved locally — backend sync will retry)`);
      }

      setPickupCoords(pCoords);
      setDropoffCoords(dCoords);
      setMapCenter(pCoords); 
      setMapZoom(12); 
      setRideConfirmed(true);
    } else {
      alert("We couldn't find one of those locations on the map. Try adding the city or state name.");
    }
  };
    
  let currentCarLat = 0, currentCarLng = 0;
  if (pickupCoords && dropoffCoords) {
    currentCarLat = pickupCoords[0] + (dropoffCoords[0] - pickupCoords[0]) * (rideProgress / 100);
    currentCarLng = pickupCoords[1] + (dropoffCoords[1] - pickupCoords[1]) * (rideProgress / 100);
  }

  const handleExploreClick = () => {
    setActiveTab('explore');
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeatureCardClick = (feature) => {
    setActiveTab(feature);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFeatureDetails = (feature) => {
    if (feature === 'intercity') {
      setSelectedCard({
        title: 'Intercity Travel',
        subtitle: 'Safe outstation rides between cities',
        description: 'Book comfortable long-distance cabs for city-to-city travel with verified drivers, live GPS monitoring, SOS support, and route-deviation alerts.',
        benefits: [
          'Verified outstation drivers',
          'Live GPS route tracking',
          'Route-deviation safety alerts',
          'Comfortable cars for long trips',
          'Transparent fare estimate',
          'Emergency SOS support'
        ]
      });
    }
    if (feature === 'bike') {
      setSelectedCard({
        title: 'SmartBike',
        subtitle: 'Fast and affordable bike rides',
        description: 'Beat city traffic with quick SmartBike rides. Smart Security AI Cab adds safety checks, helmet verification, live tracking, and SOS support for a safer two-wheeler experience.',
        benefits: [
          'Quick rides through traffic',
          'Affordable short-distance travel',
          'Helmet safety verification',
          'Live GPS tracking',
          'Verified bike drivers',
          'SOS and emergency support'
        ]
      });
    }
  };

  const closeAllForms = () => {
    setShowDriverForm(false);
    setShowBusinessForm(false);
    setFormStep(1);
    setFormSubmitted(false);
  };

    const resetRide = () => {
    setShowPrices(false);
    setRideConfirmed(false);
    setRideProgress(0);
    setPickup('');
    setDropoff('');
    setPickupCoords(null);
    setDropoffCoords(null);
    setCurrentBookingId(null);
    setMapCenter([20.5937, 78.9629]); 
    setMapZoom(5);
    setShowSOSPopup(false);
    setShowDeviationPopup(false);
    setShowGPSLostPopup(false);
    setShowLiveGuardModal(false);
    setShowSilentSOSModal(false);
    setRecordedVideoURL(null);           // NEW LINE
    setShareableLocationLink("");        // NEW LINE
  };

  const renderLocationInput = (type, placeholder, value, setValue) => {
    const isPickup = type === 'pickup';
    return (
      <div className={`relative ${isPickup ? 'z-20' : 'z-10'} flex items-center bg-gray-100 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-black`}>
        {isPickup ? (
          <div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div>
        ) : (
          <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocusedInput(type)}
          onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
          className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium"
        />
                <button
          type="button"
          onClick={() => startVoiceInput(type)}
          className={`ml-2 p-2 rounded-full transition ${listeningInput === type ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-black hover:bg-gray-200'}`}
          title="Speak the place name"
        >
          <Mic className="h-5 w-5" />
        </button>
        {focusedInput === type && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-[100] max-h-72 overflow-y-auto border border-gray-100 animate-in fade-in duration-200">
            {locationSuggestions.filter(s => s.title.toLowerCase().includes(value.toLowerCase()) || value === '').map((loc, idx) => (
              <div 
                key={idx} 
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(loc.title); 
                  setFocusedInput(null);
                }} 
                className="flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 text-left transition-colors"
              >
                <div className="bg-gray-100 p-2.5 rounded-full mr-4 shrink-0">
                  <MapPin className="h-5 w-5 text-gray-700" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-gray-900 truncate text-base">{loc.title}</div>
                  <div className="text-sm text-gray-500 truncate">{loc.subtitle}</div>
                </div>
              </div>
            ))}
            <div 
              onMouseDown={(e) => { e.preventDefault(); setFocusedInput(null); }}
              className="flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer text-black font-medium border-t border-gray-100 transition-colors"
            >
              <div className="bg-gray-100 p-2.5 rounded-full mr-4 shrink-0">
                <Map className="h-5 w-5 text-black" />
              </div>
              Click the map to set location
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative overflow-x-hidden">
      <style>{`
        body { top: 0 !important; position: static !important; }
        .skiptranslate { display: none !important; }
        .goog-te-banner-frame { display: none !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* ---- SELECTED CARD MODAL ---- */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[350] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6 bg-black text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{selectedCard.title}</h3>
                {selectedCard.subtitle && <p className="text-sm text-gray-300 mt-1">{selectedCard.subtitle}</p>}
              </div>
              <button onClick={() => setSelectedCard(null)} className="p-2 hover:bg-gray-800 rounded-full transition">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 leading-relaxed">{selectedCard.description}</p>
              {selectedCard.benefits && (
                <ul className="space-y-3 mb-6">
                  {selectedCard.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-gray-800 font-medium">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => setSelectedCard(null)}
                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✈️ / 🏙️ AIRPORT & CITY SEARCH MODAL */}
      {searchModalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[350] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
            <div className="p-6 bg-black text-white flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                {searchModalType === 'airports' 
                  ? <Plane className="h-7 w-7 text-green-400" /> 
                  : <Globe className="h-7 w-7 text-blue-400" />
                }
                <div>
                  <h3 className="text-2xl font-bold">
                    {searchModalType === 'airports' ? '700+ Airports Supported' : '15,000+ Cities Active'}
                  </h3>
                  <p className="text-xs text-gray-300">Select any location across India to pre-fill your trip</p>
                </div>
              </div>
              <button 
                onClick={() => { setSearchModalType(null); setSearchQuery(''); }} 
                className="p-2 hover:bg-gray-800 rounded-full transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0">
              <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-inner focus-within:ring-2 ring-black">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <input 
                  type="text" 
                  placeholder={
                    searchModalType === 'airports' 
                      ? "Search airport name, code (DEL, BOM, AMD), or city..." 
                      : "Search city name or state (Delhi, Gujarat, Mumbai)..."
                  } 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none font-medium text-lg text-gray-900"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {searchModalType === 'airports' ? (
                airportList
                  .filter(a => 
                    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.code.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((airport, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectLocationFromModal(airport.name)}
                      className="p-4 rounded-2xl border border-gray-200 hover:border-black hover:bg-green-50/50 cursor-pointer transition flex justify-between items-center group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-black text-white rounded-xl group-hover:bg-green-600 transition">
                          <Plane className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-gray-900">{airport.name}</h4>
                          <p className="text-xs text-gray-500 font-medium">{airport.city}, {airport.state}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          {airport.activeCabs}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                cityList
                  .filter(c => 
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    c.state.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((city, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectLocationFromModal(`${city.name}, ${city.state}`)}
                      className="p-4 rounded-2xl border border-gray-200 hover:border-black hover:bg-blue-50/50 cursor-pointer transition flex justify-between items-center group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-black text-white rounded-xl group-hover:bg-blue-600 transition">
                          <Globe className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-gray-900">{city.name}</h4>
                          <p className="text-xs text-gray-500 font-medium">{city.state}, India</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-blue-600">{city.activeVehicles}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{city.coverage}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[350] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowAddContactModal(false)} 
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Add Contact</h3>
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder="Name (e.g., Friend, Roommate)" 
                value={newContactName} 
                onChange={e => setNewContactName(e.target.value)} 
                className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium" 
              />
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={newContactPhone} 
                onChange={e => setNewContactPhone(e.target.value)} 
                className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium" 
              />
            </div>
            <button 
              onClick={handleAddContact} 
              disabled={!newContactName || !newContactPhone} 
              className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition"
            >
              Save Contact
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ DRIVER CONCERN REPORT MODAL — two-way safety */}
      {showDriverAlertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[350] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowDriverAlertModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <FileWarning className="h-6 w-6 text-purple-600" /> Report Rider Concern
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Driver protection: report suspicious behaviour or illegal items tied to this ride.
              An admin will review it and can mark you <strong>EXONERATED</strong> if you are not at fault.
            </p>
            <div className="space-y-4 mb-5">
              <select
                value={driverAlertReason}
                onChange={(e) => setDriverAlertReason(e.target.value)}
                className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="">Select concern…</option>
                <option value="Suspicious / illegal items">Suspicious / illegal items</option>
                <option value="Rider refused identity check">Rider refused identity check</option>
                <option value="Behavioural / safety concern">Behavioural / safety concern</option>
                <option value="Possible contraband / drugs">Possible contraband / drugs</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                value={driverAlertNotes}
                onChange={(e) => setDriverAlertNotes(e.target.value)}
                placeholder="Describe what you noticed (optional details help admins understand the incident)…"
                rows={4}
                className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium resize-none"
              />
              {driverAlertResult && (
                <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  {driverAlertResult}
                </p>
              )}
              {driverAlertError && (
                <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  ⚠️ {driverAlertError}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDriverAlertModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button
                onClick={submitDriverAlert}
                disabled={driverAlertBusy || !!driverAlertResult}
                className="flex-1 bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition disabled:opacity-60"
              >
                {driverAlertBusy ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS SIGNAL LOST POPUP */}
      {showGPSLostPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[350] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-orange-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-orange-500 h-2 animate-pulse"></div>
            <Globe className="h-20 w-20 text-orange-500 mb-6 mx-auto opacity-50" />
            <h2 className="text-3xl font-bold text-center mb-4">GPS Signal Lost</h2>
            <p className="text-gray-600 text-center text-lg mb-8">
              Smart Security AI Cab has lost connection with the driver's GPS. Security protocols are switching to offline cellular tracking. Do you feel safe?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowGPSLostPopup(false)} 
                className="w-full bg-black text-white font-bold text-xl py-4 rounded-xl hover:bg-gray-800 shadow-lg"
              >
                Yes, I am fine
              </button>
              <button 
                onClick={() => { triggerBackendSOS(); setShowGPSLostPopup(false); setShowSOSPopup(true); }} 
                className="w-full bg-red-600 text-white font-bold text-xl py-4 rounded-xl hover:bg-red-700 shadow-lg flex justify-center items-center"
              >
                <Siren className="h-6 w-6 mr-2" /> No, trigger SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUTE DEVIATION POPUP */}
      {showDeviationPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[350] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-yellow-400 h-2 animate-pulse"></div>
            <AlertCircle className="h-20 w-20 text-yellow-500 mb-6 mx-auto" />
            <h2 className="text-3xl font-bold text-center mb-4">Route Deviation Detected</h2>
            <p className="text-gray-600 text-center text-lg mb-8">
              Our AI detects your car has gone 500m off the GPS route. Are you okay? If you do not respond in 60 seconds, we will alert your emergency contacts.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowDeviationPopup(false)} 
                className="w-full bg-green-500 text-white font-bold text-xl py-4 rounded-xl hover:bg-green-600 shadow-lg"
              >
                Yes, I am fine
              </button>
              <button 
                onClick={() => { triggerBackendSOS(); setShowDeviationPopup(false); setShowSOSPopup(true); }} 
                className="w-full bg-red-600 text-white font-bold text-xl py-4 rounded-xl hover:bg-red-700 shadow-lg flex justify-center items-center"
              >
                <Siren className="h-6 w-6 mr-2" /> No, trigger SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE GUARD MODAL */}
      {showLiveGuardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-6 bg-pink-500 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Shield className="h-7 w-7 text-white" />
                <h3 className="text-2xl font-bold">Live Guard Mode</h3>
              </div>
              <button 
                onClick={() => setShowLiveGuardModal(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="bg-gray-900 rounded-2xl aspect-video mb-4 flex items-center justify-center relative overflow-hidden shadow-inner">
                <video 
                  ref={videoRef} 
                  className={`w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                  autoPlay 
                  playsInline 
                  muted
                ></video>

                {/* 🔄 FLIP CAMERA BUTTON */}
                <button 
                  onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
                  className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/50 text-white p-3 rounded-full shadow-lg transition transform hover:scale-110 flex items-center justify-center z-50"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>

                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> Live GPS
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> {new Date().toLocaleTimeString()}
                </div>
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  LIVE
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Secure Stream Encrypted</p>
                <button
                  onClick={() => {
                    alert("✅ Video securely downloaded and encrypted. Ready to share with local police authorities as evidence.");
                  }}
                  className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition flex items-center border border-red-200 shadow-sm hover:scale-105 transform"
                >
                  <Download className="h-4 w-4 mr-2" /> Save Evidence
                </button>
              </div>

              <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase">Verified Driver Details</h4>
              <div className="flex items-center bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 shadow-sm">
                <div className="h-14 w-14 bg-gray-300 rounded-full overflow-hidden mr-4 border-2 border-white shadow">
                  <img 
                    src={assignedDriver?.photo} 
                    alt="Driver" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{assignedDriver?.name}</h4>
                  <p className="text-xs text-gray-600 font-medium">DL: {assignedDriver?.dl} • ★ {assignedDriver?.rating}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-gray-900 bg-yellow-100 px-2 py-1 rounded border border-yellow-300">{assignedDriver?.plate}</h4>
                  <p className="text-xs text-gray-600 font-medium mt-1">White {selectedCar}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase">Share Live Link</h4>
              <div className="bg-gray-100 p-3 rounded-xl mb-6 flex items-center justify-between">
                <span className="text-sm font-mono truncate text-gray-600">
                  {liveGuardLink
                    ? "✅ Link created! Tap 'Share Live Location' below to share with family."
                    : "Tap 'Share Live Location' below to create a tracking link for family."}
                </span>
                <button
                  onClick={() => {
                    if (liveGuardLink) {
                      navigator.clipboard.writeText(liveGuardLink);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  disabled={!liveGuardLink}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Copy
                </button>
              </div>

                            <div className="space-y-3">
                {/* Recording Status */}
                {isRecordingVideo && (
                  <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-red-600 rounded-full mr-3 animate-ping"></div>
                      <span className="font-bold text-red-700">Recording Evidence...</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{recordingTimer}s</span>
                  </div>
                )}

                {/* Recorded Video Preview */}
                {recordedVideoURL && !isRecordingVideo && (
                  <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-bold text-green-700">Evidence Recorded</span>
                      </div>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = recordedVideoURL;
                          a.download = `Evidence_${Date.now()}.webm`;
                          a.click();
                        }}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </button>
                    </div>
                    <video 
                      src={recordedVideoURL} 
                      controls 
                      className="w-full rounded-lg border border-green-300"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={startVideoRecording}
                    disabled={isRecordingVideo}
                    className={`flex-1 font-bold py-3 rounded-xl transition flex items-center justify-center ${
                      isRecordingVideo 
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isRecordingVideo ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5 mr-2" /> Record 10s Evidence
                      </>
                    )}
                  </button>

                  <button
                    onClick={generateShareableLink}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <Compass className="h-5 w-5 mr-2" /> Share Live Location
                  </button>
                </div>

                {/* 📹 LIVE STREAM TOGGLE — streams the camera to the
                    TrackRide page in 5-second chunks so the family
                    member can see the cab interior in real time. */}
                <button
                  onClick={isLiveStreaming ? stopLiveStream : startLiveStream}
                  className={`w-full font-bold py-4 rounded-xl transition flex items-center justify-center text-base ${
                    isLiveStreaming
                      ? 'bg-red-100 text-red-700 border-2 border-red-500 hover:bg-red-200'
                      : 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 shadow-lg'
                  }`}
                >
                  {isLiveStreaming ? (
                    <>
                      <span className="h-3 w-3 bg-red-600 rounded-full mr-3 animate-pulse"></span>
                      📹 Live Stream ON — tap to stop
                    </>
                  ) : (
                    <>📹 Start Live Stream</>
                  )}
                </button>
                {isLiveStreaming && (
                  <p className="text-xs text-pink-700 text-center -mt-2 font-medium">
                    Your family can now see the cab interior on the tracking link.
                  </p>
                )}

                {/* Shareable Link Display */}
                {shareableLocationLink && (
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Live Tracking Link</p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <input
                        type="text"
                        value={shareableLocationLink}
                        readOnly
                        onClick={(e) => e.target.select()}
                        className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-mono min-w-0"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareableLocationLink);
                          alert("✅ Link copied again!");
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Anyone with this link can track this ride in real-time</p>
                  </div>
                )}

                {/* 📱 SOCIAL SHARE SHEET — WhatsApp / SMS / Email / Telegram / More.
                    Replaces the old auto-open-WhatsApp behavior. The rider
                    picks which app to use, instead of being forced into one. */}
                {shareableLocationLink && (
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-1 uppercase">Share with family</p>
                    <p className="text-xs text-blue-600 mb-3">Pick how you want to share the live tracking link</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚖 Smart Security AI Cab Live Tracking\n🚗 Driver: ${assignedDriver?.name} (${assignedDriver?.plate})\n📍 ${pickup} → ${dropoff}\nTrack live: ${shareableLocationLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition"
                        title="Share on WhatsApp"
                      >
                        <span className="text-base mb-0.5">💬</span>
                        WhatsApp
                      </a>
                      <a
                        href={`sms:?body=${encodeURIComponent(`🚖 Smart Security AI Cab Live Tracking\n🚗 Driver: ${assignedDriver?.name} (${assignedDriver?.plate})\n📍 ${pickup} → ${dropoff}\nTrack live: ${shareableLocationLink}`)}`}
                        className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition"
                        title="Share via SMS"
                      >
                        <span className="text-base mb-0.5">📱</span>
                        SMS
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent("My Smart Security AI Cab ride — live tracking")}&body=${encodeURIComponent(`🚖 Smart Security AI Cab Live Tracking\n🚗 Driver: ${assignedDriver?.name} (${assignedDriver?.plate})\n📍 ${pickup} → ${dropoff}\nTrack live: ${shareableLocationLink}`)}`}
                        className="flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition"
                        title="Share via Email"
                      >
                        <span className="text-base mb-0.5">✉️</span>
                        Email
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(shareableLocationLink)}&text=${encodeURIComponent("🚖 Track my Smart Security AI Cab ride live")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition"
                        title="Share on Telegram"
                      >
                        <span className="text-base mb-0.5">✈️</span>
                        Telegram
                      </a>
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: 'Smart Security AI Cab Live Tracking',
                                text: `🚖 Smart Security AI Cab Live Tracking\n🚗 Driver: ${assignedDriver?.name}\n📍 ${pickup} → ${dropoff}\nTrack live: ${shareableLocationLink}`,
                                url: shareableLocationLink,
                              });
                            } catch (e) { /* user cancelled */ }
                          } else {
                            navigator.clipboard.writeText(shareableLocationLink);
                            alert("✅ Link copied to clipboard — paste it anywhere!");
                          }
                        }}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-800 text-white rounded-lg py-2 px-1 text-xs font-bold transition"
                        title="Open your phone's share menu"
                      >
                        <span className="text-base mb-0.5">⋯</span>
                        More
                      </button>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setShowLiveGuardModal(false)}
                  className="w-full bg-gray-200 text-black font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SILENT SOS MODAL */}
      {showSilentSOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[450] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <Siren className="h-7 w-7 text-white animate-pulse" />
                <h3 className="text-2xl font-bold">Silent SOS Activated</h3>
              </div>
              <button 
                onClick={() => setShowSilentSOSModal(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="p-6">
              {emergencyAlertSent ? (
                <>
                  <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
                    <div className="flex">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                      <p className="text-green-700 font-bold">Emergency alert sent successfully!</p>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      Your emergency contacts, police (112), and women's helpline (181) have been notified with:
                    </p>
                    <ul className="text-sm text-green-600 mt-2 list-disc pl-5">
                      <li>Driver's name, photo, and license</li>
                      <li>Car model and number plate</li>
                      <li>Live GPS location and route</li>
                      <li>10-second video of the cab interior</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowSilentSOSModal(false); setEmergencyAlertSent(false); }}
                      className="flex-1 bg-gray-200 text-black font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => { window.open("tel:112", "_blank"); setShowSilentSOSModal(false); }}
                      className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition flex items-center justify-center"
                    >
                      <PhoneCall className="h-5 w-5 mr-2" /> Call 112
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 p-4 rounded-xl mb-6">
                    <h4 className="font-bold text-red-700 mb-2">Are you in danger?</h4>
                    <p className="text-sm text-gray-700">
                      This will send an emergency alert to your contacts, police (112), and women's helpline (181) with:
                    </p>
                    <ul className="text-sm text-gray-700 mt-2 list-disc pl-5">
                      <li>Driver's name, photo, and license</li>
                      <li>Car model and number plate</li>
                      <li>Live GPS location and route</li>
                      <li>10-second video of the cab interior</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSilentSOSModal(false)}
                      className="flex-1 bg-gray-200 text-black font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { triggerBackendSOS(); setEmergencyAlertSent(true); }}
                      className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
                    >
                      Send Emergency Alert
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SOS SIREN POPUP */}
      {showSOSPopup && (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-md z-[450] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-200">
          <Siren className="h-32 w-32 text-white animate-pulse mb-6" />
          <h2 className="text-white text-5xl font-bold mb-4 text-center">EMERGENCY SOS</h2>
          <p className="text-red-100 text-xl text-center max-w-lg mb-12">
            Your live location and dashcam feed have been sent to the Smart Security AI Cab Security Center. Do you need immediate police assistance?
          </p>
          <div className="flex flex-col w-full max-w-md gap-4">
            <a 
              href="tel:112" 
              className="w-full bg-white text-red-600 font-bold text-2xl py-5 rounded-2xl shadow-2xl hover:bg-gray-100 flex justify-center items-center"
            >
              <PhoneCall className="mr-3 h-8 w-8" /> Call Police (112)
            </a>
            <button 
              onClick={() => setShowSOSPopup(false)} 
              className="w-full bg-transparent border-2 border-white/50 text-white font-bold text-xl py-5 rounded-2xl hover:bg-white/10 transition"
            >
              Cancel - I am safe
            </button>
          </div>
        </div>
      )}

      {/* LANGUAGE MODAL */}
      {isLangModalOpen && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto animate-in fade-in duration-200">
          <div className="p-6 md:p-12 max-w-6xl mx-auto relative min-h-screen">
            <button 
              onClick={() => setIsLangModalOpen(false)} 
              className="absolute top-6 right-6 md:top-8 md:right-8 p-3 hover:bg-gray-100 rounded-full text-black transition"
            >
              <X className="h-8 w-8" strokeWidth={2.5} />
            </button>
            <div className="mt-20 md:mt-32">
              <h2 className="text-4xl md:text-5xl font-bold mb-16 notranslate">Select your preferred language</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
                {[
                  { eng: 'Bangla', native: 'বাংলা', code: 'bn' },
                  { eng: 'English', native: 'English', code: 'en' },
                  { eng: 'Gujarati', native: 'ગુજરાતી', code: 'gu' },
                  { eng: 'Hindi', native: 'हिन्दी', code: 'hi' },
                  { eng: 'Kannada', native: 'ಕನ್ನಡ', code: 'kn' },
                  { eng: 'Marathi', native: 'मराठी', code: 'mr' },
                  { eng: 'Tamil', native: 'தமிழ்', code: 'ta' },
                  { eng: 'Telugu', native: 'తెలుగు', code: 'te' },
                  { eng: 'Urdu', native: 'اردو', code: 'ur' }
                ].map((lang, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleLanguageChange(lang.code)} 
                    className="text-left text-lg text-gray-900 font-medium hover:text-gray-500 transition notranslate"
                  >
                    {lang.eng}, {lang.native}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-black text-white flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => { setMainView('ride'); resetRide(); }}
          >
            <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-amber-400/40" />
            <span className="text-2xl font-bold tracking-tight notranslate">Smart Security AI Cab</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-6 font-medium text-sm">
            <button 
              onClick={() => { setMainView('ride'); resetRide(); }} 
              className={`px-3 py-2 rounded-full transition ${mainView === 'ride' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              Ride
            </button>
            <button 
              onClick={() => setMainView('drive')} 
              className={`px-3 py-2 rounded-full transition ${mainView === 'drive' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              Drive
            </button>
            <button 
              onClick={() => setMainView('business')} 
              className={`px-3 py-2 rounded-full transition ${mainView === 'business' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              Business
            </button>
            <button
              onClick={() => setMainView('about')}
              className={`px-3 py-2 rounded-full transition ${mainView === 'about' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              About
            </button>
            <button
              onClick={() => setMainView('compat')}
              className={`px-3 py-2 rounded-full transition ${mainView === 'compat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
              title="Check if your phone supports Smart Security AI Cab"
            >
              📱 Compatibility
            </button>
            <button
              onClick={() => setMainView(loggedInUser ? 'dashboard' : 'login')}
              className={`px-3 py-2 rounded-full transition flex items-center ${mainView === 'dashboard' ? 'bg-gray-800 text-green-400' : 'hover:bg-gray-800 text-yellow-400'}`}
            >
              Dashboard
              {!loggedInUser && <span className="ml-1 text-[10px] bg-red-600 px-1.5 rounded-full text-white">New</span>}
            </button>
            <button
              onClick={() => { window.location.href = '/rides'; }}
              className="px-3 py-2 rounded-full transition hover:bg-gray-800"
            >
              My Rides
            </button>
            <button
              onClick={() => { window.location.href = '/safety'; }}
              className="px-3 py-2 rounded-full transition flex items-center hover:bg-gray-800"
            >
              🛡️ Safety Center
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-6 font-medium text-sm w-full md:w-auto">
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center hover:bg-gray-800 px-3 py-2 rounded-full"
          >
            <Globe className="h-4 w-4 mr-2" /> EN
          </button>
          {loggedInUser ? (
            <>
              <span className="hidden sm:flex items-center text-yellow-300 font-semibold text-sm">
                <User className="h-4 w-4 mr-1" /> {loggedInUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-2 rounded-full font-bold hover:bg-red-600 text-sm"
                title="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setAuthError(''); setMainView('login'); }}
                className="hover:bg-gray-800 px-3 py-2 rounded-full"
              >
                Log in
              </button>
              <button
                onClick={() => { setAuthError(''); setMainView('signup'); }}
                className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* LOGIN VIEW */}
      {mainView === 'login' && (
        <main className="max-w-md mx-auto px-4 py-24 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold mb-8 text-center">Welcome back</h1>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl px-4 py-4">
              <input
                type="email"
                placeholder="Email or Phone Number"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-4 flex items-center">
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
              <Lock className="h-5 w-5 text-gray-400"/>
            </div>
            {authError && (
              <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                ⚠️ {authError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 transition shadow-lg mt-4 disabled:opacity-50"
            >
              {authLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
          <p className="text-center mt-6 text-gray-600 font-medium cursor-pointer hover:underline">Forgot password?</p>
          <p className="text-center mt-4 text-gray-600">
            Don't have an account?{' '}
            <span
              onClick={() => { setAuthError(''); setMainView('signup'); }}
              className="text-black font-bold cursor-pointer hover:underline"
            >
              Sign up
            </span>
          </p>
        </main>
      )}

      {/* SIGNUP VIEW */}
      {mainView === 'signup' && (
        <main className="max-w-md mx-auto px-4 py-16 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-center text-gray-600 mb-8 font-medium">Join Smart Security AI Cab Security today.</p>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl px-4 py-4">
              <input
                type="text"
                placeholder="Full Name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-4">
              <input
                type="email"
                placeholder="Email Address"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-4">
              <input
                type="tel"
                placeholder="Phone Number"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-4">
              <input
                type="password"
                placeholder="Create Password (6+ characters)"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                className="w-full bg-transparent outline-none text-lg font-medium"
              />
            </div>
            {authError && (
              <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                ⚠️ {authError}
              </p>
            )}
            <button
              onClick={handleSignup}
              disabled={authLoading}
              className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 transition shadow-lg mt-4 disabled:opacity-50"
            >
              {authLoading ? 'Creating account…' : 'Register & Continue'}
            </button>
          </div>
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <span
              onClick={() => { setAuthError(''); setMainView('login'); }}
              className="text-black font-bold cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </main>
      )}

      {/* DASHBOARD VIEW */}
      {mainView === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-4 md:px-12 py-12 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8">
          {/* Stale-session banner — shown instead of a blank screen */}
          {(!loggedInUser) && authError && (
            <div className="w-full md:w-1/4 bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-4 h-max">
              <h3 className="font-bold text-amber-900 mb-2">⚠️ Session expired</h3>
              <p className="text-sm text-amber-800 mb-4">{authError} Your data is safe — you can log in again.</p>
              <button
                onClick={() => { setAuthError(''); setMainView('login'); }}
                className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition"
              >
                Log in again
              </button>
            </div>
          )}
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="flex items-center space-x-4 mb-8">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-black">
                <User className="h-8 w-8 text-gray-500"/>
              </div>
              <div>
                <h2 className="text-xl font-bold">{userProfile.name}</h2>
                <p className="text-sm text-green-600 font-bold">Verified Rider</p>
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => setDashTab('history')} 
                className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'history' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                <History className="h-5 w-5 mr-3"/> Ride History
              </button>
              <button 
                onClick={() => setDashTab('profile')} 
                className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                <User className="h-5 w-5 mr-3"/> Profile
              </button>
              <button 
                onClick={() => setDashTab('settings')} 
                className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'settings' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                <Settings className="h-5 w-5 mr-3"/> Settings
              </button>
              <button 
                onClick={() => setMainView('login')} 
                className="w-full text-left px-4 py-3 rounded-xl font-bold flex items-center text-red-600 hover:bg-red-50 mt-4 transition"
              >
                <LogOut className="h-5 w-5 mr-3"/> Log Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">

            {/* HISTORY TAB */}
            {dashTab === 'history' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Recent Rides</h2>
                <div className="space-y-4">
                  {Array.isArray(dashboardBookings) && dashboardBookings.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
                      <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold">No rides found in the database yet. Go book one!</p>
                    </div>
                  ) : (
                    dashboardBookings.map((ride, i) => (
                      <div 
                        key={ride.id || i} 
                        className={`border-2 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center transition ${
                          ride.status === 'DANGER' 
                            ? 'border-red-500 bg-red-50 shadow-sm' 
                            : 'border-gray-200 hover:shadow-md bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0 w-2/3">
                          <div className={`p-4 rounded-full ${ride.status === 'DANGER' ? 'bg-red-200' : 'bg-gray-100'}`}>
                            <Car className={`h-6 w-6 ${ride.status === 'DANGER' ? 'text-red-700' : 'text-gray-700'}`}/>
                          </div>
                          <div className="truncate pr-4">
                            <p className="font-bold text-lg truncate">
                              {ride.pickupLocation} → {ride.dropoffLocation}
                            </p>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                              Passenger: {ride.riderName} • Dist: {ride.distanceKm} km
                            </p>
                          </div>
                        </div>
                        <div className="text-right sm:w-1/3">
                          <p className="font-bold text-2xl">₹{ride.fare}</p>
                          <p className={`text-sm font-bold mt-1 px-3 py-1 rounded-full inline-block ${
                            ride.status === 'DANGER' 
                              ? 'bg-red-200 text-red-700 animate-pulse' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {ride.status === 'DANGER' ? '🚨 SOS TRIGGERED' : 'Completed'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {dashTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-3xl font-bold mb-6">Profile Details</h2>
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-gray-500">Full Name</label>
                      <input 
                        type="text" 
                        value={userProfile.name} 
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} 
                        disabled={!isEditingProfile} 
                        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-900 transition ${
                          !isEditingProfile ? 'opacity-60 bg-gray-100' : 'focus:ring-2 ring-black outline-none shadow-sm'
                        }`} 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">Email</label>
                      <input 
                        type="email" 
                        value={userProfile.email} 
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})} 
                        disabled={!isEditingProfile} 
                        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-900 transition ${
                          !isEditingProfile ? 'opacity-60 bg-gray-100' : 'focus:ring-2 ring-black outline-none shadow-sm'
                        }`} 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">Phone</label>
                      <input 
                        type="tel" 
                        value={userProfile.phone} 
                        onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})} 
                        disabled={!isEditingProfile} 
                        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-900 transition ${
                          !isEditingProfile ? 'opacity-60 bg-gray-100' : 'focus:ring-2 ring-black outline-none shadow-sm'
                        }`} 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">Home Address</label>
                      <input 
                        type="text" 
                        placeholder="Add Home Address" 
                        value={userProfile.address} 
                        onChange={(e) => setUserProfile({...userProfile, address: e.target.value})} 
                        disabled={!isEditingProfile} 
                        className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-900 transition ${
                          !isEditingProfile ? 'opacity-60 bg-gray-100' : 'focus:ring-2 ring-black outline-none shadow-sm'
                        }`} 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (isEditingProfile) alert("✅ Profile Updated Successfully!");
                      setIsEditingProfile(!isEditingProfile);
                    }} 
                    className={`mt-8 font-bold py-3 px-8 rounded-xl transition shadow-md flex items-center ${
                      isEditingProfile 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {isEditingProfile 
                      ? <><CheckCircle className="h-5 w-5 mr-2"/> Save Profile</> 
                      : 'Edit Profile'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {dashTab === 'settings' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Security & Settings</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-lg">AI Deviation Alerts</h3>
                      <p className="text-sm text-gray-500">Get notified if your driver goes off route</p>
                    </div>
                    <div 
                      onClick={() => setAlertsEnabled(!alertsEnabled)} 
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${alertsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${alertsEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-lg">Share Trip with Contacts</h3>
                      <p className="text-sm text-gray-500">Automatically share live link when trip starts</p>
                    </div>
                    <div 
                      onClick={() => setShareTripEnabled(!shareTripEnabled)} 
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${shareTripEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${shareTripEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-lg">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive offers and discounts</p>
                    </div>
                    <div 
                      onClick={() => setMarketingEnabled(!marketingEnabled)} 
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${marketingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${marketingEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* RIDE VIEW */}
      {mainView === 'ride' && (
        <div className="animate-in fade-in duration-500">
          
          <div className="border-b flex flex-col md:flex-row items-center px-4 md:px-12 pt-3 justify-between gap-2 overflow-hidden">
            <h2 className="text-2xl font-bold pb-1 md:pb-3 shrink-0">Ride</h2>
            <div className="flex overflow-x-auto w-full space-x-6 text-sm font-medium text-gray-500 pb-2 hide-scrollbar">
              <button 
                onClick={() => { setActiveTab('request'); setShowPrices(false); }} 
                className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'request' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
              >
                Request a ride
              </button>
              <button 
                onClick={() => { setActiveTab('reserve'); setShowPrices(false); }} 
                className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'reserve' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
              >
                Reserve a ride
              </button>
              <button 
                onClick={() => { setActiveTab('parcel'); setShowPrices(false); }} 
                className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'parcel' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
              >
                Parcel
              </button>
              <button 
                onClick={() => { setActiveTab('rentals'); setShowPrices(false); }} 
                className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'rentals' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
              >
                Rentals
              </button>
              <button 
                onClick={handleExploreClick} 
                className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'explore' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
              >
                Explore options
              </button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 flex flex-col md:flex-row gap-12 items-start">
            <div className={`w-full flex flex-col relative min-h-[500px] ${rideConfirmed ? '' : 'md:w-1/2'}`}>
              
              {/* PARCEL TAB */}
              {activeTab === 'parcel' && !showPrices && !rideConfirmed && (
                <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                  <div className="w-full h-40 bg-orange-100 rounded-t-2xl overflow-hidden mb-6 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1617500585800-47b220b396b2?auto=format&fit=crop&q=80&w=800" 
                      alt="Courier" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h1 className="text-4xl font-bold mb-3">Courier</h1>
                  <p className="text-gray-600 mb-6 text-lg">
                    Have a courier deliver something for you. Get packages delivered in the time it takes to drive there.
                  </p>
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <button 
                      onClick={() => setParcelMode('send')} 
                      className={`flex-1 py-3 text-lg font-bold rounded-lg transition-all ${parcelMode === 'send' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                      Send
                    </button>
                    <button 
                      onClick={() => setParcelMode('receive')} 
                      className={`flex-1 py-3 text-lg font-bold rounded-lg transition-all ${parcelMode === 'receive' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                      Receive
                    </button>
                  </div>
                  <div className="relative flex flex-col space-y-3 w-full mb-8">
                    <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                    {renderLocationInput('pickup', "Choose sender's location", pickup, setPickup)}
                    {renderLocationInput('dropoff', "Choose recipient's location", dropoff, setDropoff)}
                  </div>
                  <button 
                    onClick={() => setShowPrices(true)} 
                    disabled={!pickup || !dropoff} 
                    className={`text-white text-lg font-bold py-4 px-6 rounded-lg w-full mt-auto transition ${(!pickup || !dropoff) ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 shadow-lg'}`}
                  >
                    Search
                  </button>
                </div>
              )}
              
              {/* RENTALS TAB */}
              {activeTab === 'rentals' && !showPrices && !rideConfirmed && (
                <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                  <h1 className="text-4xl font-bold mb-8 mt-4">Find a trip</h1>
                  <div className="relative flex flex-col space-y-3 w-full mb-6">
                    <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                    {renderLocationInput('pickup', "Pick-up location", pickup, setPickup)}
                    {renderLocationInput('dropoff', "Drop-off location", dropoff, setDropoff)}
                  </div>
                  <div className="relative mb-3">
                    <div 
                      onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowForWhoDropdown(false); }} 
                      className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-4 hover:bg-gray-200 cursor-pointer transition"
                    >
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-black mr-4" />
                        <span className="text-lg font-medium">{pickupTime}</span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                    {showTimeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => { setPickupTime('Pick up now'); setShowTimeDropdown(false); }} 
                          className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-lg font-medium transition"
                        >
                          Pick up now
                        </button>
                        <button 
                          onClick={() => { setPickupTime('Schedule for later'); setShowTimeDropdown(false); }} 
                          className="w-full text-left px-6 py-4 hover:bg-gray-50 text-lg font-medium transition"
                        >
                          Schedule for later
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative mb-8 w-max">
                    <div 
                      onClick={() => { setShowForWhoDropdown(!showForWhoDropdown); setShowTimeDropdown(false); }} 
                      className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-4 hover:bg-gray-200 cursor-pointer transition pr-6"
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-black mr-4" />
                        <span className="text-lg font-medium">{forWho}</span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-gray-500 ml-4" />
                    </div>
                    {showForWhoDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => { setForWho('For me'); setShowForWhoDropdown(false); }} 
                          className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-lg font-medium transition"
                        >
                          For me
                        </button>
                        <button 
                          onClick={() => { setForWho('For a guest'); setShowForWhoDropdown(false); }} 
                          className="w-full text-left px-6 py-4 hover:bg-gray-50 text-lg font-medium transition"
                        >
                          For a guest
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowPrices(true)} 
                    disabled={!pickup || !dropoff} 
                    className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full mt-auto hover:bg-gray-800 transition disabled:bg-gray-300"
                  >
                    Search
                  </button>
                </div>
              )}
            
              {/* REQUEST / RESERVE / EXPLORE / PRICES / CONFIRMED */}
              {(['request', 'reserve', 'explore'].includes(activeTab) || showPrices || rideConfirmed) && (
                <>
                  {rideConfirmed ? (
                    <div className="w-full h-[600px] flex flex-col animate-in fade-in duration-500">
                      <h2 className="text-3xl font-bold mb-4 flex items-center">
                        <ShieldCheck className="text-green-600 mr-2 h-8 w-8"/> Trip Monitoring
                      </h2>
                      
                      <div className="w-full flex-1 bg-gray-100 rounded-3xl overflow-hidden shadow-2xl relative border border-gray-200 mb-4">
                        <div className="absolute inset-0 z-0">
                          <MapContainer 
                            center={mapCenter} 
                            zoom={mapZoom} 
                            scrollWheelZoom={false} 
                            style={{ height: '100%', width: '100%', zIndex: 0 }} 
                            zoomControl={false}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapUpdater center={mapCenter} zoom={mapZoom} />
                            {pickupCoords && <Marker position={pickupCoords} icon={pickupIcon} />}
                            {dropoffCoords && <Marker position={dropoffCoords} icon={dropoffIcon} />}
                            {pickupCoords && dropoffCoords && (
                              <Marker position={[currentCarLat, currentCarLng]} icon={carIcon} />
                            )}
                          </MapContainer>
                        </div>

                        {/* SOS BUTTON */}
                        <button 
                          onClick={() => { triggerBackendSOS(); setShowSOSPopup(true); }}
                          className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20 flex items-center text-2xl animate-pulse transition transform hover:scale-105"
                        >
                          <Siren className="mr-3 h-8 w-8" /> SOS
                        </button>

                        {/* BOTTOM PANEL */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-8 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 z-10 flex flex-col md:flex-row gap-8 items-center">
                          <div className="w-full md:w-2/3">
                            <div className="flex justify-between items-center mb-2">
                              <h2 className="text-2xl font-bold text-gray-900">
                                Driver {assignedDriver?.name} ({selectedCar})
                              </h2>
                              <span className="text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                On Route
                              </span>
                            </div>
                            
                            <div className="w-full bg-blue-100 rounded-full h-4 mb-2 overflow-hidden mt-6">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                                style={{ width: `${rideProgress}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-500 font-medium mb-4 mt-2">
                              <span>{pickup}</span>
                              <span className="font-bold text-green-600 text-base">
                                {rideProgress === 100 ? 'Arrived!' : `${Math.round(rideProgress)}%`}
                              </span>
                              <span>{dropoff}</span>
                            </div>
                          </div>
                          
                          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-base font-bold text-gray-700">Emergency Safety</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowLiveGuardModal(true)}
                                  className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg hover:bg-pink-100 flex items-center transition border border-pink-200"
                                >
                                  <Video className="h-4 w-4 mr-1" /> Live Guard
                                </button>
                                <button
                                  onClick={() => setShowSilentSOSModal(true)}
                                  className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center transition border border-red-200"
                                >
                                  <Siren className="h-4 w-4 mr-1" /> Silent SOS
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                              <p className="text-base font-bold text-gray-700">Emergency Contacts</p>
                              <button 
                                onClick={() => setShowAddContactModal(true)} 
                                className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center transition border border-blue-200"
                              >
                                <Plus className="h-4 w-4 mr-1"/> Add
                              </button>
                            </div>
                            
                                                        <div className="flex flex-wrap gap-2 mb-6">
                              {emergencyContacts.length === 0 && (
                                <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 w-full">
                                  No emergency contacts yet. Add anyone you trust — a friend, roommate, partner, colleague, or family. 🛟
                                </p>
                              )}
                              {emergencyContacts.map((contact, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 pl-4 pr-2 py-2 rounded-lg text-sm font-bold flex items-center w-max border border-transparent hover:border-gray-300 transition"
                                >
                                  <a href={`tel:${contact.phone}`} className="flex items-center hover:underline">
                                    <PhoneCall className="h-4 w-4 mr-2 text-green-600"/> {contact.name}
                                  </a>
                                  <button
                                    onClick={() => handleRemoveContact(contact.phone)}
                                    className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                    title={`Remove ${contact.name}`}
                                    aria-label={`Remove ${contact.name}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* 🛡️ DRIVER SAFETY — two-way protection: verify the rider at
                                pickup and report any concern so the driver is never
                                blamed for a rider's illegal items. */}
                            <div className="border-t border-gray-200 pt-4 mt-2 mb-5">
                              <p className="text-base font-bold text-gray-700 mb-3 flex items-center">
                                <ShieldCheck className="h-4 w-4 mr-1.5 text-green-600" /> Driver Protection
                              </p>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-xs font-semibold text-slate-600">
                                  {riderVerified ? '✅ Rider identity verified' : 'Verify rider identity at pickup'}
                                </span>
                                <button
                                  onClick={verifyRiderIdentity}
                                  disabled={riderVerified || riderVerifyBusy}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border ${
                                    riderVerified
                                      ? 'text-green-700 bg-green-50 border-green-200 cursor-default'
                                      : 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  }`}
                                >
                                  {riderVerifyBusy ? 'Saving…' : riderVerified ? 'Verified ✓' : 'Verify ID'}
                                </button>
                              </div>
                              {riderVerifyMessage && (
                                <p className="text-xs font-semibold text-slate-500 mb-3">{riderVerifyMessage}</p>
                              )}
                              <button
                                onClick={() => { setShowDriverAlertModal(true); setDriverAlertResult(''); setDriverAlertError(''); }}
                                className="w-full text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 hover:bg-purple-100 flex items-center justify-center gap-2 transition"
                              >
                                <FileWarning className="h-4 w-4" /> Report rider concern (suspicious / illegal items)
                              </button>
                              <p className="text-[11px] text-slate-400 mt-2">
                                Your report is tied to this ride. If you were not at fault, an admin will review it and mark you <strong>EXONERATED</strong>.
                              </p>
                            </div>

                            <div className="flex gap-3">
                              {rideProgress === 100 ? (
                                <button 
                                  onClick={resetRide} 
                                  className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition"
                                >
                                  Book Again
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => setShowDeviationPopup(true)} 
                                    className="w-1/2 bg-yellow-100 text-yellow-800 font-bold py-3.5 rounded-xl hover:bg-yellow-200 transition border border-yellow-300"
                                  >
                                    Test Route Warning
                                  </button>
                                  <button 
                                    onClick={resetRide} 
                                    className="w-1/2 bg-gray-200 text-black font-bold py-3.5 rounded-xl hover:bg-gray-300 transition"
                                  >
                                    Cancel Ride
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  ) : showPrices ? (
                    <div className="animate-in slide-in-from-right-8 duration-300 w-full max-w-md h-full flex flex-col">
                      <div className="shrink-0">
                        <button 
                          onClick={() => setShowPrices(false)} 
                          className="flex items-center text-blue-600 font-medium hover:underline mb-4"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" /> Back to locations
                        </button>
                        <h2 className="text-3xl font-bold mb-4">Choose your ride</h2>
                      </div>
                      <div className="overflow-y-auto flex-1 pr-2 space-y-3 mb-4">
                        <div
                          onClick={() => setSelectedCar('SmartBike')}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartBike' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <Bike className="h-8 w-8 text-red-500" />
                            <div>
                              <h3 className="font-bold text-lg notranslate">🏍️ SmartBike</h3>
                              <p className="text-xs text-red-600 font-medium flex items-center mt-1">
                                <ShieldCheck className="h-3 w-3 mr-1"/> Helmet Verified
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">₹{displayFare(20, 6)}</div>
                        </div>

                        <div
                          onClick={() => setSelectedCar('SmartMini')}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartMini' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <Car className="h-8 w-8 text-gray-700" />
                            <div>
                              <h3 className="font-bold text-lg notranslate">🚗 SmartMini</h3>
                              <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                                <ShieldCheck className="h-3 w-3 mr-1"/> SOS Active
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">₹{displayFare(40, 10)}</div>
                        </div>

                        <div
                          onClick={() => setSelectedCar('SmartSedan')}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSedan' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <Car className="h-10 w-10 text-gray-900" />
                            <div>
                              <h3 className="font-bold text-lg notranslate">🚖 SmartSedan</h3>
                              <p className="text-xs text-blue-600 font-medium flex items-center mt-1">
                                <Shield className="h-3 w-3 mr-1"/> Top Rated Driver
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">₹{displayFare(50, 14)}</div>
                        </div>

                        <div
                          onClick={() => setSelectedCar('SmartSUV')}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSUV' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <Car className="h-12 w-12 text-black" />
                            <div>
                              <h3 className="font-bold text-lg notranslate">🚙 SmartSUV</h3>
                              <p className="text-xs text-purple-600 font-medium flex items-center mt-1">
                                <User className="h-3 w-3 mr-1"/> 6 Seats
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-bold">₹{displayFare(80, 20)}</div>
                        </div>
                      </div>
                      <div className="shrink-0 pt-2 border-t border-gray-100">
                        <button 
                          onClick={handleConfirmRide} 
                          disabled={isSearching} 
                          className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg flex justify-center items-center disabled:bg-gray-400"
                        >
                          {isSearching 
                            ? <><Loader2 className="animate-spin mr-2 h-5 w-5"/> Locating...</> 
                            : `Confirm ${selectedCar}`
                          }
                        </button>
                      </div>
                    </div>

                  ) : (
                    <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                      <div className="flex items-center space-x-2 text-gray-700 mb-8 font-medium">
                        <MapPin className="h-5 w-5 text-black" />
                        <span>Current Location (GPS Active)</span>
                      </div>
                      <h1 className="text-5xl font-bold mb-8 transition-all">
                        {activeTab === 'request' && "Request a secure ride"}
                        {activeTab === 'reserve' && "Reserve a ride in advance"}
                        {activeTab === 'explore' && "Explore your options"}
                      </h1>
                      <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 w-max px-4 py-3 rounded-full font-medium mb-6 transition">
                        <Clock className="h-5 w-5" />
                        <span>{activeTab === 'reserve' ? 'Schedule for later' : 'Pickup now'}</span>
                        <ChevronDown className="h-5 w-5" />
                      </button>
                      <div className="relative flex flex-col space-y-3 w-full">
                        <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                        {renderLocationInput('pickup', "Pickup (e.g., Delhi, Bangalore)", pickup, setPickup)}
                        {renderLocationInput('dropoff', "Dropoff (e.g., Mumbai, Goa)", dropoff, setDropoff)}
                        {/* 📍 USE MY LOCATION — Uber/Ola-style quick GPS pickup.
                            This is what gives an accurate ~3 km fare for
                            Chandlodia → Gota instead of a 15.5 km fallback. */}
                        <button
                          onClick={useMyLocation}
                          disabled={locatingMe}
                          type="button"
                          className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 font-bold py-3 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 mt-1"
                        >
                          <span className="text-base">📍</span>
                          <span className="text-sm">{locatingMe ? 'Finding your location…' : 'Use my current location'}</span>
                        </button>
                      </div>
                      <div className="mt-auto pt-8">
                        <button
                          onClick={handleSearchPrices}
                          disabled={!pickup || !dropoff || pricingLoading} 
                          className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 hover:scale-[1.02] transform"
                        >
                          {pricingLoading ? 'Locating on map…' : 'Search route & see prices'}
                        </button>
                        {(!pickup || !dropoff) && (
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Please enter pickup and dropoff to search
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT SIDE MAP (only when not confirmed) */}
            {!rideConfirmed && (
              <div className="w-full md:w-1/2 mt-8 md:mt-0 h-[500px]">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-100 cursor-crosshair">
                  <div className="absolute inset-0 z-0 opacity-80">
                    <MapContainer 
                      center={[20.5937, 78.9629]} 
                      zoom={5} 
                      scrollWheelZoom={true} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} />
                    </MapContainer>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 flex items-end p-8 pointer-events-none">
                    <h3 className="text-white text-3xl font-bold w-3/4">Travel safely anywhere in India.</h3>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold text-green-700 shadow z-20 pointer-events-none">
                    <ShieldCheck className="h-4 w-4" />
                    <span>AI Security Active</span>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* EXPLORE SECTION */}
          <section id="explore-section" className="max-w-7xl mx-auto px-4 md:px-12 py-16">
            <h2 className="text-3xl font-bold mb-8">Explore what you can do with Smart Security AI Cab</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => handleFeatureCardClick('request')}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ride</h3>
                    <p className="text-sm text-gray-600 mb-6">Go anywhere with full GPS tracking. Request a ride, hop in, and go safely.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Car className="h-20 w-20 text-gray-700 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => handleFeatureCardClick('reserve')}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Reserve</h3>
                    <p className="text-sm text-gray-600 mb-6">Reserve your secure ride in advance. Pre-vetted drivers assigned for safety.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Calendar className="h-20 w-20 text-blue-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => openFeatureDetails('intercity')}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Intercity</h3>
                    <p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route alerts.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); openFeatureDetails('intercity'); }} 
                    className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50"
                  >
                    Details
                  </button>
                </div>
                <Map className="h-20 w-20 text-green-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => handleFeatureCardClick('rentals')}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Rentals</h3>
                    <p className="text-sm text-gray-600 mb-6">Request a trip for a block of time and make multiple stops easily.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Clock className="h-20 w-20 text-purple-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => openFeatureDetails('bike')}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Bike</h3>
                    <p className="text-sm text-gray-600 mb-6">Get affordable, quick motorbike rides in minutes at your doorstep.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); openFeatureDetails('bike'); }} 
                    className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50"
                  >
                    Details
                  </button>
                </div>
                <Bike className="h-20 w-20 text-red-500 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </section>

          {/* RESERVE SECTION */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-12">
            <div className="flex flex-col lg:flex-row bg-[#e2f1f8] rounded-2xl overflow-hidden relative">
              <div className="w-full lg:w-1/2 p-8 md:p-12 z-10 flex flex-col justify-center">
                <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-gray-900">
                  Get your ride right<br/>with Smart Security AI Cab Reserve
                </h3>
                <p className="font-bold mb-2">Choose date and time</p>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3 shadow-sm border border-gray-200 focus-within:ring-2 ring-black">
                    <Calendar className="h-5 w-5 mr-3 text-gray-600" />
                    <input type="date" className="outline-none w-full bg-transparent text-gray-800" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3 shadow-sm border border-gray-200 focus-within:ring-2 ring-black">
                    <Clock className="h-5 w-5 mr-3 text-gray-600" />
                    <input type="time" className="outline-none w-full bg-transparent text-gray-800" />
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCard({ 
                    title: 'Reservation Confirmed', 
                    description: 'Your ride has been scheduled! We will assign a top-rated driver 24 hours before your pickup time and notify you via SMS.' 
                  })} 
                  className="bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg w-full md:w-max px-12"
                >
                  Next
                </button>
              </div>
              <div className="w-full lg:w-1/2 p-8 md:p-12 flex items-center justify-center lg:justify-end relative">
                <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full z-10 border border-gray-100">
                  <h4 className="text-2xl font-bold mb-6">Benefits</h4>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <CalendarDays className="h-6 w-6 mr-4 text-black shrink-0 mt-1" />
                      <p className="text-gray-700">Choose your exact pickup time up to 90 days in advance.</p>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-6 w-6 mr-4 text-black shrink-0 mt-1" />
                      <p className="text-gray-700">Extra wait time included to meet your ride.</p>
                    </div>
                    <div className="flex items-start">
                      <CreditCard className="h-6 w-6 mr-4 text-black shrink-0 mt-1" />
                      <p className="text-gray-700">Cancel at no charge up to 60 minutes in advance.</p>
                    </div>
                  </div>
                  <button className="mt-8 text-gray-500 underline text-sm hover:text-black transition">See terms</button>
                </div>
              </div>
            </div>
          </section>

          {/* GROUP RIDE SECTION */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="border-[8px] border-black rounded-[2.5rem] w-full max-w-[320px] bg-white overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20"></div>
                  <div className="p-6 pt-12 pb-24">
                    <h4 className="text-2xl font-bold mb-6">Rahul's group ride</h4>
                    <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] p-4 border border-gray-100">
                      <p className="font-bold mb-4">Set pickup order</p>
                      <div className="relative border-l-2 border-black ml-3 space-y-6 pb-2">
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold">Rahul</p>
                              <div className="h-2 w-16 bg-gray-200 rounded mt-1"></div>
                            </div>
                            <div className="w-4 flex flex-col space-y-1">
                              <div className="h-0.5 w-full bg-gray-400"></div>
                              <div className="h-0.5 w-full bg-gray-400"></div>
                            </div>
                          </div>
                        </div>
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold">Priya</p>
                              <div className="h-2 w-24 bg-gray-200 rounded mt-1"></div>
                            </div>
                            <div className="w-4 flex flex-col space-y-1">
                              <div className="h-0.5 w-full bg-gray-400"></div>
                              <div className="h-0.5 w-full bg-gray-400"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Ride with friends seamlessly</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Riding with friends just got easier: set up a group ride in the Smart Security AI Cab app, invite your friends, and arrive at your destination. Friends who ride together save together.
                </p>
                <button 
                  onClick={() => setSelectedCard({ 
                    title: 'Group Rides', 
                    description: 'Share a link with up to 3 friends. The app will automatically calculate the most efficient route to pick everyone up and split the fare evenly among all passengers!' 
                  })} 
                  className="font-medium border-b border-black pb-1 hover:text-gray-600 transition"
                >
                  Learn more
                </button>
              </div>
            </div>
          </section>

          {/* TRAVEL YOUR WAY SECTION */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold mb-8 text-center md:text-left">
              Use the Smart Security AI Cab app to help you travel your way
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600" 
                    alt="Ride options" 
                    className="w-full h-full object-cover hover:scale-105 transition duration-500" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">Ride options</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  There's more than one way to move with Smart Security AI Cab, no matter where you are or where you're headed next.
                </p>
                <button 
                  onClick={() => { setActiveTab('request'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max"
                >
                  Search ride options
                </button>
              </div>

              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600" 
                    alt="Airports" 
                    className="w-full h-full object-cover hover:scale-105 transition duration-500" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">700+ airports</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  You can request a ride to and from most major airports. Schedule a ride to the airport for one less thing to worry about.
                </p>
                <button 
                  onClick={() => setSearchModalType('airports')} 
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center shadow-md hover:scale-105 transform"
                >
                  <Plane className="h-4 w-4 mr-2" /> Search airports
                </button>
              </div>

              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600" 
                    alt="Cities" 
                    className="w-full h-full object-cover hover:scale-105 transition duration-500" 
                  />
                </div>
                <h3 className="text-xl font-bold mb-3">15,000+ cities</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  The app is available in thousands of cities worldwide, so you can request a ride even when you're far from home.
                </p>
                <button 
                  onClick={() => setSearchModalType('cities')} 
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center shadow-md hover:scale-105 transform"
                >
                  <Globe className="h-4 w-4 mr-2" /> Search cities
                </button>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* DRIVE VIEW */}
      {mainView === 'drive' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Drive when you want, make what you need
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Make money on your schedule. Smart Security AI Cab's AI-driven security protects our drivers just as much as our riders.
            </p>
            <button 
              onClick={() => { closeAllForms(); setShowDriverForm(true); }} 
              className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg hover:scale-105 transform"
            >
              Apply to drive →
            </button>
            {driverAppRef && (
              <button
                onClick={async () => {
                  setDriverSubmitError('');
                  setDriverStatusLoading(true);
                  try {
                    const res = await fetch(`${PYTHON_API}/api/drivers/application/${encodeURIComponent(driverAppRef)}`);
                    const data = await res.json();
                    if (res.ok && data.application) {
                      setDriverAppStatus(data.application.status);
                      setDriverSubmitError('');
                      alert(`📋 Application ${driverAppRef}\n\nCurrent status: ${data.application.status}\n\nWe'll notify you once a decision is made.`);
                    } else {
                      setDriverSubmitError('Could not find that application. Check the reference and try again.');
                    }
                  } catch (err) {
                    setDriverSubmitError('Could not reach the server. Please try again later.');
                  } finally {
                    setDriverStatusLoading(false);
                  }
                }}
                className="mt-4 text-sm font-bold text-black underline underline-offset-4 hover:text-gray-700 transition"
              >
                {driverStatusLoading ? 'Checking…' : `Check application status (${driverAppRef})`}
              </button>
            )}
            {driverSubmitError && driverAppRef && (
              <p className="mt-2 text-sm font-semibold text-red-600">⚠️ {driverSubmitError}</p>
            )}
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200" 
                alt="Driver" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Driver Protection Active</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* BUSINESS VIEW */}
      {mainView === 'business' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Smart Security AI Cab for Business</h1>
            <p className="text-xl text-gray-600 mb-8">
              A premium, secure travel solution for your employees. Corporate billing and a real-time safety dashboard.
            </p>
            <button 
              onClick={() => { closeAllForms(); setShowBusinessForm(true); }} 
              className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg hover:scale-105 transform"
            >
              Set up your company →
            </button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200" 
                alt="Business" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ✨ OUR MISSION — The women's safety story behind Smart Security AI Cab */}
      {mainView === 'about' && (
        <main className="max-w-5xl mx-auto px-4 md:px-12 py-16 animate-in fade-in duration-500">
          {/* --- HERO --- */}
          <section className="text-center mb-20">
            <div className="inline-flex items-center bg-pink-50 border-2 border-pink-300 text-pink-700 font-bold px-4 py-2 rounded-full text-sm mb-6">
              ✨ Our Mission
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Built for Safety.<br/>
              <span className="text-pink-600">Built for Her.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed italic">
              "Every woman deserves to step into a cab and arrive home safely —<br className="hidden md:block"/>
              without the knot in her stomach, without checking the back seat twice."
            </p>
            <p className="text-base text-gray-500 mt-6 max-w-2xl mx-auto">
              Smart Security AI Cab was built by women who have ridden home alone at night with their
              keys between their fingers. We're changing that — one ride at a time.
            </p>
          </section>

          {/* --- THE PROBLEM --- */}
          <section className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">The reality women face every day</h2>
            <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
              This isn't just a statistic. It's a feeling every woman knows.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-pink-50 to-red-50 border-2 border-pink-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">1 in 3</div>
                <p className="text-sm font-medium text-gray-700">
                  women in Indian cities have felt unsafe in a cab or ride-share
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">73%</div>
                <p className="text-sm font-medium text-gray-700">
                  of women riders check the driver photo matches before getting in
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">8 PM</div>
                <p className="text-sm font-medium text-gray-700">
                  the average time working women start worrying about their cab ride home
                </p>
              </div>
            </div>
          </section>

          {/* --- WHAT WE BUILT --- */}
          <section className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">What we built to keep you safe</h2>
            <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
              Every feature exists because of a real concern a real woman shared with us.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-pink-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  <div className="bg-pink-100 p-3 rounded-full mr-4">
                    <Video className="h-7 w-7 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-bold">Live Guard Mode</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  One tap turns on your camera and starts a private, encrypted video stream
                  your family can see in real time. If something feels off, they see it too.
                </p>
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Compass className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold">Live Trip Sharing</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Share a private link with your family. They watch the car move on the map
                  — pickup, route, and dropoff — without you having to keep texting "I'm fine."
                </p>
              </div>

              <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <Siren className="h-7 w-7 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold">Silent SOS</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Discreetly alert your emergency contacts, the police (112), and the women's
                  helpline (181) — with your live location, driver details, and a 10-second
                  video clip. The driver never knows you triggered it.
                </p>
              </div>

              <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  <div className="bg-orange-100 p-3 rounded-full mr-4">
                    <AlertCircle className="h-7 w-7 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold">AI Route Check</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  If the car goes 500m off the planned route, our AI asks if you're okay.
                  No response in 60 seconds and your emergency contacts are auto-alerted.
                </p>
              </div>
            </div>
          </section>

          {/* --- REAL PROTECTIONS --- */}
          <section className="mb-20 bg-black text-white rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">
              The real protections behind every ride
            </h2>
            <p className="text-center text-gray-300 mb-10 max-w-2xl mx-auto">
              The boring stuff that actually matters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Verified drivers only</h3>
                  <p className="text-sm text-gray-300">
                    Government ID, driving license, and address verification before the
                    first trip. Re-verified every 6 months.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">24/7 women's helpline</h3>
                  <p className="text-sm text-gray-300">
                    Our trained operators answer in &lt; 30 seconds, in 8 Indian languages.
                    Real humans, not bots.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">End-to-end encrypted video</h3>
                  <p className="text-sm text-gray-300">
                    Your Live Guard stream is encrypted in transit. Only the people you
                    share the link with can see it.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Auto-expire share links</h3>
                  <p className="text-sm text-gray-300">
                    Every tracking link auto-expires 24 hours after your ride ends.
                    Your location data doesn't live forever.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">No data sold, ever</h3>
                  <p className="text-sm text-gray-300">
                    Your pickup history, contacts, and ride patterns are never sold
                    to advertisers or third parties. That's a promise.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Late-night safety premium</h3>
                  <p className="text-sm text-gray-300">
                    A 1.2x surge between 10pm-6am goes directly to driver background
                    checks and the women's safety training program — not to us.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- A NOTE FROM THE FOUNDER --- */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-200 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-5xl md:text-6xl font-bold shadow-2xl shrink-0">
                  A
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">A note from Aayushi</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    I started Smart Security AI Cab after a ride home from college where the driver
                    took a "shortcut" through a road I didn't recognize. I was 19, alone,
                    and I had to make small talk for 12 minutes to stay calm.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    That feeling — of not being in control of your own ride — is what
                    this product is built to erase. Every feature you see came from a
                    conversation with another woman about a moment she felt unsafe.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Thank you for trusting us with your ride. We're not perfect, but we
                    are listening. 💛
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- FINAL CTA --- */}
          <section className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to ride safe?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your first ride is on us. No promo code, no fine print.
              Just a safer way home.
            </p>
            <button
              onClick={() => setMainView('ride')}
              className="bg-black text-white text-lg font-bold py-5 px-10 rounded-2xl hover:bg-gray-800 transition shadow-2xl hover:scale-105 transform"
            >
              Take a Safe Ride →
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Built with care in Ahmedabad, India 🇮🇳
            </p>
          </section>
        </main>
      )}

      {/* 📱 PHONE COMPATIBILITY CHECK - Real diagnostic on the user's device */}
      {mainView === 'compat' && (
        <main className="max-w-3xl mx-auto px-4 md:px-12 py-20 animate-in fade-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center bg-blue-50 border-2 border-blue-300 text-blue-700 font-bold px-4 py-2 rounded-full text-sm mb-6">
              📱 Compatibility Check
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Will Smart Security AI Cab work on your phone?</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Tap the button below — we'll run a real test on your device
              and tell you honestly whether live tracking, GPS, and camera
              will work for you.
            </p>
          </div>

          {!compatCheck && !compatRunning && (
            <div className="text-center mb-10">
              <button
                onClick={runCompatCheck}
                className="bg-blue-600 text-white text-xl font-bold py-5 px-10 rounded-2xl hover:bg-blue-700 transition shadow-2xl hover:scale-105 transform"
              >
                Run Compatibility Test
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Your camera may briefly turn on — we're just testing if it works.
              </p>
            </div>
          )}

          {compatRunning && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
              <p className="text-lg font-bold text-gray-700">Testing your device…</p>
              <p className="text-sm text-gray-500 mt-1">Checking GPS, camera, and network…</p>
            </div>
          )}

          {compatCheck && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">📱 Your device</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-bold uppercase">Browser</p>
                    <p className="font-bold text-gray-900">{compatCheck.browser}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-bold uppercase">Online</p>
                    <p className="font-bold text-gray-900">{compatCheck.online ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
                {compatCheck.isInAppBrowser && (
                  <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-sm text-yellow-900">
                    ⚠️ You're inside an in-app browser (Instagram, WhatsApp, Telegram, etc.).
                    For best experience, tap ⋮ and choose "Open in Browser".
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Feature checks</h2>
                <div className="space-y-2">
                  <div className={`flex items-start justify-between gap-3 p-3 border-2 rounded-xl ${compatCheck.geolocation ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{compatCheck.geolocation ? '✅' : '❌'} GPS location</p>
                      <p className="text-xs opacity-80">Used to show your car moving on the map</p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap capitalize">{compatCheck.geolocation ? 'supported' : 'not supported'}</span>
                  </div>
                  <div className={`flex items-start justify-between gap-3 p-3 border-2 rounded-xl ${compatCheck.cameraTest === 'granted' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-yellow-50 border-yellow-300 text-yellow-800'}`}>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{compatCheck.cameraTest === 'granted' ? '✅' : '⚠️'} Camera access</p>
                      <p className="text-xs opacity-80">Used for live video streaming to family — current: {compatCheck.cameraTest}</p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap capitalize">{compatCheck.cameraTest}</span>
                  </div>
                  <div className={`flex items-start justify-between gap-3 p-3 border-2 rounded-xl ${compatCheck.online ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{compatCheck.online ? '✅' : '❌'} Network connection</p>
                      <p className="text-xs opacity-80">Used for live GPS pings every 5 seconds</p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap capitalize">{compatCheck.online ? 'connected' : 'offline'}</span>
                  </div>
                  <div className={`flex items-start justify-between gap-3 p-3 border-2 rounded-xl ${compatCheck.localStorage ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{compatCheck.localStorage ? '✅' : '❌'} Local storage</p>
                      <p className="text-xs opacity-80">Used to remember your emergency contacts</p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap capitalize">{compatCheck.localStorage ? 'supported' : 'not supported'}</span>
                  </div>
                </div>
              </div>

              {/* Final verdict */}
              {(() => {
                const allGood = compatCheck.geolocation && compatCheck.cameraTest === 'granted' && compatCheck.online;
                if (allGood) {
                  return (
                    <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <h3 className="text-2xl font-bold text-green-800 mb-2">All systems go!</h3>
                      <p className="text-green-700">Your phone is fully compatible with Smart Security AI Cab. Live tracking, GPS, and video will all work great.</p>
                      <button onClick={() => setMainView('ride')} className="mt-4 bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition">
                        Book a ride →
                      </button>
                    </div>
                  );
                }
                if (compatCheck.geolocation && compatCheck.online) {
                  return (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-2">⚠️</div>
                      <h3 className="text-2xl font-bold text-yellow-800 mb-2">Partially compatible</h3>
                      <p className="text-yellow-700">Live tracking and GPS will work, but some features may be limited. Try allowing camera permission.</p>
                      <button onClick={runCompatCheck} className="mt-4 bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-yellow-700 transition">
                        🔄 Re-test
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">❌</div>
                      <h3 className="text-2xl font-bold text-red-800 mb-2">Not compatible</h3>
                      <p className="text-red-700">Your browser is missing key features. Please use a modern browser like Chrome, Edge, or Safari.</p>
                      <button onClick={runCompatCheck} className="mt-4 bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition">
                        🔄 Re-test
                      </button>
                      <button onClick={() => setMainView('ride')} className="mt-4 ml-2 bg-gray-200 text-black font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition">
                        Open anyway →
                      </button>
                      <p className="text-xs text-red-600 mt-3">Or call emergency: <a href="tel:112" className="font-bold underline">112</a> (Police) / <a href="tel:181" className="font-bold underline">181</a> (Women's Helpline)</p>
                    </div>
                  );
              })()}

              <div className="text-center">
                <button onClick={runCompatCheck} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  🔄 Re-run test
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm text-gray-600">
            <h3 className="font-bold text-gray-900 mb-2">📱 Tips for the best experience</h3>
            <ul className="space-y-1 list-disc pl-5">
              <li>Open Smart Security AI Cab in <strong>Safari</strong> (iPhone) or <strong>Chrome</strong> (Android), not in WhatsApp/Instagram</li>
              <li>Allow <strong>location</strong> and <strong>camera</strong> permissions when prompted</li>
              <li>Keep the <strong>app in the foreground</strong> for live video to work continuously</li>
              <li>Have a <strong>charger handy</strong> for long rides (camera + GPS use battery)</li>
              <li>Use <strong>Wi-Fi</strong> when possible to save data</li>
            </ul>
          </div>
        </main>
      )}

      {/* DEMO PANEL */}
      <div className="fixed bottom-6 right-4 z-[300] flex flex-col items-end">
        {isDemoPanelOpen ? (
          <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 w-64 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Mentor Controls</span>
              <button 
                onClick={() => setIsDemoPanelOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => { triggerBackendSOS(); setShowDeviationPopup(true); }} 
                className="w-full text-left text-sm font-bold bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg transition border border-yellow-200"
              >
                🟡 500m Deviation
              </button>
              <button 
                onClick={() => { triggerBackendSOS(); setShowGPSLostPopup(true); }} 
                className="w-full text-left text-sm font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg transition border border-orange-200"
              >
                📡 GPS Lost
              </button>
              <button 
                onClick={() => { triggerBackendSOS(); setShowSOSPopup(true); }} 
                className="w-full text-left text-sm font-bold bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition border border-red-200"
              >
                🚨 Police / SOS
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsDemoPanelOpen(true)} 
            className="bg-black text-white p-3 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition border-2 border-white/20"
            title="Open Demo Panel"
          >
            <Settings className="h-6 w-6 text-green-400" />
          </button>
        )}
      </div>

      {/* 🚗 DRIVER APPLICATION MODAL — "Apply to drive" */}
      {showDriverForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[450] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab" className="h-8 w-8 rounded-lg object-cover" />
                <h3 className="text-lg font-extrabold text-slate-900">Driver Application</h3>
              </div>
              <button
                onClick={closeAllForms}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {!formSubmitted ? (
              <div className="px-6 py-5">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                  <div className={`h-2 flex-1 rounded-full ${formStep >= 1 ? 'bg-slate-900' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${formStep >= 2 ? 'bg-slate-900' : 'bg-gray-200'}`}></div>
                  <span className="text-xs font-bold text-slate-400 w-16 text-right">{formStep}/2</span>
                </div>

                {formStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Your details</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full name *</label>
                      <input name="fullName" value={driverForm.fullName} onChange={handleDriverFormChange}
                        placeholder="e.g. Rohan Patel"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Phone number *</label>
                      <input name="phone" value={driverForm.phone} onChange={handleDriverFormChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email (optional)</label>
                      <input name="email" type="email" value={driverForm.email} onChange={handleDriverFormChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">City *</label>
                      <input name="city" value={driverForm.city} onChange={handleDriverFormChange}
                        placeholder="e.g. Ahmedabad"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Vehicle & driving licence</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle type *</label>
                      <select name="vehicleType" value={driverForm.vehicleType} onChange={handleDriverFormChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                        <option value="SmartMini">SmartMini</option>
                        <option value="SmartSedan">SmartSedan</option>
                        <option value="SmartSUV">SmartSUV</option>
                        <option value="SmartBike">SmartBike</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Driving licence number *</label>
                      <input name="licenseNumber" value={driverForm.licenseNumber} onChange={handleDriverFormChange}
                        placeholder="e.g. GJ01-2023-1122334"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none uppercase" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Driving experience (years)</label>
                      <input name="experienceYears" type="number" min="0" value={driverForm.experienceYears} onChange={handleDriverFormChange}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <label className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 cursor-pointer">
                      <input name="ownVehicle" type="checkbox" checked={driverForm.ownVehicle} onChange={handleDriverFormChange}
                        className="h-4 w-4 accent-amber-500" />
                      <span className="text-sm font-semibold text-slate-700">I own the vehicle I'll drive</span>
                    </label>
                    <label className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3 cursor-pointer">
                      <input name="agreeTerms" type="checkbox" checked={driverForm.agreeTerms} onChange={handleDriverFormChange}
                        className="h-4 w-4 accent-amber-500 mt-0.5" />
                      <span className="text-sm text-slate-600">
                        I agree to the <strong>Driver Terms</strong> and understand my licence & documents will be verified before onboarding.
                      </span>
                    </label>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Police verification number (optional)</label>
                      <input name="policeVerificationNumber" value={driverForm.policeVerificationNumber} onChange={handleDriverFormChange}
                        placeholder="e.g. PC-2026-778899"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <label className="flex items-start gap-3 border-2 border-red-200 bg-red-50 rounded-xl px-4 py-3 cursor-pointer">
                      <input name="criminalRecordDeclaration" type="checkbox" checked={driverForm.criminalRecordDeclaration} onChange={handleDriverFormChange}
                        className="h-4 w-4 accent-red-600 mt-0.5" />
                      <span className="text-sm text-slate-700">
                        🛡️ <strong>Safety declaration:</strong> I confirm I have <strong>no criminal record</strong> and I will
                        upload my <strong>police-clearance certificate</strong> next. Drivers with unresolved records are not selected.
                      </span>
                    </label>
                  </div>
                )}

                {driverSubmitError && (
                  <p className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    ⚠️ {driverSubmitError}
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  {formStep === 2 && (
                    <button onClick={() => setFormStep(1)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition">
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleDriverFormNext}
                    disabled={driverSubmitLoading}
                    className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {driverSubmitLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {driverSubmitLoading ? 'Submitting…' : formStep === 1 ? 'Continue →' : 'Submit application'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <img src="/assets/security-cab-icon.png" alt="" className="h-16 w-16 rounded-2xl mx-auto mb-4 object-cover" />
                <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
                  <CheckCircle2 className="h-4 w-4" /> APPLICATION SUBMITTED
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Thanks, {driverApplicationResult?.fullName || 'Driver'}! 🎉</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Your application reference: <strong className="font-mono text-slate-800">{driverApplicationResult?.reference}</strong>
                </p>
                <div className="bg-slate-50 rounded-2xl p-4 text-left text-sm text-slate-600 space-y-2 mb-5">
                  <div className="font-bold text-slate-700 mb-1">What happens next</div>
                  {driverApplicationResult?.nextSteps?.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                {/* 🛡️ STEP 2 — upload verification documents (licence / vehicle / police) */}
                <div className="bg-slate-50 rounded-2xl p-4 text-left mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-extrabold text-slate-800">Step 2 · Upload verification documents</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">JPG / PNG / PDF, max 12 MB. Stored securely and reviewed before approval.</p>
                  <div className="space-y-2.5">
                    {[
                      { key: 'licence', label: '📄 Driving licence photo', field: 'licencePhoto' },
                      { key: 'vehicle', label: '🚗 Vehicle photo / RC', field: 'vehiclePhoto' },
                      { key: 'police_certificate', label: '🛡️ Police clearance certificate', field: 'policeCertificate' },
                    ].map((d) => (
                      <div key={d.key} className="flex items-center gap-2">
                        <label className="flex-1 text-xs font-semibold text-slate-600">{d.label}</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => setDriverDocs((prev) => ({ ...prev, [d.key]: e.target.files?.[0] || null }))}
                          className="text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700 file:shadow-sm hover:file:bg-slate-100"
                        />
                        <button
                          onClick={() => uploadDriverDocument(d.key)}
                          disabled={driverDocsBusy === d.key || !driverDocs[d.key]}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50"
                        >
                          {driverDocsStatus[d.key] === 'uploaded' ? '✓ Uploaded' : driverDocsBusy === d.key ? '…' : 'Upload'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {driverDocsMessage && (
                    <p className={`mt-3 text-xs font-semibold ${driverDocsMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
                      {driverDocsMessage}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={closeAllForms} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">
                    Done
                  </button>
                  <button
                    onClick={checkDriverApplicationStatus}
                    disabled={driverStatusLoading}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {driverStatusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {driverStatusLoading ? 'Checking…' : 'Check status'}
                  </button>
                </div>
                {driverAppStatus && (
                  <p className="mt-4 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl px-4 py-3">
                    Status: <span className="text-green-700">{driverAppStatus}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default BookRide;
