import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield 
} from 'lucide-react';

const BookRide = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  
  // ⭐ The Magic Switches for our pages!
  const [activeTab, setActiveTab] = useState('request');
  const [mainView, setMainView] = useState('ride'); // This controls the main Top Menu

  // Function to scroll down when "Explore" is clicked
  const handleExploreClick = () => {
    setActiveTab('explore');
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative">
      
      {/* --- POP-UP MODAL (Still here if you ever need it) --- */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 transition-all">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedCard.title}</h3>
            <p className="text-gray-600 mb-6 text-lg">{selectedCard.description}</p>
            <button onClick={() => setSelectedCard(null)} className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition shadow-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-black text-white flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setMainView('ride')}>
            <ShieldCheck className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold tracking-tight">SmartCab</span>
          </div>
          
          {/* ⭐ The Top Menu Links that change the pages! */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-6 font-medium text-sm">
            <button onClick={() => setMainView('ride')} className={`px-3 py-2 rounded-full transition ${mainView === 'ride' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Ride</button>
            <button onClick={() => setMainView('drive')} className={`px-3 py-2 rounded-full transition ${mainView === 'drive' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Drive</button>
            <button onClick={() => setMainView('business')} className={`px-3 py-2 rounded-full transition ${mainView === 'business' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>Business</button>
            <button onClick={() => setMainView('about')} className={`px-3 py-2 rounded-full transition ${mainView === 'about' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>About</button>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-6 font-medium text-sm w-full md:w-auto">
          <button className="flex items-center hover:bg-gray-800 px-3 py-2 rounded-full transition"><Globe className="h-4 w-4 mr-2" /> EN</button>
          <Link to="/help" className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Help</Link>
          <Link to="/login" className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Log in</Link>
          <Link to="/signup" className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition">Sign up</Link>
        </div>
      </nav>


      {/* ======================================================== */}
      {/* 🟢 VIEW 1: THE "RIDE" PAGE (Your original amazing page) */}
      {/* ======================================================== */}
      {mainView === 'ride' && (
        <div className="animate-in fade-in duration-500">
          
          {/* Sub-Navigation Tabs */}
          <div className="border-b flex flex-col md:flex-row items-center px-4 md:px-12 pt-3 justify-between gap-2">
            <h2 className="text-2xl font-bold pb-1 md:pb-3">Ride</h2>
            <div className="flex overflow-x-auto w-full md:w-auto space-x-6 text-sm font-medium text-gray-500 pb-2">
              <button onClick={() => setActiveTab('request')} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'request' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Request a ride</button>
              <button onClick={() => setActiveTab('reserve')} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'reserve' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Reserve a ride</button>
              <button onClick={() => setActiveTab('prices')} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'prices' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>See prices</button>
              <button onClick={handleExploreClick} className={`whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === 'explore' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}>Explore ride options</button>
            </div>
          </div>

          {/* Hero Section */}
          <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex items-center space-x-2 text-gray-700 mb-8 font-medium">
                <MapPin className="h-5 w-5 text-black" />
                <span>Current Location (GPS Active)</span>
              </div>

              {/* Dynamic Title based on the tab! */}
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

              <div className="relative flex flex-col space-y-3 w-full max-w-md">
                <div className="absolute left-[1.35rem] top-8 bottom-8 w-0.5 bg-gray-300 z-0"></div>
                
                <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black">
                  <div className="w-2.5 h-2.5 bg-black rounded-full mr-4 flex-shrink-0"></div>
                  <input type="text" placeholder="Pickup location" className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                  <Navigation className="h-5 w-5 text-gray-500 ml-2" />
                </div>

                <div className="relative z-10 flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-black">
                  <Square className="h-3 w-3 text-black fill-current mr-4 flex-shrink-0" />
                  <input type="text" placeholder="Dropoff location" className="bg-transparent outline-none w-full text-lg placeholder-gray-500 font-medium" />
                </div>

                {/* ⭐ Magic: Show Date/Time boxes ONLY if they click "Reserve" */}
                {activeTab === 'reserve' && (
                  <div className="relative z-10 flex space-x-3 pt-2">
                    <input type="date" className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 outline-none focus:ring-2 focus:ring-black text-gray-600 font-medium" />
                    <input type="time" className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 outline-none focus:ring-2 focus:ring-black text-gray-600 font-medium" />
                  </div>
                )}
              </div>

              <button className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg mt-8 w-full max-w-md hover:bg-gray-800 transition shadow-lg">
                {activeTab === 'prices' ? 'Get price estimate' : 'See prices & security features'}
              </button>
            </div>

            <div className="w-full md:w-1/2 mt-8 md:mt-0">
              <div className="relative w-full aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200" alt="Secure Cab" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold text-green-700 shadow">
                  <ShieldCheck className="h-4 w-4" />
                  <span>AI Security Active</span>
                </div>
              </div>
            </div>
          </main>

          {/* Explore Grid */}
          <section id="explore-section" className="max-w-7xl mx-auto px-4 md:px-12 py-16">
            <h2 className="text-3xl font-bold mb-8">Explore what you can do with SmartCab</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Secure Rides', description: 'Every SmartCab ride is connected to our central AI dispatch. If your car deviates from the designated GPS route by more than 500 meters, an automated alert is sent to our security team.'})}>
                <div>
                  <h3 className="text-xl font-bold mb-2">Ride</h3>
                  <p className="text-sm text-gray-600 mb-6">Go anywhere with full GPS tracking. Request a ride, hop in, and go safely.</p>
                </div>
                <div className="flex justify-between items-end">
                  <button className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm">Details</button>
                  <Car className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Advance Reservations', description: 'When you reserve in advance, we ensure only our highest-rated, tier-1 background-verified drivers are assigned.'})}>
                <div>
                  <h3 className="text-xl font-bold mb-2">Reserve</h3>
                  <p className="text-sm text-gray-600 mb-6">Reserve your secure ride in advance. Pre-vetted drivers assigned for your safety.</p>
                </div>
                <div className="flex justify-between items-end">
                  <button className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm">Details</button>
                  <Calendar className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group cursor-pointer" onClick={() => setSelectedCard({title: 'Intercity Travel', description: 'Our Intercity cabs feature physical SOS panic buttons installed in the rear seats.'})}>
                <div>
                  <h3 className="text-xl font-bold mb-2">Intercity</h3>
                  <p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route deviation alerts.</p>
                </div>
                <div className="flex justify-between items-end">
                  <button className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm">Details</button>
                  <Map className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
                </div>
              </div>

            </div>
          </section>
        </div>
      )}


      {/* ======================================================== */}
      {/* 🟡 VIEW 2: THE "DRIVE" PAGE */}
      {/* ======================================================== */}
      {mainView === 'drive' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Drive when you want, make what you need</h1>
            <p className="text-xl text-gray-600 mb-8">Make money on your schedule. SmartCab's AI-driven security protects our drivers just as much as our riders. We verify every rider before they enter your car.</p>
            <button className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg">
              Apply to drive
            </button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200" alt="Driver" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Driver Protection Active</span>
              </div>
            </div>
          </div>
        </main>
      )}


      {/* ======================================================== */}
      {/* 🔵 VIEW 3: THE "BUSINESS" PAGE */}
      {/* ======================================================== */}
      {mainView === 'business' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 py-16 flex flex-col md:flex-row gap-12 items-center animate-in fade-in duration-500">
          <div className="w-full md:w-1/2 flex flex-col">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">SmartCab for Business</h1>
            <p className="text-xl text-gray-600 mb-8">A premium, secure travel solution for your employees. Enjoy corporate billing, automated expense reports, and a real-time safety dashboard for your whole team.</p>
            <button className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg w-max hover:bg-gray-800 transition shadow-lg">
              Set up your company
            </button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-100 flex items-center justify-center">
              <Shield className="h-32 w-32 text-gray-300" />
              <h2 className="absolute font-bold text-2xl text-gray-400 mt-40">Enterprise Security</h2>
            </div>
          </div>
        </main>
      )}


      {/* ======================================================== */}
      {/* 🟣 VIEW 4: THE "ABOUT" PAGE */}
      {/* ======================================================== */}
      {mainView === 'about' && (
        <main className="max-w-4xl mx-auto px-4 md:px-12 py-24 text-center animate-in fade-in duration-500">
          <ShieldCheck className="h-24 w-24 text-green-500 mx-auto mb-8" />
          <h1 className="text-5xl font-bold mb-6">Built for Safety. Built for You.</h1>
          <p className="text-2xl text-gray-600 mb-8 leading-relaxed">
            SmartCab was founded on a simple principle: everyone deserves to feel perfectly safe when they travel. 
            By combining military-grade GPS tracking, background-checked drivers, and instant SOS alerts, we are changing the way the world moves.
          </p>
          <button onClick={() => setMainView('ride')} className="bg-black text-white text-lg font-bold py-4 px-8 rounded-lg hover:bg-gray-800 transition shadow-lg">
            Take a Ride
          </button>
        </main>
      )}


      {/* --- BOTTOM BANNER --- */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-100 px-4 py-3 flex justify-between items-center z-50">
          <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full justify-center text-sm md:text-base font-medium text-blue-900">
            <ShieldCheck className="h-5 w-5 text-blue-600 hidden md:block" />
            <p><strong>Welcome to SmartCab:</strong> All rides are monitored via GPS with real-time route deviation detection and SOS features.</p>
          </div>
          <button onClick={() => setShowBanner(false)} className="p-2 hover:bg-blue-100 rounded-full transition text-blue-900">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BookRide;