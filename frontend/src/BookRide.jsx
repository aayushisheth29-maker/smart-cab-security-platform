import StartModal from './components/StartModal';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield,
  User, Phone, Mail, Building, CheckCircle, ArrowLeft, Loader2,
  CreditCard, Users, Plane, Box, AlertCircle, PhoneCall, Siren, Plus,
  Lock, Settings, History, LogOut
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- CUSTOM MAP ICONS ---
const pickupIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: black; color: white; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); text-align: center; width: max-content;">Pickup</div>`,
  iconAnchor: [30, 15]
});

const dropoffIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #16a34a; color: white; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); text-align: center; width: max-content;">Dropoff</div>`,
  iconAnchor: [30, 15]
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
  return null;
};

const BookRide = () => {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  
  const [activeTab, setActiveTab] = useState('request');
  // mainView now supports: 'ride', 'drive', 'business', 'about', 'login', 'signup', 'dashboard'
  const [mainView, setMainView] = useState('ride'); 
  const [dashTab, setDashTab] = useState('history'); // For dashboard sub-tabs
  
  const [parcelMode, setParcelMode] = useState('send');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [pickupTime, setPickupTime] = useState('Pick up now');
  const [showForWhoDropdown, setShowForWhoDropdown] = useState(false);
  const [forWho, setForWho] = useState('For me');

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [driverData, setDriverData] = useState({ name: '', phone: '', city: '', carModel: '' });
  const [businessData, setBusinessData] = useState({ company: '', email: '', employees: '' });

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [showPrices, setShowPrices] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [selectedCar, setSelectedCar] = useState('SmartMini');
  
  const [rideProgress, setRideProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); 
  const [mapZoom, setMapZoom] = useState(5);
  
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  const [showSOSPopup, setShowSOSPopup] = useState(false);
  const [showDeviationPopup, setShowDeviationPopup] = useState(false);

  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Mom', phone: '+919876543210' },
    { name: 'Dad', phone: '+919876543211' }
  ]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = () => {
    if(newContactName && newContactPhone) {
      setEmergencyContacts([...emergencyContacts, { name: newContactName, phone: newContactPhone }]);
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContactModal(false);
    }
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
    if (rideConfirmed && rideProgress < 100 && !showDeviationPopup) {
      const timer = setInterval(() => {
        setRideProgress((prev) => {
          const next = prev + 1;
          return next > 100 ? 100 : next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rideConfirmed, rideProgress, showDeviationPopup]);

  const geocodeLocation = async (address) => {
    try {
      const searchQuery = encodeURIComponent(address + ", India"); 
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleConfirmRide = async () => {
    setIsSearching(true);
    const pCoords = await geocodeLocation(pickup);
    const dCoords = await geocodeLocation(dropoff);
    setIsSearching(false);

    if (pCoords && dCoords) {
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
    setMapCenter([20.5937, 78.9629]); 
    setMapZoom(5);
    setShowSOSPopup(false);
    setShowDeviationPopup(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative">
      <style>{`
        body { top: 0 !important; position: static !important; }
        .skiptranslate { display: none !important; }
        .goog-te-banner-frame { display: none !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* --- ADD NEW CONTACT MODAL --- */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[350] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowAddContactModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Add Contact</h3>
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Name (e.g., Friend, Roommate)" value={newContactName} onChange={e => setNewContactName(e.target.value)} className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium" />
              <input type="tel" placeholder="Phone Number" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="w-full bg-gray-100 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium" />
            </div>
            <button onClick={handleAddContact} disabled={!newContactName || !newContactPhone} className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition">Save Contact</button>
          </div>
        </div>
      )}

      {/* --- SOS EMERGENCY POPUP --- */}
      {showSOSPopup && (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-200">
          <Siren className="h-32 w-32 text-white animate-pulse mb-6" />
          <h2 className="text-white text-5xl font-bold mb-4 text-center">EMERGENCY SOS</h2>
          <p className="text-red-100 text-xl text-center max-w-lg mb-12">Your live location and dashcam feed have been sent to the SmartCab Security Center. Do you need immediate police assistance?</p>
          <div className="flex flex-col w-full max-w-md gap-4">
            {/* 🚨 TEST NUMBER UPDATED HERE 🚨 */}
            <a href="tel:112" className="w-full bg-white text-red-600 font-bold text-2xl py-5 rounded-2xl shadow-2xl hover:bg-gray-100 flex justify-center items-center"><PhoneCall className="mr-3 h-8 w-8" /> Call Police (112)</a>
            <button onClick={() => setShowSOSPopup(false)} className="w-full bg-transparent border-2 border-white/50 text-white font-bold text-xl py-5 rounded-2xl hover:bg-white/10 transition">Cancel - I am safe</button>
          </div>
        </div>
      )}

      {/* --- ROUTE DEVIATION POPUP --- */}
      {showDeviationPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-yellow-400 h-2 animate-pulse"></div>
            <AlertCircle className="h-20 w-20 text-yellow-500 mb-6 mx-auto" />
            <h2 className="text-3xl font-bold text-center mb-4">Route Deviation Detected</h2>
            <p className="text-gray-600 text-center text-lg mb-8">Our AI detects your car has gone 500m off the GPS route. Are you okay? If you do not respond in 60 seconds, we will alert your emergency contacts.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowDeviationPopup(false)} className="w-full bg-green-500 text-white font-bold text-xl py-4 rounded-xl hover:bg-green-600 shadow-lg">Yes, I am fine</button>
              <button onClick={() => { setShowDeviationPopup(false); setShowSOSPopup(true); }} className="w-full bg-red-600 text-white font-bold text-xl py-4 rounded-xl hover:bg-red-700 shadow-lg flex justify-center items-center"><Siren className="h-6 w-6 mr-2" /> No, trigger SOS</button>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE MODAL */}
      {isLangModalOpen && (
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto animate-in fade-in duration-200">
          <div className="p-6 md:p-12 max-w-6xl mx-auto relative min-h-screen">
            <button onClick={() => setIsLangModalOpen(false)} className="absolute top-6 right-6 md:top-8 md:right-8 p-3 hover:bg-gray-100 rounded-full text-black transition"><X className="h-8 w-8" strokeWidth={2.5} /></button>
            <div className="mt-20 md:mt-32">
              <h2 className="text-4xl md:text-5xl font-bold mb-16 notranslate">Select your preferred language</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
                {[
                  { eng: 'Bangla', native: 'বাংলা', code: 'bn' },
                  { eng: 'English', native: 'English', code: 'en' },
                  { eng: 'Hindi', native: 'हिन्दी', code: 'hi' },
                  { eng: 'Kannada', native: 'ಕನ್ನಡ', code: 'kn' },
                  { eng: 'Marathi', native: 'मराठी', code: 'mr' },
                  { eng: 'Tamil', native: 'தமிழ்', code: 'ta' },
                  { eng: 'Telugu', native: 'తెలుగు', code: 'te' },
                  { eng: 'Urdu', native: 'اردو', code: 'ur' }
                ].map((lang, idx) => (
                  <button key={idx} onClick={() => handleLanguageChange(lang.code)} className="text-left text-lg text-gray-900 font-medium hover:text-gray-500 transition notranslate">{lang.eng}, {lang.native}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="bg-black text-white flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {setMainView('ride'); resetRide();}}>
            <ShieldCheck className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold tracking-tight notranslate">SmartCab</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-6 font-medium text-sm">
            <button onClick={() => {setMainView('ride'); resetRide();}} className={`px-3 py-2 rounded-full transition ${mainView === 'ride' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Ride</button>
            <button onClick={() => setMainView('drive')} className={`px-3 py-2 rounded-full transition ${mainView === 'drive' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Drive</button>
            <button onClick={() => setMainView('business')} className={`px-3 py-2 rounded-full transition ${mainView === 'business' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Business</button>
            <button onClick={() => setMainView('about')} className={`px-3 py-2 rounded-full transition ${mainView === 'about' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>About</button>
            {/* NEW: DASHBOARD LINK */}
            <button onClick={() => setMainView('dashboard')} className={`px-3 py-2 rounded-full transition flex items-center ${mainView === 'dashboard' ? 'bg-gray-800 text-green-400' : 'hover:bg-gray-800 text-yellow-400'}`}>Dashboard <span className="ml-1 text-[10px] bg-red-600 px-1.5 rounded-full text-white">New</span></button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-6 font-medium text-sm w-full md:w-auto">
          <button onClick={() => setIsLangModalOpen(true)} className="flex items-center hover:bg-gray-800 px-3 py-2 rounded-full"><Globe className="h-4 w-4 mr-2" /> EN</button>
          
          <button onClick={() => setMainView('login')} className="hover:bg-gray-800 px-3 py-2 rounded-full">Log in</button>
          <button onClick={() => setMainView('signup')} className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200">Sign up</button>
        </div>
      </nav>

      {/* 🔐 LOGIN PAGE */}
      {mainView === 'login' && (
        <main className="max-w-md mx-auto px-4 py-24 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold mb-8 text-center">Welcome back</h1>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl px-4 py-4"><input type="email" placeholder="Email or Phone Number" className="w-full bg-transparent outline-none text-lg font-medium" /></div>
            <div className="bg-gray-100 rounded-xl px-4 py-4 flex items-center"><input type="password" placeholder="Password" className="w-full bg-transparent outline-none text-lg font-medium" /><Lock className="h-5 w-5 text-gray-400"/></div>
            <button onClick={() => setMainView('dashboard')} className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 transition shadow-lg mt-4">Sign In</button>
          </div>
          <p className="text-center mt-6 text-gray-600 font-medium cursor-pointer hover:underline">Forgot password?</p>
          <p className="text-center mt-4 text-gray-600">Don't have an account? <span onClick={() => setMainView('signup')} className="text-black font-bold cursor-pointer hover:underline">Sign up</span></p>
        </main>
      )}

      {/* 📝 REGISTER PAGE */}
      {mainView === 'signup' && (
        <main className="max-w-md mx-auto px-4 py-16 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-center text-gray-600 mb-8 font-medium">Join SmartCab Security today.</p>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl px-4 py-4"><input type="text" placeholder="Full Name" className="w-full bg-transparent outline-none text-lg font-medium" /></div>
            <div className="bg-gray-100 rounded-xl px-4 py-4"><input type="email" placeholder="Email Address" className="w-full bg-transparent outline-none text-lg font-medium" /></div>
            <div className="bg-gray-100 rounded-xl px-4 py-4"><input type="tel" placeholder="Phone Number" className="w-full bg-transparent outline-none text-lg font-medium" /></div>
            <div className="bg-gray-100 rounded-xl px-4 py-4"><input type="password" placeholder="Create Password" className="w-full bg-transparent outline-none text-lg font-medium" /></div>
            <button onClick={() => setMainView('dashboard')} className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 transition shadow-lg mt-4">Register & Continue</button>
          </div>
        </main>
      )}

      {/* 👤 PASSENGER DASHBOARD PAGE */}
      {mainView === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-4 md:px-12 py-12 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="flex items-center space-x-4 mb-8">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-black"><User className="h-8 w-8 text-gray-500"/></div>
              <div><h2 className="text-xl font-bold">Aayushi S.</h2><p className="text-sm text-green-600 font-bold">Verified Rider</p></div>
            </div>
            <div className="space-y-2">
              <button onClick={() => setDashTab('history')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'history' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}><History className="h-5 w-5 mr-3"/> Ride History</button>
              <button onClick={() => setDashTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}><User className="h-5 w-5 mr-3"/> Profile</button>
              <button onClick={() => setDashTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center transition ${dashTab === 'settings' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Settings className="h-5 w-5 mr-3"/> Settings</button>
              <button onClick={() => setMainView('login')} className="w-full text-left px-4 py-3 rounded-xl font-bold flex items-center text-red-600 hover:bg-red-50 mt-4 transition"><LogOut className="h-5 w-5 mr-3"/> Log Out</button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
            {/* History Tab */}
            {dashTab === 'history' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Recent Rides</h2>
                <div className="space-y-4">
                  {[
                    { date: 'Yesterday, 4:30 PM', car: 'SmartMini', status: 'Completed', price: '₹240', route: 'Delhi → Gurgaon' },
                    { date: 'July 28, 9:15 AM', car: 'SmartSedan', status: 'Completed', price: '₹450', route: 'Airport → Home' },
                    { date: 'July 20, 8:00 PM', car: 'SmartSUV', status: 'Canceled', price: '₹0', route: 'Office → City Center' }
                  ].map((ride, i) => (
                    <div key={i} className="border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center hover:shadow-md transition">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="bg-gray-100 p-3 rounded-full"><Car className="h-6 w-6 text-gray-700"/></div>
                        <div>
                          <p className="font-bold text-lg">{ride.route}</p>
                          <p className="text-sm text-gray-500">{ride.date} • {ride.car}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">{ride.price}</p>
                        <p className={`text-sm font-bold ${ride.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>{ride.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {dashTab === 'profile' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Profile Details</h2>
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-sm font-bold text-gray-500">Full Name</label><input type="text" value="Aayushi S." disabled className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-700" /></div>
                    <div><label className="text-sm font-bold text-gray-500">Email</label><input type="email" value="aayushi@example.com" disabled className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-700" /></div>
                    <div><label className="text-sm font-bold text-gray-500">Phone</label><input type="tel" value="+91 98765 43210" disabled className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold text-gray-700" /></div>
                    <div><label className="text-sm font-bold text-gray-500">Home Address</label><input type="text" placeholder="Add Home Address" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mt-1 font-bold" /></div>
                  </div>
                  <button className="mt-8 bg-black text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition">Edit Profile</button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {dashTab === 'settings' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Security & Settings</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div><h3 className="font-bold text-lg">AI Deviation Alerts</h3><p className="text-sm text-gray-500">Get notified if your driver goes off route</p></div>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div></div>
                  </div>
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div><h3 className="font-bold text-lg">Share Trip with Contacts</h3><p className="text-sm text-gray-500">Automatically share live link when trip starts</p></div>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div></div>
                  </div>
                  <div className="flex justify-between items-center p-6 border border-gray-200 rounded-2xl">
                    <div><h3 className="font-bold text-lg">Marketing Emails</h3><p className="text-sm text-gray-500">Receive offers and discounts</p></div>
                    <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* 🟢 RIDE PAGE (Includes Ride tracking, Parcel, Rentals) */}
      {mainView === 'ride' && (
        <div className="animate-in fade-in duration-500">
          
          <div className="border-b flex flex-col md:flex-row items-center px-4 md:px-12 pt-3 justify-between gap-2 overflow-hidden">
            <h2 className="text-2xl font-bold pb-1 md:pb-3 shrink-0">Ride</h2>
            <div className="flex overflow-x-auto w-full space-x-6 text-sm font-medium text-gray-500 pb-2 hide-scrollbar">
              <button onClick={() => {setActiveTab('request'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'request' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Request a ride</button>
              <button onClick={() => {setActiveTab('reserve'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'reserve' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Reserve a ride</button>
              <button onClick={() => {setActiveTab('parcel'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'parcel' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Parcel</button>
              <button onClick={() => {setActiveTab('rentals'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'rentals' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Rentals</button>
              <button onClick={handleExploreClick} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'explore' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Explore options</button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 flex flex-col md:flex-row gap-12 items-start">
            {/* LEFT COLUMN: THE FORMS */}
            <div className="w-full md:w-1/2 flex flex-col relative min-h-[500px]">
              
                            {/* --- 📦 PARCEL VIEW --- */}
              {activeTab === 'parcel' && (
                <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                  <div className="w-full h-40 bg-orange-100 rounded-t-2xl overflow-hidden mb-6 relative">
                    <img src="https://images.unsplash.com/photo-1617500585800-47b220b396b2?auto=format&fit=crop&q=80&w=800" alt="Courier" className="w-full h-full object-cover" />
                  </div>
                  <h1 className="text-4xl font-bold mb-3">Courier</h1>
                  <p className="text-gray-600 mb-6 text-lg">Have a courier deliver something for you. Get packages delivered in the time it takes to drive there.</p>
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <button onClick={() => setParcelMode('send')} className={`flex-1 py-3 text-lg font-bold rounded-lg transition-all ${parcelMode === 'send' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:text-black'}`}>Send</button>
                    <button onClick={() => setParcelMode('receive')} className={`flex-1 py-3 text-lg font-bold rounded-lg transition-all ${parcelMode === 'receive' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:text-black'}`}>Receive</button>
                  </div>
                  <div className="relative flex flex-col space-y-3 w-full mb-8">
                    <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-black">
                      <div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div>
                      <input type="text" placeholder="Choose sender's location" value={pickup} onChange={(e)=>setPickup(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>
                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-black">
                      <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
                      <input type="text" placeholder="Choose recipient's location" value={dropoff} onChange={(e)=>setDropoff(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>
                  </div>
                  <button onClick={() => setShowPrices(true)} disabled={!pickup || !dropoff} className={`text-white text-lg font-bold py-4 px-6 rounded-lg w-full mt-auto transition ${(!pickup || !dropoff) ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 shadow-lg'}`}>Search</button>
                </div>
              )}
                                   {/* --- 🚗 RENTALS VIEW --- */}
              {activeTab === 'rentals' && (
                <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                  <h1 className="text-4xl font-bold mb-8 mt-4">Find a trip</h1>
                  <div className="relative flex flex-col space-y-3 w-full mb-6">
                    <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-black">
                      <div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div>
                      <input type="text" placeholder="Pick-up location" value={pickup} onChange={(e)=>setPickup(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>
                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-black">
                      <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
                      <input type="text" placeholder="Drop-off location" value={dropoff} onChange={(e)=>setDropoff(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>
                  </div>
                  <div className="relative mb-3">
                    <div onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowForWhoDropdown(false); }} className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-4 hover:bg-gray-200 cursor-pointer transition">
                      <div className="flex items-center"><Clock className="h-5 w-5 text-black mr-4" /><span className="text-lg font-medium">{pickupTime}</span></div>
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                    {showTimeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <button onClick={() => { setPickupTime('Pick up now'); setShowTimeDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-lg font-medium transition">Pick up now</button>
                        <button onClick={() => { setPickupTime('Schedule for later'); setShowTimeDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-50 text-lg font-medium transition">Schedule for later</button>
                      </div>
                    )}
                  </div>
                  <div className="relative mb-8 w-max">
                    <div onClick={() => { setShowForWhoDropdown(!showForWhoDropdown); setShowTimeDropdown(false); }} className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-4 hover:bg-gray-200 cursor-pointer transition pr-6">
                      <div className="flex items-center"><User className="h-5 w-5 text-black mr-4" /><span className="text-lg font-medium">{forWho}</span></div>
                      <ChevronDown className="h-5 w-5 text-gray-500 ml-4" />
                    </div>
                    {showForWhoDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <button onClick={() => { setForWho('For me'); setShowForWhoDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 text-lg font-medium transition">For me</button>
                        <button onClick={() => { setForWho('For a guest'); setShowForWhoDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-50 text-lg font-medium transition">For a guest</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowPrices(true)} disabled={!pickup || !dropoff} className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full mt-auto hover:bg-gray-800 transition disabled:bg-gray-300">Search</button>
                </div>
              )}

            
              {/* --- STANDARD RIDE VIEWS (Request, Prices, etc) --- */}
              {['request', 'reserve', 'prices', 'explore'].includes(activeTab) && (
                <>
                  {rideConfirmed ? (
                    // 🚨 LIVE SECURITY DASHBOARD 🚨
                    <div className="w-full h-[600px] flex flex-col animate-in fade-in duration-500">
                      <h2 className="text-3xl font-bold mb-4 flex items-center"><ShieldCheck className="text-green-600 mr-2 h-8 w-8"/> Trip Monitoring</h2>
                      
                      <div className="w-full flex-1 bg-gray-100 rounded-3xl overflow-hidden shadow-2xl relative border border-gray-200 mb-4">
                        <div className="absolute inset-0 z-0">
                          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapUpdater center={mapCenter} zoom={mapZoom} />
                            {pickupCoords && <Marker position={pickupCoords} icon={pickupIcon} />}
                            {dropoffCoords && <Marker position={dropoffCoords} icon={dropoffIcon} />}
                            {pickupCoords && dropoffCoords && <Marker position={[currentCarLat, currentCarLng]} icon={carIcon} />}
                          </MapContainer>
                        </div>

                        <button 
                          onClick={() => setShowSOSPopup(true)}
                          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20 flex items-center text-xl animate-pulse transition transform hover:scale-105"
                        >
                          <Siren className="mr-2 h-6 w-6" /> SOS
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 z-10">
                          <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-900">Driver Rahul S. ({selectedCar})</h2>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">On Route</span>
                          </div>
                          
                          <div className="w-full bg-blue-100 rounded-full h-3 mb-2 overflow-hidden mt-4">
                            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${rideProgress}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500 font-medium mb-4">
                            <span>{pickup}</span>
                            <span className="font-bold text-green-600">{rideProgress === 100 ? 'Arrived!' : `${Math.round(rideProgress)}%`}</span>
                            <span>{dropoff}</span>
                          </div>
                          
                          {/* 🟢 CLICKABLE AND ADDABLE EMERGENCY CONTACTS 🟢 */}
                          <div className="border-t border-gray-200 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-sm font-bold text-gray-700">Emergency Contacts</p>
                              <button 
                                onClick={() => setShowAddContactModal(true)} 
                                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center transition"
                              >
                                <Plus className="h-3 w-3 mr-1"/> Add New
                              </button>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                              {emergencyContacts.map((contact, idx) => (
                                <a 
                                  key={idx} 
                                  href={`tel:${contact.phone}`} 
                                  className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center w-max hover:bg-gray-200 hover:shadow-sm transition border border-transparent hover:border-gray-300 shrink-0"
                                >
                                  <PhoneCall className="h-4 w-4 mr-2 text-green-600"/> {contact.name}
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            {rideProgress === 100 ? (
                              <button onClick={resetRide} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition">Book Again</button>
                            ) : (
                              <>
                                <button onClick={() => setShowDeviationPopup(true)} className="w-1/2 bg-yellow-100 text-yellow-800 font-bold py-3 rounded-xl hover:bg-yellow-200 transition border border-yellow-300">
                                  Test Route Warning
                                </button>
                                <button onClick={resetRide} className="w-1/2 bg-gray-200 text-black font-bold py-3 rounded-xl hover:bg-gray-300 transition">Cancel Ride</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  ) : showPrices ? (
                    <div className="animate-in slide-in-from-right-8 duration-300 w-full max-w-md h-full flex flex-col">
                      <div className="shrink-0">
                        <button onClick={() => setShowPrices(false)} className="flex items-center text-blue-600 font-medium hover:underline mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back to locations</button>
                        <h2 className="text-3xl font-bold mb-4">Choose your ride</h2>
                      </div>
                      <div className="overflow-y-auto flex-1 pr-2 space-y-3 mb-4">
                        <div onClick={() => setSelectedCar('SmartMini')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartMini' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}><div className="flex items-center space-x-4"><Car className="h-8 w-8 text-gray-700" /><div><h3 className="font-bold text-lg notranslate">SmartMini</h3><p className="text-xs text-green-600 font-medium flex items-center mt-1"><ShieldCheck className="h-3 w-3 mr-1"/> SOS Active</p></div></div><div className="text-xl font-bold">₹240</div></div>
                        <div onClick={() => setSelectedCar('SmartSedan')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSedan' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}><div className="flex items-center space-x-4"><Car className="h-10 w-10 text-gray-900" /><div><h3 className="font-bold text-lg notranslate">SmartSedan</h3><p className="text-xs text-blue-600 font-medium flex items-center mt-1"><Shield className="h-3 w-3 mr-1"/> Top Rated Driver</p></div></div><div className="text-xl font-bold">₹320</div></div>
                        <div onClick={() => setSelectedCar('SmartSUV')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSUV' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}><div className="flex items-center space-x-4"><Car className="h-12 w-12 text-black" /><div><h3 className="font-bold text-lg notranslate">SmartSUV</h3><p className="text-xs text-purple-600 font-medium flex items-center mt-1"><User className="h-3 w-3 mr-1"/> 6 Seats</p></div></div><div className="text-xl font-bold">₹450</div></div>
                      </div>
                      <div className="shrink-0 pt-2 border-t border-gray-100">
                        <button onClick={handleConfirmRide} disabled={isSearching} className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg flex justify-center items-center disabled:bg-gray-400">{isSearching ? <><Loader2 className="animate-spin mr-2 h-5 w-5"/> Locating...</> : `Confirm ${selectedCar}`}</button>
                      </div>
                    </div>

                  ) : (
                    <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                      <div className="flex items-center space-x-2 text-gray-700 mb-8 font-medium"><MapPin className="h-5 w-5 text-black" /><span>Current Location (GPS Active)</span></div>
                      <h1 className="text-5xl font-bold mb-8 transition-all">{activeTab === 'request' && "Request a secure ride"}{activeTab === 'reserve' && "Reserve a ride in advance"}{activeTab === 'explore' && "Explore your options"}</h1>
                      <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 w-max px-4 py-3 rounded-full font-medium mb-6 transition"><Clock className="h-5 w-5" /><span>{activeTab === 'reserve' ? 'Schedule for later' : 'Pickup now'}</span><ChevronDown className="h-5 w-5" /></button>
                      <div className="relative flex flex-col space-y-3 w-full">
                        <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                        <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black"><div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div><input type="text" placeholder="Pickup (e.g., Delhi, Bangalore)" value={pickup} onChange={(e)=>setPickup(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" /><Navigation className="h-5 w-5 text-gray-500 ml-2" /></div>
                        <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black"><Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" /><input type="text" placeholder="Dropoff (e.g., Mumbai, Goa)" value={dropoff} onChange={(e)=>setDropoff(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" /></div>
                      </div>
                      <div className="mt-auto pt-8">
                        <button onClick={() => setShowPrices(true)} disabled={!pickup || !dropoff} className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 hover:scale-[1.02] transform">Search route & see prices</button>
                        {(!pickup || !dropoff) && <p className="text-xs text-gray-400 mt-2 text-center">Please enter pickup and dropoff to search</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT COLUMN: The Map */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0 h-[500px]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
                   <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                   </MapContainer>
                </div>
                {!rideConfirmed && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 flex items-end p-8">
                    <h3 className="text-white text-3xl font-bold w-3/4">Travel safely anywhere in India.</h3>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold text-green-700 shadow z-20">
                  <ShieldCheck className="h-4 w-4" />
                  <span>AI Security Active</span>
                </div>
              </div>
            </div>
          </main>

          {/* EXPLORE SECTION */}
          <section id="explore-section" className="max-w-7xl mx-auto px-4 md:px-12 py-16">
            <h2 className="text-3xl font-bold mb-8">Explore what you can do with SmartCab</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleFeatureCardClick('request')}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Ride</h3><p className="text-sm text-gray-600 mb-6">Go anywhere with full GPS tracking. Request a ride, hop in, and go safely.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Car className="h-20 w-20 text-gray-700 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleFeatureCardClick('reserve')}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Reserve</h3><p className="text-sm text-gray-600 mb-6">Reserve your secure ride in advance. Pre-vetted drivers assigned for safety.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Calendar className="h-20 w-20 text-blue-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => setSelectedCard({ title: 'Intercity Travel', description: 'Comfortable outstation cabs for long-distance travel. All intercity vehicles undergo a 24-point maintenance check before dispatch and feature physical SOS panic buttons installed in the rear passenger seats.' })}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Intercity</h3><p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route alerts.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Map className="h-20 w-20 text-green-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleFeatureCardClick('parcel')}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Parcel</h3><p className="text-sm text-gray-600 mb-6">SmartCab makes same-day item delivery easier and safer than ever.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Package className="h-20 w-20 text-amber-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleFeatureCardClick('rentals')}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Rentals</h3><p className="text-sm text-gray-600 mb-6">Request a trip for a block of time and make multiple stops easily.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Clock className="h-20 w-20 text-purple-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
              <div className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" onClick={() => setSelectedCard({ title: 'SmartBike', description: 'Beat the traffic with our fast and affordable motorcycle rides. We enforce a strict helmet-verification protocol—the ride cannot start until the driver uploads a selfie wearing their helmet.' })}><div className="flex flex-col h-full justify-between pr-4"><div><h3 className="text-xl font-bold mb-2">Bike</h3><p className="text-sm text-gray-600 mb-6">Get affordable, quick motorbike rides in minutes at your doorstep.</p></div><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button></div><Bike className="h-20 w-20 text-red-500 drop-shadow-md group-hover:scale-110 transition-transform duration-300" /></div>
            </div>
          </section>

          {/* --- PLAN FOR LATER SECTION --- */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-12">
            <div className="flex flex-col lg:flex-row bg-[#e2f1f8] rounded-2xl overflow-hidden relative">
              <div className="w-full lg:w-1/2 p-8 md:p-12 z-10 flex flex-col justify-center">
                <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-gray-900">Get your ride right<br/>with SmartCab Reserve</h3>
                <p className="font-bold mb-2">Choose date and time</p>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3 shadow-sm border border-gray-200 focus-within:ring-2 ring-black"><Calendar className="h-5 w-5 mr-3 text-gray-600" /><input type="date" className="outline-none w-full bg-transparent text-gray-800" /></div>
                  <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3 shadow-sm border border-gray-200 focus-within:ring-2 ring-black"><Clock className="h-5 w-5 mr-3 text-gray-600" /><input type="time" className="outline-none w-full bg-transparent text-gray-800" /></div>
                </div>
                <button onClick={() => setSelectedCard({ title: 'Reservation Confirmed', description: 'Your ride has been scheduled! We will assign a top-rated driver 24 hours before your pickup time and notify you via SMS.' })} className="bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg w-full md:w-max px-12">Next</button>
              </div>
              <div className="w-full lg:w-1/2 p-8 md:p-12 flex items-center justify-center lg:justify-end relative">
                <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full z-10 border border-gray-100">
                  <h4 className="text-2xl font-bold mb-6">Benefits</h4>
                  <div className="space-y-6">
                    <div className="flex items-start"><CalendarDays className="h-6 w-6 mr-4 text-black shrink-0 mt-1" /><p className="text-gray-700">Choose your exact pickup time up to 90 days in advance.</p></div>
                    <div className="flex items-start"><Clock className="h-6 w-6 mr-4 text-black shrink-0 mt-1" /><p className="text-gray-700">Extra wait time included to meet your ride.</p></div>
                    <div className="flex items-start"><CreditCard className="h-6 w-6 mr-4 text-black shrink-0 mt-1" /><p className="text-gray-700">Cancel at no charge up to 60 minutes in advance.</p></div>
                  </div>
                  <button className="mt-8 text-gray-500 underline text-sm hover:text-black transition">See terms</button>
                </div>
              </div>
            </div>
          </section>

          {/* --- GROUP RIDES SECTION --- */}
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
                        <div className="relative pl-6"><div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div><div className="flex justify-between items-center"><div><p className="font-bold">Rahul</p><div className="h-2 w-16 bg-gray-200 rounded mt-1"></div></div><div className="w-4 flex flex-col space-y-1"><div className="h-0.5 w-full bg-gray-400"></div><div className="h-0.5 w-full bg-gray-400"></div></div></div></div>
                        <div className="relative pl-6"><div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div><div className="flex justify-between items-center"><div><p className="font-bold">Priya</p><div className="h-2 w-24 bg-gray-200 rounded mt-1"></div></div><div className="w-4 flex flex-col space-y-1"><div className="h-0.5 w-full bg-gray-400"></div><div className="h-0.5 w-full bg-gray-400"></div></div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Ride with friends seamlessly</h2>
                <p className="text-lg text-gray-600 mb-6">Riding with friends just got easier: set up a group ride in the SmartCab app, invite your friends, and arrive at your destination. Friends who ride together save together.</p>
                <button onClick={() => setSelectedCard({ title: 'Group Rides', description: 'Share a link with up to 3 friends. The app will automatically calculate the most efficient route to pick everyone up and split the fare evenly among all passengers!' })} className="font-medium border-b border-black pb-1 hover:text-gray-600 transition">Learn more</button>
              </div>
            </div>
          </section>

          {/* --- 3-COLUMN INFO SECTION --- */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold mb-8 text-center md:text-left">Use the SmartCab app to help you travel your way</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col h-full"><div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100"><img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600" alt="Ride options" className="w-full h-full object-cover hover:scale-105 transition duration-500" /></div><h3 className="text-xl font-bold mb-3">Ride options</h3><p className="text-gray-600 mb-6 flex-grow">There’s more than one way to move with SmartCab, no matter where you are or where you’re headed next.</p><button onClick={() => setIsStartModalOpen(true)} className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max">Search ride options</button></div>
              <div className="flex flex-col h-full"><div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100"><img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600" alt="Airports" className="w-full h-full object-cover hover:scale-105 transition duration-500" /></div><h3 className="text-xl font-bold mb-3">700+ airports</h3><p className="text-gray-600 mb-6 flex-grow">You can request a ride to and from most major airports. Schedule a ride to the airport for one less thing to worry about.</p><button onClick={() => setIsStartModalOpen(true)} className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center"><Plane className="h-4 w-4 mr-2" /> Search airports</button></div>
              <div className="flex flex-col h-full"><div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100"><img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600" alt="Cities" className="w-full h-full object-cover hover:scale-105 transition duration-500" /></div><h3 className="text-xl font-bold mb-3">15,000+ cities</h3><p className="text-gray-600 mb-6 flex-grow">The app is available in thousands of cities worldwide, so you can request a ride even when you’re far from home.</p><button onClick={() => setIsStartModalOpen(true)} className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center"><Globe className="h-4 w-4 mr-2" /> Search cities</button></div>
            </div>
          </section>
        </div>
      )}

      {/* 🟡 DRIVE PAGE  */}
      {mainView === 'drive' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Drive when you want, make what you need</h1>
            <p className="text-xl text-gray-600 mb-8">Make money on your schedule. SmartCab's AI-driven security protects our drivers just as much as our riders.</p>
            <button onClick={() => { closeAllForms(); setShowDriverForm(true); }} className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg hover:scale-105 transform">Apply to drive →</button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200" alt="Driver" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow"><ShieldCheck className="h-4 w-4 text-green-600" /><span>Driver Protection Active</span></div>
            </div>
          </div>
        </main>
      )}

      {/* 🔵 BUSINESS PAGE  */}
      {mainView === 'business' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">SmartCab for Business</h1>
            <p className="text-xl text-gray-600 mb-8">A premium, secure travel solution for your employees. Corporate billing and a real-time safety dashboard.</p>
            <button onClick={() => { closeAllForms(); setShowBusinessForm(true); }} className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg hover:scale-105 transform">Set up your company →</button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200" alt="Business" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow"><ShieldCheck className="h-4 w-4 text-blue-600" /><span>Enterprise Security</span></div>
            </div>
          </div>
        </main>
      )}

      {/* 🟣 ABOUT PAGE */}
      {mainView === 'about' && (
        <main className="max-w-4xl mx-auto px-4 md:px-12 py-24 text-center animate-in fade-in duration-500">
          <ShieldCheck className="h-24 w-24 text-green-500 mx-auto mb-8" />
          <h1 className="text-5xl font-bold mb-6">Built for Safety. Built for You.</h1>
          <p className="text-2xl text-gray-600 mb-8 leading-relaxed">SmartCab was founded on a simple principle: everyone deserves to feel perfectly safe when they travel. We are changing the way India moves.</p>
          <button onClick={() => setMainView('ride')} className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg hover:bg-gray-800 transition shadow-lg hover:scale-105 transform">Take a Ride →</button>
        </main>
      )}

      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-100 px-4 py-3 flex justify-between items-center z-50">
          <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-center text-sm md:text-base font-medium text-blue-900"><ShieldCheck className="h-5 w-5 text-blue-600 hidden md:block" /><p><strong>Welcome to SmartCab:</strong> All rides are monitored via GPS with real-time route deviation detection and SOS features.</p></div>
          <button onClick={() => setShowBanner(false)} className="p-2 hover:bg-blue-100 rounded-full transition text-blue-900"><X className="h-5 w-5" /></button>
        </div>
      )}

      <StartModal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} />
    </div>
  );
};

export default BookRide;