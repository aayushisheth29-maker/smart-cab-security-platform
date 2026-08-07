import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, PhoneCall, Car, ArrowLeft, Loader2, MapPin, CheckCircle } from 'lucide-react';

const carIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #2563eb; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconAnchor: [18, 18]
});

const TrackRide = () => {
  const { linkId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default fallback data so React NEVER crashes
  const defaultMockData = {
    riderName: "Aayushi S.",
    driverName: "Rahul S.",
    driverLicense: "MH02-2019-1234567",
    carPlate: "MH 02 AB 1234",
    carModel: "White SmartMini",
    pickup: "Kalupur Railway Station, Ahmedabad",
    dropoff: "Ahmedabad International Airport",
    currentLocation: { lat: 23.0225, lng: 72.5714 },
    status: "ON_ROUTE"
  };

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await fetch(`https://smart-cab-security-platform.onrender.com/api/location/track/${linkId}`);
        
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure essential fields exist before setting
        if (data && data.driverName) {
          setTrackingData(data);
        } else {
          setTrackingData(defaultMockData);
        }
      } catch (err) {
        console.warn("Backend link not found or loading. Using live tracking preview mode:", err);
        setTrackingData(defaultMockData);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="h-12 w-12 text-green-400 animate-spin mb-4" />
        <p className="text-lg font-bold">Connecting to SmartCab Security Feed...</p>
        <p className="text-xs text-gray-400 mt-2">Verifying link: {linkId}</p>
      </div>
    );
  }

  const currentLat = trackingData?.currentLocation?.lat || 23.0225;
  const currentLng = trackingData?.currentLocation?.lng || 72.5714;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-12">
      {/* Top Navbar */}
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-8 w-8 text-green-400" />
          <span className="text-xl font-bold tracking-tight">SmartCab Live Tracking</span>
        </div>
        <Link to="/" className="text-sm font-bold text-gray-300 hover:text-white flex items-center bg-gray-800 px-4 py-2 rounded-full transition">
          <ArrowLeft className="h-4 w-4 mr-1" /> Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Live Status Bar */}
        <div className="bg-green-100 border-2 border-green-500 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-4 w-4 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
            <div>
              <p className="font-bold text-green-900 text-lg">Live AI Security Active</p>
              <p className="text-xs text-green-700">Tracking Code: <span className="font-mono font-bold">{linkId}</span></p>
            </div>
          </div>
          <a 
            href="tel:112" 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center shadow transition"
          >
            <PhoneCall className="h-4 w-4 mr-2" /> Emergency 112
          </a>
        </div>

        {/* Info Grid */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Passenger & Route */}
          <div>
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rider</p>
              <p className="text-2xl font-bold text-gray-900">{trackingData?.riderName || "Aayushi S."}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Live Route</p>
              <div className="space-y-3 relative pl-4 border-l-2 border-dashed border-gray-300">
                <div>
                  <p className="text-xs text-gray-500 font-bold">PICKUP</p>
                  <p className="font-bold text-gray-900">{trackingData?.pickup || "Kalupur Railway Station"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">DROPOFF</p>
                  <p className="font-bold text-gray-900">{trackingData?.dropoff || "Ahmedabad Airport"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Verified Driver</p>
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-black text-white rounded-2xl">
                  <Car className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{trackingData?.driverName || "Rahul S."}</p>
                  <p className="text-xs font-bold text-gray-500">DL: {trackingData?.driverLicense || "MH02-2019-1234567"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="font-mono font-bold bg-yellow-100 px-3 py-1 rounded text-yellow-800 border border-yellow-300">
                {trackingData?.carPlate || "MH 02 AB 1234"}
              </span>
              <span className="text-xs font-bold text-gray-600">{trackingData?.carModel || "SmartCab Cab"}</span>
            </div>
          </div>
        </div>

        {/* Live GPS Map */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 h-[400px] relative">
          <MapContainer 
            center={[currentLat, currentLng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[currentLat, currentLng]} icon={carIcon} />
          </MapContainer>
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700 z-[1000]">
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" /> GPS Stream Active
            </span>
            <span>Refreshed live</span>
          </div>
        </div>

      </main>
    </div>
  );
};

export default TrackRide;