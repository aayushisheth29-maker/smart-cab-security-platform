import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, PhoneCall, Car, ArrowLeft, Loader2, MapPin, CheckCircle, Video } from 'lucide-react';
import { API_BASE } from './api';

const carIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #2563eb; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconAnchor: [18, 18]
});

const TrackRide = () => {
  const { linkId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 📹 Live cabin camera — the rider's Live Guard uploads ~5s webm chunks
  // under this same linkId; we poll /latest every 5s and render the newest
  // frame. videoMeta tells us how much footage is buffered (last ~2-3 min).
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);

  // No hardcoded mock data — the TrackRide page must NEVER show fake
  // rider/driver/route info to a real family member. If the backend has
  // no record of this link, we show "Waiting for rider" with em-dashes.

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        // The Java service is dead — all calls go to the live Python
        // backend, configured in one place (./api.js).
        const response = await fetch(`${API_BASE}/api/location/track/${linkId}`);

        const data = await response.json();
        console.log("📡 Track data received:", data);

        // The backend returns isFallback=True when the link doesn't exist
        // (expired or never created). In that case, show a friendly
        // waiting state. Otherwise show the real data.
        if (data && data.isFallback) {
          setTrackingData({
            isWaiting: true,
            message: data.message || "This link isn't active yet. The rider needs to start a ride and tap 'Share Live Location' — you'll see their car and camera here within seconds.",
            pickup: "—",
            dropoff: "—",
            driverName: "—",
            driverLicense: "—",
            carPlate: "—",
            carModel: "—",
            riderName: "—",
            currentLocation: data.currentLocation || { lat: 23.0225, lng: 72.5714 },
          });
        } else {
          // Real data — show it directly, even if some fields are null
          setTrackingData({
            isWaiting: false,
            riderName: data.riderName || "—",
            driverName: data.driverName || "—",
            driverLicense: data.driverLicense || "—",
            carPlate: data.carPlate || "—",
            carModel: data.carModel || "—",
            pickup: data.pickup || "—",
            dropoff: data.dropoff || "—",
            currentLocation: data.currentLocation || { lat: 23.0225, lng: 72.5714 },
            status: data.status || "ON_ROUTE",
            pingCount: data.pingCount || 0,
          });
        }
      } catch (err) {
        console.warn("Backend link not found or loading:", err);
        setTrackingData({
          isWaiting: true,
          message: "Backend offline. Trying to connect...",
          pickup: "—", dropoff: "—", driverName: "—", driverLicense: "—",
          carPlate: "—", carModel: "—", riderName: "—",
          currentLocation: { lat: 23.0225, lng: 72.5714 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
    // Refresh every 5 seconds to update GPS location in real time
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [linkId]);

  // 📹 Poll the live camera feed. The backend returns video/webm bytes
  // when a chunk exists (render it), or a small JSON "empty" message
  // when the rider hasn't started Live Guard yet. Also fetch /meta so
  // we can show how many seconds of footage are buffered.
  useEffect(() => {
    let cancelled = false;

    const fetchVideo = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/video/stream/${linkId}/latest`, { cache: 'no-store' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('video/webm')) {
          const blob = await res.blob();
          if (cancelled || !blob.size) return;
          setVideoUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev); // free the old frame
            return URL.createObjectURL(blob);
          });
        }
      } catch (err) {
        // Backend still waking up or offline — keep showing the last frame
      }
      try {
        const metaRes = await fetch(`${API_BASE}/api/video/stream/${linkId}/meta`, { cache: 'no-store' });
        if (metaRes.ok && !cancelled) {
          const meta = await metaRes.json();
          if (meta && meta.status === 'ok') setVideoMeta(meta);
        }
      } catch (err) {
        // ignore
      }
    };

    fetchVideo();
    const videoInterval = setInterval(fetchVideo, 5000);
    return () => {
      cancelled = true;
      clearInterval(videoInterval);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="h-12 w-12 text-green-400 animate-spin mb-4" />
        <p className="text-lg font-bold">Connecting to SmartCab Security Feed...</p>
        <p className="text-xs text-gray-400 mt-2">Verifying link: {linkId}</p>
      </div>
    );
  }  const currentLat = trackingData?.currentLocation?.lat || 23.0225;
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
        <div className={`${trackingData?.isWaiting ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500'} border-2 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm`}>
          <div className="flex items-center space-x-3">
            <span className={`relative flex h-4 w-4 shrink-0`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${trackingData?.isWaiting ? 'bg-yellow-400' : 'bg-green-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 ${trackingData?.isWaiting ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            </span>
            <div>
              <p className={`font-bold text-lg ${trackingData?.isWaiting ? 'text-yellow-900' : 'text-green-900'}`}>
                {trackingData?.isWaiting ? '⏳ Waiting for rider' : 'Live AI Security Active'}
              </p>
              <p className={`text-xs ${trackingData?.isWaiting ? 'text-yellow-700' : 'text-green-700'}`}>Tracking Code: <span className="font-mono font-bold">{linkId}</span></p>
            </div>
          </div>
          <a
            href="tel:112"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center shadow transition"
          >
            <PhoneCall className="h-4 w-4 mr-2" /> Emergency 112
          </a>
        </div>

        {/* Waiting for rider banner — shown when the link is expired or
            hasn't been activated yet. Yellow alert with a helpful
            message instead of dashes for the driver/route info. */}
        {trackingData?.isWaiting && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <span className="text-3xl flex-shrink-0">⏳</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-900 mb-2">Waiting for rider to start</h3>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  {trackingData.message}
                </p>
                <p className="text-xs text-yellow-700 mt-3">
                  This page will update automatically every 5 seconds. The link is unique and unguessable — only the rider can activate it.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/debug/create_test_link`, { method: 'POST' });
                      const data = await res.json();
                      if (data && data.linkId) {
                        window.open(`${window.location.origin}/track/${data.linkId}`, '_blank');
                      } else {
                        alert("Backend returned an unexpected response.");
                      }
                    } catch (e) {
                      alert("Couldn't create test link. Backend may be offline. Error: " + e.message);
                    }
                  }}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition"
                >
                  🧪 Create Test Ride (for demo)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Passenger & Route */}
          <div>
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rider</p>
              <p className="text-2xl font-bold text-gray-900">
                {trackingData?.isWaiting
                  ? <span className="text-gray-400">Waiting…</span>
                  : (trackingData?.riderName || "—")}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Live Route</p>
              <div className="space-y-3 relative pl-4 border-l-2 border-dashed border-gray-300">
                <div>
                  <p className="text-xs text-gray-500 font-bold">PICKUP</p>
                  <p className="font-bold text-gray-900">
                    {trackingData?.isWaiting ? '—' : (trackingData?.pickup && trackingData.pickup !== '—' ? trackingData.pickup : 'Not set yet')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">DROPOFF</p>
                  <p className="font-bold text-gray-900">
                    {trackingData?.isWaiting ? '—' : (trackingData?.dropoff && trackingData.dropoff !== '—' ? trackingData.dropoff : 'Not set yet')}
                  </p>
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
                  <p className="text-xl font-bold text-gray-900">
                    {trackingData?.isWaiting
                      ? <span className="text-gray-400 text-base">Waiting…</span>
                      : (trackingData?.driverName || "—")}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    {trackingData?.isWaiting ? '—' : (trackingData?.driverLicense ? `DL: ${trackingData.driverLicense}` : '—')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="font-mono font-bold bg-yellow-100 px-3 py-1 rounded text-yellow-800 border border-yellow-300">
                {trackingData?.carPlate && trackingData.carPlate !== '—' ? trackingData.carPlate : '—'}
              </span>
              <span className="text-xs font-bold text-gray-600">
                {trackingData?.carModel && trackingData.carModel !== '—' ? trackingData.carModel : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 📹 Live Cabin Camera — latest 5s frame from the rider's Live Guard.
            Shows a waiting state until the rider starts the camera; the
            feed then updates automatically every 5 seconds. */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Video className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Live Cabin Camera</h3>
              {videoMeta && videoMeta.chunkCount > 0 && (
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-300">
                  ● LIVE · {videoMeta.chunkCount} clips buffered
                </span>
              )}
            </div>
            {videoMeta && videoMeta.chunkCount > 0 && (
              <span className="text-xs text-gray-500 font-bold">
                updated every 5s · last {videoMeta.lastTs ? new Date(videoMeta.lastTs).toLocaleTimeString() : '—'}
              </span>
            )}
          </div>
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              controls
              className="w-full aspect-video rounded-2xl bg-black object-cover"
            />
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-gray-900 flex flex-col items-center justify-center text-center p-6 border border-gray-800">
              <Video className="h-12 w-12 text-gray-600 mb-3" />
              <p className="text-sm font-bold text-gray-400">Camera feed not active yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {trackingData?.isWaiting
                  ? 'Waiting for the rider to start their ride and enable Live Guard.'
                  : 'The rider can switch on Live Guard from their Live Guard panel — the feed will appear here automatically.'}
              </p>
            </div>
          )}
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