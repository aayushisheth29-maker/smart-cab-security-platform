import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield,
  User, Phone, Mail, Building, CheckCircle, ArrowLeft
} from 'lucide-react';

const BookRide = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  const [mainView, setMainView] = useState('ride');
  
  // Forms & Modals
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form Data
  const [driverData, setDriverData] = useState({ name: '', phone: '', city: '', carModel: '' });
  const [businessData, setBusinessData] = useState({ company: '', email: '', employees: '' });

  // Ride Booking State
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [showPrices, setShowPrices] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [selectedCar, setSelectedCar] = useState('SmartMini');
  
  // ⭐ NEW: Tracking State
  const [rideProgress, setRideProgress] = useState(0);

  // ⭐ NEW: Auto-driving timer effect
  useEffect(() => {
    if (rideConfirmed && rideProgress < 100) {
      const timer = setInterval(() => {
        setRideProgress((prev) => {
          const next = prev + 2;
          return next > 100 ? 100 : next;
        });
      }, 800);
      return () => clearInterval(timer);
    }
  }, [rideConfirmed, rideProgress]);

  const handleExploreClick = () => {
    setActiveTab('explore');
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeAllForms = () => {
    setShowDriverForm(false);
    setShowBusinessForm(false);
    setFormStep(1);
    setFormSubmitted(false);
    setDriverData({ name: '', phone: '', city: '', carModel: '' });
    setBusinessData({ company: '', email: '', employees: '' });
  };

  const resetRide = () => {
    setShowPrices(false);
    setRideConfirmed(false);
    setRideProgress(0);
    setPickup('');
    setDropoff('');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative">
      
      {/* --- INFO POP-UP --- */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedCard.title}</h3>
            <p className="text-gray-600 mb-6 text-lg">{selectedCard.description}</p>
            <button onClick={() => setSelectedCard(null)} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition">
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- DRIVER FORM POP-UP --- */}
      {showDriverForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button onClick={closeAllForms} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <X className="h-6 w-6" />
            </button>

            {formSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Application Received!</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Thanks, {driverData.name}! Our team will contact you at {driverData.phone} within 24 hours.
                </p>
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
                    <p className="text-gray-600 mb-6">First, tell us who you are.</p>
                    <div className="space-y-4">
                      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                        <User className="h-5 w-5 text-gray-500 mr-3" />
                        <input type="text" placeholder="Full Name" value={driverData.name} onChange={(e) => setDriverData({...driverData, name: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                      </div>
                      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                        <Phone className="h-5 w-5 text-gray-500 mr-3" />
                        <input type="tel" placeholder="Phone Number" value={driverData.phone} onChange={(e) => setDriverData({...driverData, phone: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                      </div>
                    </div>
                    <button onClick={() => setFormStep(2)} disabled={!driverData.name || !driverData.phone} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition mt-8 disabled:bg-gray-300">Continue</button>
                  </div>
                )}
                {formStep === 2 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Where do you drive?</h3>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mt-6">
                      <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                      <input type="text" placeholder="Your City (e.g., Mumbai)" value={driverData.city} onChange={(e) => setDriverData({...driverData, city: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                    </div>
                    <div className="flex space-x-3 mt-8">
                      <button onClick={() => setFormStep(1)} className="w-1/3 bg-gray-100 font-bold py-4 rounded-xl hover:bg-gray-200">Back</button>
                      <button onClick={() => setFormStep(3)} disabled={!driverData.city} className="w-2/3 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300">Continue</button>
                    </div>
                  </div>
                )}
                {formStep === 3 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Tell us about your car</h3>
                    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mt-6">
                      <Car className="h-5 w-5 text-gray-500 mr-3" />
                      <input type="text" placeholder="Car Make & Model" value={driverData.carModel} onChange={(e) => setDriverData({...driverData, carModel: e.target.value})} className="bg-transparent outline-none w-full font-medium" />
                    </div>
                    <div className="flex space-x-3 mt-8">
                      <button onClick={() => setFormStep(2)} className="w-1/3 bg-gray-100 font-bold py-4 rounded-xl hover:bg-gray-200">Back</button>
                      <button onClick={() => setFormSubmitted(true)} disabled={!driverData.carModel} className="w-2/3 bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:bg-gray-300">Submit Application</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* --- BUSINESS FORM POP-UP --- */}
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

      {/* --- TOP NAVIGATION BAR --- */}
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
                // ⭐ NEW: LIVE MAP TRACKING SCREEN
                <div className="w-full h-[500px] bg-gradient-to-b from-blue-50 to-blue-100 rounded-3xl overflow-hidden shadow-2xl relative border border-blue-200">
                  
                  {/* Fake Map Roads */}
                  <div className="absolute inset-0 opacity-30">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" alt="map texture" className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e40af" strokeWidth="1"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Pickup Marker */}
                  <div className="absolute top-12 left-8 z-10">
                    <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Pickup</div>
                    <div className="w-4 h-4 bg-black rounded-full mx-auto mt-1 shadow-lg border-2 border-white"></div>
                  </div>

                  {/* Dropoff Marker */}
                  <div className="absolute bottom-24 right-8 z-10">
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Dropoff</div>
                    <div className="w-4 h-4 bg-green-600 rounded-full mx-auto mt-1 shadow-lg border-2 border-white"></div>
                  </div>

                  {/* MOVING CAR */}
                  <div 
                    className="absolute bottom-1/2 left-0 w-full h-20 transition-all duration-700 ease-linear z-20 pointer-events-none"
                    style={{ left: `calc(${Math.min(rideProgress, 85)}% - 20px)` }}
                  >
                    <div className="relative">
                      <Car className="h-12 w-12 text-blue-600 drop-shadow-2xl animate-bounce" style={{ animationDuration: '2s' }} />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-md"></div>
                    </div>
                  </div>

                  {/* Bottom Tracking Card */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-bold text-gray-900">Ride in Progress</h2>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {rideProgress < 50 ? 'Approaching' : rideProgress < 90 ? 'Nearby' : 'Arrived'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">Driver Rahul S. ({selectedCar}) • License MH 01 AB 1234</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-blue-100 rounded-full h-3 mb-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${rideProgress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Pickup</span>
                      <span className="font-bold text-green-600">{rideProgress === 100 ? 'Arrived!' : `${Math.round(rideProgress)}% Complete`}</span>
                      <span>Dropoff</span>
                    </div>
                    
                    {rideProgress === 100 && (
                      <button onClick={resetRide} className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-lg">
                        Ride Completed • Book Again
                      </button>
                    )}
                  </div>
                </div>

              ) : showPrices ? (
                // SCROLLABLE CAR PRICES LIST
                <div className="animate-in slide-in-from-right-8 duration-300 w-full max-w-md h-full flex flex-col">
                  <div className="shrink-0">
                    <button onClick={() => setShowPrices(false)} className="flex items-center text-blue-600 font-medium hover:underline mb-4">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back to locations
                    </button>
                    <h2 className="text-3xl font-bold mb-4">Choose your ride</h2>
                  </div>

                  <div className="overflow-y-auto flex-1 pr-2 space-y-3 mb-4">
                    {/* SmartMini */}
                    <div onClick={() => setSelectedCar('SmartMini')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartMini' ? 'border-black bg-gray-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4">
                        <Car className="h-8 w-8 text-gray-700" />
                        <div>
                          <h3 className="font-bold text-lg">SmartMini <span className="text-sm font-normal text-gray-500 ml-1">4 min</span></h3>
                          <p className="text-xs text-green-600 font-medium flex items-center mt-1"><ShieldCheck className="h-3 w-3 mr-1"/> SOS Active</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold">₹240</div>
                    </div>

                    {/* SmartSedan */}
                    <div onClick={() => setSelectedCar('SmartSedan')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSedan' ? 'border-black bg-gray-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4">
                        <Car className="h-10 w-10 text-gray-900" />
                        <div>
                          <h3 className="font-bold text-lg">SmartSedan <span className="text-sm font-normal text-gray-500 ml-1">7 min</span></h3>
                          <p className="text-xs text-blue-600 font-medium flex items-center mt-1"><Shield className="h-3 w-3 mr-1"/> Top Rated Driver</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold">₹320</div>
                    </div>

                    {/* SmartSUV */}
                    <div onClick={() => setSelectedCar('SmartSUV')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartSUV' ? 'border-black bg-gray-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4">
                        <Car className="h-12 w-12 text-black" />
                        <div>
                          <h3 className="font-bold text-lg">SmartSUV <span className="text-sm font-normal text-gray-500 ml-1">10 min</span></h3>
                          <p className="text-xs text-purple-600 font-medium flex items-center mt-1"><User className="h-3 w-3 mr-1"/> 6 Seats</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold">₹450</div>
                    </div>

                    {/* SmartBike */}
                    <div onClick={() => setSelectedCar('SmartBike')} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${selectedCar === 'SmartBike' ? 'border-black bg-gray-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-black'}`}>
                      <div className="flex items-center space-x-4">
                        <Bike className="h-8 w-8 text-gray-700" />
                        <div>
                          <h3 className="font-bold text-lg">SmartBike <span className="text-sm font-normal text-gray-500 ml-1">2 min</span></h3>
                          <p className="text-xs text-orange-600 font-medium flex items-center mt-1">Helmet Verified</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold">₹80</div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 border-t border-gray-100">
                    <button onClick={() => setRideConfirmed(true)} className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg">
                      Confirm {selectedCar}
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
                      <input type="text" placeholder="Pickup location" value={pickup} onChange={(e)=>setPickup(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                      <Navigation className="h-5 w-5 text-gray-500 ml-2" />
                    </div>

                    <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black">
                      <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
                      <input type="text" placeholder="Dropoff location" value={dropoff} onChange={(e)=>setDropoff(e.target.value)} className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                    </div>

                    {activeTab === 'reserve' && (
                      <div className="relative z-10 flex space-x-3 pt-2">
                        <input type="date" className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 outline-none focus:ring-2 focus:ring-black text-gray-600 font-medium" />
                        <input type="time" className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 outline-none focus:ring-2 focus:ring-black text-gray-600 font-medium" />
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-8">
                    <button 
                      onClick={() => setShowPrices(true)}
                      disabled={!pickup || !dropoff}
                      className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg w-full hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 hover:scale-[1.02] transform"
                    >
                      See prices & security features
                    </button>
                    {(!pickup || !dropoff) && <p className="text-xs text-gray-400 mt-2 text-center">Please enter pickup and dropoff to see prices</p>}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: The Image */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0 h-[500px]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200" alt="Secure Cab" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold text-green-700 shadow">
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
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Secure Rides', description: 'Every SmartCab ride is connected to our central AI dispatch. If your car deviates from the designated GPS route by more than 500 meters, an automated alert is sent.'})}>
                <div><h3 className="text-xl font-bold mb-2">Ride</h3><p className="text-sm text-gray-600 mb-6">Go anywhere with full GPS tracking. Request a ride, hop in, and go safely.</p></div>
                <div className="flex justify-between items-end"><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm">Details</button><Car className="h-16 w-16 text-gray-300 group-hover:text-black transition" /></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Advance Reservations', description: 'When you reserve in advance, we ensure only our highest-rated, tier-1 background-verified drivers are assigned.'})}>
                <div><h3 className="text-xl font-bold mb-2">Reserve</h3><p className="text-sm text-gray-600 mb-6">Reserve your secure ride in advance. Pre-vetted drivers assigned for your safety.</p></div>
                <div className="flex justify-between items-end"><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm">Details</button><Calendar className="h-16 w-16 text-gray-300 group-hover:text-black transition" /></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Intercity Travel', description: 'Our Intercity cabs feature physical SOS panic buttons installed in the rear seats.'})}>
                <div><h3 className="text-xl font-bold mb-2">Intercity</h3><p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route alerts.</p></div>
                <div className="flex justify-between items-end"><button className="bg-white font-medium px-4 py-2 rounded-full shadow-sm">Details</button><Map className="h-16 w-16 text-gray-300 group-hover:text-black transition" /></div>
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