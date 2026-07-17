import React, { useState } from 'react';
import { 
  Clock, Navigation, MapPin, Square, ChevronDown, Globe, 
  ShieldCheck, X, Car, Calendar, Map, Package, Bike, CalendarDays, Shield 
} from 'lucide-react';

const BookRide = () => {
  // 1. State for the Popup Modal
  const [selectedCard, setSelectedCard] = useState(null);
  
  // 2. State for the Bottom Banner
  const [showBanner, setShowBanner] = useState(true);
  
  // ⭐ NEW: 3. State to track which sub-menu tab is clicked
  const [activeTab, setActiveTab] = useState('request');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-24 relative">
      
      {/* --- POP-UP MODAL --- */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 transition-all">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedCard(null)} 
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h3 className="text-3xl font-bold mb-4">{selectedCard.title}</h3>
            <p className="text-gray-600 mb-6 text-lg">{selectedCard.description}</p>
            
            <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-start space-x-3 mb-8 border border-green-100">
              <ShieldCheck className="h-6 w-6 flex-shrink-0 mt-0.5 text-green-600" />
              <p className="text-sm font-medium">
                <strong>SmartCab AI Security:</strong> This feature is actively monitored by our real-time GPS tracking and SOS response system.
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedCard(null)}
              className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg hover:bg-gray-800 transition shadow-lg"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-black text-white flex justify-between items-center px-4 md:px-12 py-4">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 cursor-pointer">
            <ShieldCheck className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold tracking-tight">SmartCab</span>
          </div>
          <div className="hidden md:flex space-x-6 font-medium text-sm">
            {/* ⭐ NEW: Changed 'a' tags to buttons and made them open the modal to prove they work! */}
            <button onClick={() => setSelectedCard({title: 'Ride Page', description: 'Taking you to the Ride dashboard...'})} className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Ride</button>
            <button onClick={() => setSelectedCard({title: 'Drive with us', description: 'Driver registration portal opening soon.'})} className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Drive</button>
            <button onClick={() => setSelectedCard({title: 'SmartCab Business', description: 'Corporate accounts management page.'})} className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Business</button>
            <button className="hover:bg-gray-800 px-3 py-2 rounded-full transition flex items-center">
              About <ChevronDown className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-6 font-medium text-sm">
          <button className="flex items-center hover:bg-gray-800 px-3 py-2 rounded-full transition">
            <Globe className="h-4 w-4 mr-2" /> EN
          </button>
          <button onClick={() => setSelectedCard({title: 'Help Center', description: 'How can we help you today?'})} className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Help</button>
          <button onClick={() => setSelectedCard({title: 'Login', description: 'Login form will appear here.'})} className="hover:bg-gray-800 px-3 py-2 rounded-full transition">Log in</button>
          
          {/* ⭐ NEW: Sign up button made clickable */}
          <button 
            onClick={() => setSelectedCard({title: 'Create Account', description: 'Sign up functionality coming soon!'})}
            className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* --- SUB-NAVIGATION (TABS) --- */}
      <div className="border-b hidden md:flex items-center px-12 pt-3 justify-between">
        <h2 className="text-2xl font-bold pb-3">Ride</h2>
        
        {/* ⭐ NEW: These tabs now use the activeTab state to show which one is clicked! */}
        <div className="flex space-x-6 text-sm font-medium text-gray-500">
          <button 
            onClick={() => setActiveTab('request')} 
            className={`pb-4 border-b-2 transition-colors ${activeTab === 'request' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
          >
            Request a ride
          </button>
          <button 
            onClick={() => setActiveTab('reserve')} 
            className={`pb-4 border-b-2 transition-colors ${activeTab === 'reserve' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
          >
            Reserve a ride
          </button>
          <button 
            onClick={() => setActiveTab('prices')} 
            className={`pb-4 border-b-2 transition-colors ${activeTab === 'prices' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
          >
            See prices
          </button>
          <button 
            onClick={() => setActiveTab('explore')} 
            className={`pb-4 border-b-2 transition-colors ${activeTab === 'explore' ? 'border-black text-black font-bold' : 'border-transparent hover:text-black'}`}
          >
            Explore ride options
          </button>
        </div>
      </div>

      {/* --- HERO BOOKING SECTION --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-12 flex flex-col md:flex-row gap-12 items-start">
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex items-center space-x-2 text-gray-700 mb-8 font-medium">
            <MapPin className="h-5 w-5 text-black" />
            <span>Current Location (GPS Active)</span>
          </div>

          {/* ⭐ NEW: The title changes based on which tab is clicked! */}
          <h1 className="text-5xl font-bold mb-8">
            {activeTab === 'request' && "Request a secure ride"}
            {activeTab === 'reserve' && "Reserve a ride in advance"}
            {activeTab === 'prices' && "Check ride estimates"}
            {activeTab === 'explore' && "Explore your options"}
          </h1>

          <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 w-max px-4 py-3 rounded-full font-medium mb-6 transition">
            <Clock className="h-5 w-5" />
            <span>Pickup now</span>
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
          </div>

          <button className="bg-black text-white text-lg font-bold py-4 px-6 rounded-lg mt-8 w-full max-w-md hover:bg-gray-800 transition shadow-lg">
            See prices & security features
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

      {/* --- EXPLORE GRID SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-16">
        <h2 className="text-3xl font-bold mb-8">Explore what you can do with SmartCab</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Ride</h3>
              <p className="text-sm text-gray-600 mb-6">Go anywhere with full GPS tracking. Request a ride, hop in, and go safely.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Secure Rides',
                  description: 'Every SmartCab ride is connected to our central AI dispatch. If your car deviates from the designated GPS route by more than 500 meters, an automated alert is sent to our security team.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Car className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Reserve</h3>
              <p className="text-sm text-gray-600 mb-6">Reserve your secure ride in advance. Pre-vetted drivers assigned for your safety.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Advance Reservations',
                  description: 'When you reserve in advance, we ensure only our highest-rated, tier-1 background-verified drivers are assigned to your trip. Driver details are sent to you 24 hours prior.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Calendar className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Intercity</h3>
              <p className="text-sm text-gray-600 mb-6">Get convenient, affordable outstation cabs with real-time route deviation alerts.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Intercity Travel',
                  description: 'Long-distance travel requires extra security. Our Intercity cabs feature physical SOS panic buttons installed in the rear seats that instantly contact highway patrol.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Map className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Secure Parcel</h3>
              <p className="text-sm text-gray-600 mb-6">SmartCab makes same-day item delivery safe and trackable from end to end.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Trackable Parcels',
                  description: 'Send packages with confidence. You get a live camera feed snapshot of your package placement, and OTP verification is required from the receiver upon drop-off.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Package className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Rentals</h3>
              <p className="text-sm text-gray-600 mb-6">Request a trip for a block of time and make multiple stops with SOS active.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Time-block Rentals',
                  description: 'Keep the same trusted driver all day. The driver app tracks all stops, and you can share your live "Rental Route" link with family members for total peace of mind.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Clock className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between hover:bg-gray-100 transition group">
            <div>
              <h3 className="text-xl font-bold mb-2">Bike</h3>
              <p className="text-sm text-gray-600 mb-6">Get affordable, verified motorbike rides in minutes right at your doorstep.</p>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setSelectedCard({
                  title: 'Secure Moto-Rides',
                  description: 'All SmartCab Bike riders must pass a helmet-verification selfie check before the app allows them to start the engine, ensuring maximum physical safety.'
                })}
                className="bg-white text-black font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
              >
                Details
              </button>
              <Bike className="h-16 w-16 text-gray-300 group-hover:text-black transition" />
            </div>
          </div>

        </div>
      </section>

      {/* --- PLAN FOR LATER SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-16">
        <h2 className="text-3xl font-bold mb-8">Plan for later</h2>
        <div className="flex flex-col md:flex-row bg-[#E1EFE9] rounded-2xl overflow-hidden">
          <div className="w-full md:w-[60%] p-8 md:p-12">
            <h2 className="text-4xl font-bold mb-8 text-black">Get your ride right with SmartCab Reserve</h2>
            <div className="max-w-md">
              <p className="font-medium text-gray-800 mb-4">Choose date and time</p>
              <div className="flex space-x-4 mb-6">
                <div className="w-1/2">
                  <div className="bg-white flex items-center px-4 py-3 rounded-lg border border-gray-300 shadow-sm">
                    <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                    <input type="date" className="bg-transparent outline-none w-full text-gray-700 font-medium" />
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="bg-white flex items-center px-4 py-3 rounded-lg border border-gray-300 shadow-sm">
                    <Clock className="h-5 w-5 text-gray-600 mr-2" />
                    <input type="time" className="bg-transparent outline-none w-full text-gray-700 font-medium" />
                  </div>
                </div>
              </div>
              <button className="bg-black text-white w-full py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition shadow-lg">
                Next
              </button>
            </div>
          </div>
          <div className="w-full md:w-[40%] bg-white p-8 md:p-12 flex flex-col justify-center border-l border-gray-100">
            <h3 className="text-2xl font-bold mb-6">Security Benefits</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <CalendarDays className="h-6 w-6 mr-4 mt-1" />
                <p className="text-gray-700 font-medium">Choose your exact pickup time up to 90 days in advance.</p>
              </div>
              <div className="flex items-start border-t pt-6">
                <Shield className="h-6 w-6 mr-4 mt-1" />
                <p className="text-gray-700 font-medium">Top-rated, background-verified drivers are assigned to reservations.</p>
              </div>
              <div className="flex items-start border-t pt-6">
                <Clock className="h-6 w-6 mr-4 mt-1" />
                <p className="text-gray-700 font-medium">Extra wait time included to meet your ride without stress.</p>
              </div>
            </div>
            <a href="#" className="mt-8 text-black underline font-medium hover:text-gray-600 transition">See terms</a>
          </div>
        </div>
      </section>

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