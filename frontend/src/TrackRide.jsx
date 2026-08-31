import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, PhoneCall, Car, ArrowLeft, Loader2, MapPin, CheckCircle, Video } from 'lucide-react';
import { API_BASE } from './api';

const carIcon = new L.DivIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: #2563eb; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconAnchor: [18, 18]
});

// react-leaflet's <MapContainer center={...}> only reads that prop ONCE,
// on initial mount — changing it on every poll does NOT pan the map. This
// small helper hooks into the actual Leaflet map instance and calls
// setView() imperatively whenever the car's coordinates change, which is
// the only way to make the view actually follow the moving marker.
const RecenterOnMove = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

const TrackRide = () => {
  const { linkId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const mapRef = useRef(null);

  // 📹 Live cabin camera — the rider's Live Guard uploads ~5s webm chunks
  // under this same linkId; we poll /latest every 3s and render the newest
  // frame. (Polling is cheap when nothing changed — same chunk ID skips the
  // body download — so faster polling just means fresher footage.)
  // videoMeta tells us how much footage is buffered (last ~2-3 min).
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  // ID (X-Chunk-Id header) of the clip currently on screen. Used to skip
  // re-loading/re-playing the SAME clip when a poll returns no new footage.
  const loadedChunkIdRef = useRef(null);
  // Chunk IDs that failed to play (corrupt slice etc.) — polls skip them
  // so the viewer keeps showing the last GOOD clip instead of flashing
  // black on every 3s poll.
  const badChunkIdsRef = useRef(new Set());
  // Mirror of videoMeta for use inside the playback effect without
  // re-running it on every meta update.
  const videoMetaRef = useRef(null);
  useEffect(() => {
    videoMetaRef.current = videoMeta;
  }, [videoMeta]);

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
  //
  // IMPORTANT: only swap the <video> src when the chunk ID actually
  // changed (X-Chunk-Id header). The rider uploads one ~5s clip every
  // few seconds, but polls can race the upload and get back the SAME
  // clip twice. Re-setting the src for an unchanged clip restarts
  // playback from frame 0 (visible jump) and needlessly re-downloads
  // the bytes. If we skip it, the current clip just keeps looping in
  // place until genuinely new footage arrives.
  useEffect(() => {
    let cancelled = false;
    // Fresh link = nothing on screen yet (also covers navigating between
    // two /track/:linkId pages without a full remount).
    loadedChunkIdRef.current = null;

    const fetchVideo = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/video/stream/${linkId}/latest`, { cache: 'no-store' });
        const contentType = res.headers.get('content-type') || '';
        const chunkId = res.headers.get('X-Chunk-Id');
        if (res.ok && contentType.includes('video/webm')) {
          const sameChunk = chunkId && chunkId === loadedChunkIdRef.current;
          const knownBad = chunkId && badChunkIdsRef.current.has(Number(chunkId));
          if (sameChunk || knownBad) {
            // Already on screen — or this clip proved unplayable and we
            // fell back to an earlier one. Either way: don't swap to it,
            // just let the current clip keep looping.
            if (res.body && res.body.cancel) res.body.cancel();
          } else {
            const blob = await res.blob();
            if (cancelled || !blob.size) return;
            loadedChunkIdRef.current = chunkId || `blob-${Date.now()}`;
            const newUrl = URL.createObjectURL(blob);
            setVideoUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev); // free the old frame
              return newUrl;
            });
          }
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
    // 3s for video (newer footage shows up faster); tracking data still
    // polls every 5s above. Cheap: unchanged chunks are header-only.
    const videoInterval = setInterval(fetchVideo, 3000);
    return () => {
      cancelled = true;
      clearInterval(videoInterval);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [linkId]);

  // 🔧 Every time a NEW 5s chunk's blob URL arrives, the <video> element's
  // src attribute changes — but browsers do NOT automatically resume
  // playback just because `src` changed via React; `autoPlay` only fires
  // on the element's very first mount. Without this, chunk 1 plays fine,
  // then every chunk after it loads but sits paused at frame 0 (black
  // screen). Explicitly reloading + playing on every change fixes that.
  //
  // WHY THE FEED STILL WENT BLACK AFTER ~3s OF PLAYBACK: the rider's
  // clips are MediaRecorder webm blobs, which carry NO duration metadata
  // (video.duration === Infinity). Browsers refuse to honor `loop` on
  // infinite-length media, so each clip played once and then the player
  // stalled on a black frame until the next poll. We loop manually:
  //   1. loadedmetadata — if duration is still Infinity, seek to a huge
  //      time (Chrome/Edge trick) to force the demuxer to resolve the
  //      real (finite) duration; after that `loop` works natively.
  //   2. ended — restart from frame 0.
  //   3. stall watchdog — if the browser fires neither `ended` nor a
  //      finite duration, playback "freezes" at the end of the data;
  //      ~1.5s of no time progress means we've hit the end, so restart.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    let disposed = false;
    let everPlayed = false;   // has this clip ever rendered a frame?
    let fellBack = false;     // only one fallback hop per loaded clip
    let stallRestarts = 0;

    const play = () => {
      const playPromise = videoEl.play();
      if (playPromise && playPromise.catch) {
        // Autoplay can be blocked by the browser (page backgrounded,
        // media blocked for the site, ...). We keep retrying below
        // until the first frame actually renders.
        playPromise.catch(() => {});
      }
    };

    // The clip is unplayable (corrupt slice, undecodable blob, ...).
    // Mark its ID so polls stop trying it, then load the PREVIOUS
    // buffered clip so the viewer keeps watching footage instead of a
    // black box.
    const markBadAndFallBack = () => {
      if (disposed || fellBack) return;
      fellBack = true;
      const id = loadedChunkIdRef.current;
      if (id && !String(id).startsWith('blob-')) {
        badChunkIdsRef.current.add(Number(id));
      }
      const meta = videoMetaRef.current;
      const ids = (meta && meta.chunks ? meta.chunks : []).map(c => c.id);
      let prevId = null;
      if (id && !String(id).startsWith('blob-') && ids.length) {
        const idx = ids.indexOf(Number(id));
        if (idx > 0) prevId = ids[idx - 1];
      } else if (ids.length > 1) {
        prevId = ids[ids.length - 2];
      }
      if (prevId == null) return;
      fetch(`${API_BASE}/api/video/stream/${linkId}/chunk/${prevId}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.blob() : null))
        .then(blob => {
          if (disposed) return;
          if (!blob || !blob.size) return;
          const url = URL.createObjectURL(blob);
          if (disposed) { URL.revokeObjectURL(url); return; }
          loadedChunkIdRef.current = String(prevId);
          setVideoUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch(() => {});
    };

    videoEl.load();
    play();

    const restart = () => {
      try { videoEl.currentTime = 0; } catch (e) { /* ignore */ }
      play();
    };
    const onLoadedMetadata = () => {
      if (videoEl.duration === Infinity) {
        try { videoEl.currentTime = 1e101; } catch (e) { /* ignore */ }
      }
    };
    const onPlaying = () => { everPlayed = true; };
    const onEnded = () => { everPlayed = true; restart(); };
    const onError = () => { markBadAndFallBack(); };
    videoEl.addEventListener('loadedmetadata', onLoadedMetadata);
    videoEl.addEventListener('playing', onPlaying);
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('error', onError);

    // Autoplay retry: muted autoplay is normally allowed, but if the
    // first play() is rejected the element sits paused at 0:00 on a
    // BLACK frame (the exact "black box with a play button" state).
    // Retry once a second until a frame actually renders, then stop.
    let playRetries = 0;
    const playRetry = setInterval(() => {
      if (disposed || everPlayed) return;
      if (!videoEl.paused) return; // already going — wait for 'playing'
      if (++playRetries > 60) { clearInterval(playRetry); return; }
      play();
    }, 1000);

    // Stall watchdog: once a clip's real data is exhausted, playback
    // "freezes" with no progress and no `ended` event. ~1.5s of no
    // movement = hit the end → restart from 0. If the clip NEVER
    // rendered a frame and keeps stalling, it's corrupt → fall back
    // to the previous clip.
    let lastTime = videoEl.currentTime;
    let stalledSince = null;
    const watchdog = setInterval(() => {
      if (disposed || videoEl.paused || videoEl.seeking || videoEl.readyState < 2) return;
      const t = videoEl.currentTime;
      if (Math.abs(t - lastTime) < 0.05) {
        stalledSince = stalledSince || Date.now();
        if (Date.now() - stalledSince > 1500) {
          stalledSince = null;
          if (!everPlayed) {
            if (++stallRestarts >= 3) {
              clearInterval(watchdog);
              markBadAndFallBack();
              return;
            }
          }
          restart(); // hit the (unknown) end of the clip's data
        }
      } else {
        stalledSince = null;
      }
      lastTime = t;
    }, 500);

    return () => {
      disposed = true;
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.removeEventListener('playing', onPlaying);
      videoEl.removeEventListener('ended', onEnded);
      videoEl.removeEventListener('error', onError);
      clearInterval(playRetry);
      clearInterval(watchdog);
    };
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="h-12 w-12 text-green-400 animate-spin mb-4" />
        <p className="text-lg font-bold">Connecting to Smart-AI-Cab Security Feed...</p>
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
          <span className="text-xl font-bold tracking-tight">Smart-AI-Cab Live Tracking</span>
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
                      if (res.status === 404) {
                        alert("Demo tools are disabled on this server. Ask the rider to book a ride and share their link instead.");
                        return;
                      }
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
                  🧪 Create Test Ride (developer only)
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
            feed then updates automatically every 3 seconds. */}
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
                updated every 3s · last {videoMeta.lastTs ? new Date(videoMeta.lastTs).toLocaleTimeString() : '—'}
              </span>
            )}
          </div>
          {videoUrl ? (
            <video
              ref={videoRef}
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
            <RecenterOnMove lat={currentLat} lng={currentLng} />
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
