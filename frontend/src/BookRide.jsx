import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield,
  User, Phone, Mail, Building, CheckCircle, ArrowLeft, Loader2,
  CreditCard, Users, Plane
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

// --- HELPER COMPONENT TO RE-CENTER MAP ---
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const BookRide = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  const [mainView, setMainView] = useState('ride');
  
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [driverData, setDriverData] = useState({ name: '', phone: '', city: '', carModel: '' });
  const [businessData, setBusinessData] = useState({ company: '', email: '', employees: '' });

  // Ride Booking State
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [showPrices, setShowPrices] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [selectedCar, setSelectedCar] = useState('SmartMini');
  
  // Tracking & Map State
  const [rideProgress, setRideProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // Default to center of India initially
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); 
  const [mapZoom, setMapZoom] = useState(5);
  
  // Dynamic coordinates based on user search
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  // Auto-driving timer effect
  useEffect(() => {
    if (rideConfirmed && rideProgress < 100) {
      const timer = setInterval(() => {
        setRideProgress((prev) => {
          const next = prev + 1;
          return next > 100 ? 100 : next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rideConfirmed, rideProgress]);

  // Geocoding Function (Turns text into Map Coordinates)
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
      console.error("Error finding location:", error);
      return null;
    }
  };

  // Handle Ride Confirmation (Searches coordinates first)
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

  // Calculate dynamic car position along the route
  let currentCarLat = 0, currentCarLng = 0;
  if (pickupCoords && dropoffCoords) {
    currentCarLat = pickupCoords[0] + (dropoffCoords[0] - pickupCoords[0]) * (rideProgress / 100);
    currentCarLng = pickupCoords[1] + (dropoffCoords[1] - pickupCoords[1]) * (rideProgress / 100);
  }

  const handleExploreClick = () => {
    setActiveTab('explore');
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
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
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative">
      
      {/* INFO POP-UP */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedCard.title}</h3>
            <p className="text-gray-600 mb-6 text-lg">{selectedCard.description}</p>
            <button onClick={() => setSelectedCard(null)} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition">Close</button>
          </div>
        </div>
      )}

      {/* DRIVER FORM */}
      {showDriverForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button onClick={closeAllForms} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500"><X className="h-6 w-6" /></button>
            {formSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Application Received!</h3>
                <p className="text-gray-600 mb-8 text-lg">Thanks, {driverData.name}! Our team will contact you at {driverData.phone} within 24 hours.</p>
                <button onClick={closeAllForms} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <div className={`h-2 flex-1 rounded-full ${formStep >= 1 ? 'bg-black' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full mx-2 ${formStep >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${formStep >= 3 ? 'bg-black' : 'bg-gray-200'}`}></div>
                </div>
                <p className="text-sm text-gray-500 mb-4">Step {formStep} of 3</p>
                {formStep === 1 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Let's get you started</h3>
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3"><User className="h-5 w-5 text-gray-500 mr-3" /><input type="text" placeholder="Full Name" value={driverData.name} onChange={(e) => setDriverData({...driverData, name: e.target.value})} className="bg-transparent outline-none w-full font-medium" /></div>
                      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3"><Phone className="h-5 w-5 text-gray-500 mr-3" /><input type="tel" placeholder="Phone Number" value={driverData.phone} onChange={(e) => setDriverData({...driverData, phone: e.target.value})} className="bg-transparent outline-none w-full font-medium" /></div>
                    </div>
                    <button onClick={() => setFormStep(2)} disabled={!driverData.name || !driverData.phone} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition mt-8 disabled:bg-gray-300">Continue</button>
                  </div>
                )}
                {formStep === 2 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Where do you drive?</h3>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mt-6"><MapPin className="h-5 w-5 text-gray-500 mr-3" /><input type="text" placeholder="Your City (e.g., Mumbai)" value={driverData.city} onChange={(e) => setDriverData({...driverData, city: e.target.value})} className="bg-transparent outline-none w-full font-medium" /></div>
                    <div className="flex space-x-3 mt-8">
                      <button onClick={() => setFormStep(1)} className="w-1/3 bg-gray-100 font-bold py-4 rounded-xl hover:bg-gray-200">Back</button>
                      <button onClick={() => setFormStep(3)} disabled={!driverData.city} className="w-2/3 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300">Continue</button>
                    </div>
                  </div>
                )}
                {formStep === 3 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Tell us about your car</h3>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mt-6"><Car className="h-5 w-5 text-gray-500 mr-3" /><input type="text" placeholder="Car Make & Model" value={driverData.carModel} onChange={(e) => setDriverData({...driverData, carModel: e.target.value})} className="bg-transparent outline-none w-full font-medium" /></div>
                    <div className="flex space-x-3 mt-8">
                      <button onClick={() => setFormStep(2)} className="w-1/3 bg-gray-100 font-bold py-4 rounded-xl hover:bg-gray-200">Back</button>
                      <button onClick={() => setFormSubmitted(true)} disabled={!driverData.carModel} className="w-2/3 bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:bg-gray-300">Submit</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* BUSINESS FORM POP-UP */}
      {showBusinessForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full relative shadow-2xl">
            <button onClick={closeAllForms} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500"><X className="h-6 w-6" /></button>
            {formSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Welcome Aboard!</h3>
                <p className="text-gray-600 mb-8 text-lg">Thanks, {businessData.company}! A corporate account manager will reach out to {businessData.email} shortly.</p>
                <button onClick={closeAllForms} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800">Done</button>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-bold mb-2">Set up your company</h3>
                <p className="text-gray-600 mb-6">Get corporate billing and safety dashboards.</p>
                <div className="space-y-4">
                  <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                    <Building className="h-5 w-5 text-gray-500 mr-3" />
                    <input type="text" placeholder="Company Name" value={businessData.company} onChange={(e) => setBusinessData({...businessData, company: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <input type="email" placeholder="Work Email" value={businessData.email} onChange={(e) => setBusinessData({...businessData, email: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                  </div>
                </div>
                <button onClick={() => setFormSubmitted(true)} disabled={!businessData.company || !businessData.email} className="w-full bg-black text-white font-bold py-4 rounded-xl mt-8 hover:bg-gray-800 disabled:bg-gray-300">Get Started</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="bg-black text-white flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {setMainView('ride'); resetRide();}}>
            <ShieldCheck className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold tracking-tight">SmartCab</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-6 font-medium text-sm">
            <button onClick={() => {setMainView('ride'); resetRide();}} className={`px-3 py-2 rounded-full transition ${mainView === 'ride' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Ride</button>
            <button onClick={() => setMainView('drive')} className={`px-3 py-2 rounded-full transition ${mainView === 'drive' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Drive</button>
            <button onClick={() => setMainView('business')} className={`px-3 py-2 rounded-full transition ${mainView === 'business' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Business</button>
            <button onClick={() => setMainView('about')} className={`px-3 py-2 rounded-full transition ${mainView === 'about' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>About</button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-6 font-medium text-sm w-full md:w-auto">
          <button className="flex items-center hover:bg-gray-800 px-3 py-2 rounded-full"><Globe className="h-4 w-4 mr-2" /> EN</button>
          <Link to="/help" className="hover:bg-gray-800 px-3 py-2 rounded-full">Help</Link>
          <Link to="/login" className="hover:bg-gray-800 px-3 py-2 rounded-full">Log in</Link>
          <Link to="/signup" className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200">Sign up</Link>
        </div>
      </nav>

      {/* 🟢 RIDE PAGE */}
      {mainView === 'ride' && (
        <div className="animate-in fade-in duration-500">
          <div className="border-b flex flex-col md:flex-row items-center px-4 md:px-12 pt-3 justify-between gap-2">
            <h2 className="text-2xl font-bold pb-1 md:pb-3">Ride</h2>
            <div className="flex overflow-x-auto w-full md:w-auto space-x-6 text-sm font-medium text-gray-500 pb-2">
              <button onClick={() => {setActiveTab('request'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'request' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Request a ride</button>
              <button onClick={() => {setActiveTab('reserve'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'reserve' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Reserve a ride</button>
              <button onClick={() => {setActiveTab('prices'); setShowPrices(false);}} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'prices' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>See prices</button>
              <button onClick={handleExploreClick} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'explore' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Explore options</button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 flex flex-col md:flex-row gap-12 items-start">
            
            {/* LEFT COLUMN */}
            <div className="w-full md:w-1/2 flex flex-col relative h-[500px]">
              
              {rideConfirmed ? (
                // MAP TRACKING SCREEN
                <div className="w-full h-[500px] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl relative border border-gray-200">
                  <div className="absolute inset-0 z-0">
                    <MapContainer 
                      center={mapCenter} 
                      zoom={mapZoom} 
                      scrollWheelZoom={false} 
                      style={{ height: '100%', width: '100%', zIndex: 0 }}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                      <MapUpdater center={mapCenter} zoom={mapZoom} />
                      
                      {pickupCoords && <Marker position={pickupCoords} icon={pickupIcon} />}
                      {dropoffCoords && <Marker position={dropoffCoords} icon={dropoffIcon} />}
                      {pickupCoords && dropoffCoords && <Marker position={[currentCarLat, currentCarLng]} icon={carIcon} />}
                    </MapContainer>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 z-10">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-bold text-gray-900">Ride in Progress</h2>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{rideProgress < 50 ? 'Approaching' : rideProgress < 90 ? 'Nearby' : 'Arrived'}</span>
                    </div>
                    <p className="text-gray-600 mb-3 text-sm">Driver Rahul S. ({selectedCar}) • Route: {pickup} to {dropoff}</p>
                    
                    <div className="w-full bg-blue-100 rounded-full h-3 mb-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${rideProgress}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Pickup</span>
                      <span className="font-bold text-green-600">{rideProgress === 100 ? 'Arrived!' : `${Math.round(rideProgress)}% Complete`}</span>
                      <span>Dropoff</span>
                    </div>
                    
                    {rideProgress === 100 && (
                      <button onClick={resetRide} className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-lg">Ride Completed • Book Again</button>
                    )}
                  </div>
                </div>

              ) : showPrices ? (
                // CAR PRICES LIST
                <div className="animate-in slide-in-from-right-8 duration-300 w-full max-w-md h-full flex flex-col">
                  <div className="shrink-0">
                    <button onClick={() => setShowPrices(false)} className="flex items-center text-blue-600 font-medium hover:underline mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back to locations</button>
                    <h2 className="text-3xl font-bold mb-4">Choose your ride</h2>
                  </div>

                  <div className="overflow-y-auto flex-1 pr-2 space-y-3 mb-4">
                    {/* Cars */}
                    <div onClick={() => setSelectedCar('SmartMini')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartMini' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4"><Car className="h-8 w-8 text-gray-700" /><div><h3 className="font-bold text-lg">SmartMini</h3><p className="text-xs text-green-600 font-medium flex items-center mt-1"><ShieldCheck className="h-3 w-3 mr-1"/> SOS Active</p></div></div>
                      <div className="text-xl font-bold">₹240</div>
                    </div>
                    <div onClick={() => setSelectedCar('SmartSedan')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSedan' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4"><Car className="h-10 w-10 text-gray-900" /><div><h3 className="font-bold text-lg">SmartSedan</h3><p className="text-xs text-blue-600 font-medium flex items-center mt-1"><Shield className="h-3 w-3 mr-1"/> Top Rated Driver</p></div></div>
                      <div className="text-xl font-bold">₹320</div>
                    </div>
                    <div onClick={() => setSelectedCar('SmartSUV')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSUV' ? 'border-black bg-gray-50 shadow-md' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4"><Car className="h-12 w-12 text-black" /><div><h3 className="font-bold text-lg">SmartSUV</h3><p className="text-xs text-purple-600 font-medium flex items-center mt-1"><User className="h-3 w-3 mr-1"/> 6 Seats</p></div></div>
                      <div className="text-xl font-bold">₹450</div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 border-t border-gray-100">
                    <button 
                      onClick={handleConfirmRide} 
                      disabled={isSearching}
                      className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg flex justify-center items-center disabled:bg-gray-400"
                    >
                      {isSearching ? <><Loader2 className="animate-spin mr-2 h-5 w-5"/> Locating...</> : `Confirm ${selectedCar}`}
                    </button>
                  </div>
                </div>

              ) : (
                // LOCATION INPUT FORM
                <div className="animate-in fade-in duration-300 w-full max-w-md h-full flex flex-col">
                  <div className="flex items-center space-x-2 text-gray-700 mb-8 font-medium">
                    <MapPin className="h-5 w-5 text-black" />
                    <span>Current Location (GPS Active)</span>
                  </div>

                  <h1 className="text-5xl font-bold mb-8 transition-all">
                    {activeTab === 'request' && "Request a secure ride"}
                    {activeTab === 'reserve' && "Reserve a ride in advance"}
                    {activeTab === 'prices' && "Check ride estimates"}
                    {activeTab === 'explore' && "Explore your options"}
                  </h1>

                  <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 w-max px-4 py-3 rounded-full font-medium mb-6 transition">
                    <Clock className="h-5 w-5" />
                    <span>{activeTab === 'reserve' ? 'Schedule for later' : 'Pickup now'}</span>
                    <ChevronDown className="h-5 w-5" />
                  </button>

                  <div className="relative flex flex-col space-y-3 w-full">
                    <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                    
                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black">
                      <div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div>
                      <input type="text" placeholder="Pickup (e.g., Delhi, Bangalore)" value={pickup} onChange={(e)=>setPickup(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                      <Navigation className="h-5 w-5 text-gray-500 ml-2" />
                    </div>

                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black">
                      <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
                      <input type="text" placeholder="Dropoff (e.g., Mumbai, Goa)" value={dropoff} onChange={(e)=>setDropoff(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <button 
                      onClick={() => setShowPrices(true)}
                      disabled={!pickup || !dropoff}
                      className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 hover:scale-[1.02] transform"
                    >
                      Search route & see prices
                    </button>
                    {(!pickup || !dropoff) && <p className="text-xs text-gray-400 mt-2 text-center">Please enter pickup and dropoff to search</p>}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: The Image / Initial Map */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0 h-[500px]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                {/* When not riding, show a zoomed out map of India as a background instead of a static image! */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
                   <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                   </MapContainer>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 flex items-end p-8">
                   <h3 className="text-white text-3xl font-bold w-3/4">Travel safely anywhere in India.</h3>
                </div>
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
              {/* 1. RIDE */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'Secure Rides', description: 'Go anywhere with full GPS tracking. Every SmartCab ride is connected to our central AI dispatch. If your car deviates from the designated GPS route by more than 500 meters, an automated alert is sent to our safety team and your emergency contacts.' })}
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

              {/* 2. RESERVE */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'Advance Reservations', description: 'Reserve your secure ride up to 30 days in advance. When you reserve, we ensure only our highest-rated, tier-1 background-verified drivers are assigned to your trip. Perfect for early morning airport runs.' })}
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

              {/* 3. INTERCITY */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'Intercity Travel', description: 'Comfortable outstation cabs for long-distance travel. All intercity vehicles undergo a 24-point maintenance check before dispatch and feature physical SOS panic buttons installed in the rear passenger seats.' })}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Intercity</h3>
                    <p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route alerts.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Map className="h-20 w-20 text-green-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* 4. PARCEL */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'SmartCab Parcel', description: 'Send packages across the city securely. Our delivery partners use OTP verification at both pickup and dropoff points ensuring your valuable items never end up in the wrong hands.' })}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Parcel</h3>
                    <p className="text-sm text-gray-600 mb-6">SmartCab makes same-day item delivery easier and safer than ever.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Package className="h-20 w-20 text-amber-600 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* 5. RENTALS */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'Hourly Rentals', description: 'Keep your car and driver with you for multiple stops. Book packages starting from 1 hour / 10 km up to 12 hours / 120 km. Perfect for shopping trips or consecutive business meetings.' })}
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

              {/* 6. BIKE */}
              <div 
                className="bg-gray-50 rounded-xl p-6 flex justify-between items-center hover:bg-gray-100 transition group cursor-pointer shadow-sm hover:shadow-md" 
                onClick={() => setSelectedCard({ title: 'SmartBike', description: 'Beat the traffic with our fast and affordable motorcycle rides. We enforce a strict helmet-verification protocol—the ride cannot start until the driver uploads a selfie wearing their helmet.' })}
              >
                <div className="flex flex-col h-full justify-between pr-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Bike</h3>
                    <p className="text-sm text-gray-600 mb-6">Get affordable, quick motorbike rides in minutes at your doorstep.</p>
                  </div>
                  <button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm w-max text-sm hover:bg-gray-50">Details</button>
                </div>
                <Bike className="h-20 w-20 text-red-500 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </section>

          {/* --- NEW: PLAN FOR LATER SECTION --- */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-12">
            <h2 className="text-3xl font-bold mb-8">Plan for later</h2>
            
            <div className="flex flex-col lg:flex-row bg-[#e2f1f8] rounded-2xl overflow-hidden relative">
              
              {/* Left Side: Form */}
              <div className="w-full lg:w-1/2 p-8 md:p-12 z-10 flex flex-col justify-center">
                <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-gray-900">Get your ride right<br/>with SmartCab Reserve</h3>
                
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

              {/* Right Side: Benefits Card */}
              <div className="w-full lg:w-1/2 p-8 md:p-12 flex items-center justify-center lg:justify-end relative">
                {/* Decorative background shape */}
                <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                
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

          {/* --- NEW: GROUP RIDES SECTION --- */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center gap-12">
              
              {/* Fake App Mockup */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="border-[8px] border-black rounded-[2.5rem] w-full max-w-[320px] bg-white overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20"></div> {/* Fake Notch */}
                  
                  <div className="p-6 pt-12 pb-24">
                    <h4 className="text-2xl font-bold mb-6">Rahul's group ride</h4>
                    <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] p-4 border border-gray-100">
                      <p className="font-bold mb-4">Set pickup order</p>
                      
                      <div className="relative border-l-2 border-black ml-3 space-y-6 pb-2">
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                          <div className="flex justify-between items-center">
                            <div><p className="font-bold">Rahul</p><div className="h-2 w-16 bg-gray-200 rounded mt-1"></div></div>
                            <div className="w-4 flex flex-col space-y-1"><div className="h-0.5 w-full bg-gray-400"></div><div className="h-0.5 w-full bg-gray-400"></div></div>
                          </div>
                        </div>
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                          <div className="flex justify-between items-center">
                            <div><p className="font-bold">Priya</p><div className="h-2 w-24 bg-gray-200 rounded mt-1"></div></div>
                            <div className="w-4 flex flex-col space-y-1"><div className="h-0.5 w-full bg-gray-400"></div><div className="h-0.5 w-full bg-gray-400"></div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Side */}
              <div className="w-full md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Ride with friends seamlessly</h2>
                <p className="text-lg text-gray-600 mb-6">Riding with friends just got easier: set up a group ride in the SmartCab app, invite your friends, and arrive at your destination. Friends who ride together save together.</p>
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

          {/* --- NEW: 3-COLUMN INFO SECTION --- */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold mb-8 text-center md:text-left">Use the SmartCab app to help you travel your way</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600" alt="Ride options" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Ride options</h3>
                <p className="text-gray-600 mb-6 flex-grow">There’s more than one way to move with SmartCab, no matter where you are or where you’re headed next.</p>
                <button 
                  onClick={() => {
                    setActiveTab('prices');
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to the top map
                  }}
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max"
                >
                  Search ride options
                </button>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600" alt="Airports" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">700+ airports</h3>
                <p className="text-gray-600 mb-6 flex-grow">You can request a ride to and from most major airports. Schedule a ride to the airport for one less thing to worry about.</p>
                <button 
                  onClick={() => setSelectedCard({ title: 'Airport Transfers', description: 'Our drivers monitor your flight status in real-time. If your flight is delayed, we automatically adjust your pickup time at no extra cost.' })}
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center"
                >
                  <Plane className="h-4 w-4 mr-2" /> Search airports
                </button>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col h-full">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600" alt="Cities" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">15,000+ cities</h3>
                <p className="text-gray-600 mb-6 flex-grow">The app is available in thousands of cities worldwide, so you can request a ride even when you’re far from home.</p>
                <button 
                  onClick={() => setSelectedCard({ title: 'Global Coverage', description: 'We currently operate in tier 1, 2, and 3 cities across India, with global expansion planned for next year.' })}
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition w-max flex items-center"
                >
                  <Globe className="h-4 w-4 mr-2" /> Search cities
                </button>
              </div>
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

      {/* --- BOTTOM BANNER --- */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-100 px-4 py-3 flex justify-between items-center z-50">
          <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-center text-sm md:text-base font-medium text-blue-900"><ShieldCheck className="h-5 w-5 text-blue-600 hidden md:block" /><p><strong>Welcome to SmartCab:</strong> All rides are monitored via GPS with real-time route deviation detection and SOS features.</p></div>
          <button onClick={() => setShowBanner(false)} className="p-2 hover:bg-blue-100 rounded-full transition text-blue-900"><X className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  );
};

export default BookRide;