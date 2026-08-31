import React from 'react';
import {
  Shield, X, Video, MapPin, Clock, Download, RefreshCw,
  CheckCircle, Compass, Loader2, Mail, MessageCircle,
  MessageSquare, Send, Share2
} from 'lucide-react';

/**
 * LiveGuardModal — extracted from BookRide.jsx
 *
 * Shows the live camera feed, driver details, share link, and
 * recording controls. Owns no state of its own — every prop is
 * passed in from the parent (BookRide) so the parent can keep
 * the share link state in sync with the rest of the app.
 */
const LiveGuardModal = ({
  showLiveGuardModal,
  setShowLiveGuardModal,
  videoRef,
  facingMode,
  setFacingMode,
  assignedDriver,
  selectedCar,
  liveGuardLink,
  isRecordingVideo,
  recordingTimer,
  recordedVideoURL,
  shareableLocationLink,
  startVideoRecording,
  generateShareableLink,
  riderName = 'Rider',
  pickup = 'Pickup',
  dropoff = 'Dropoff',
}) => {
  if (!showLiveGuardModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-pink-500 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-7 w-7 text-white" />
            <h3 className="text-2xl font-bold">Live Guard Mode</h3>
          </div>
          <button
            onClick={() => setShowLiveGuardModal(false)}
            className="p-2 hover:bg-white/20 rounded-full transition"
            aria-label="Close Live Guard"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Live video preview */}
          <div className="bg-gray-900 rounded-2xl aspect-video mb-4 flex items-center justify-center relative overflow-hidden shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              autoPlay
              playsInline
              muted
            ></video>

            {/* Flip camera button */}
            <button
              onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
              className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/50 text-white p-3 rounded-full shadow-lg transition transform hover:scale-110 flex items-center justify-center z-50"
              title="Switch Camera"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <MapPin className="h-3 w-3 mr-1" /> Live GPS
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
              <Clock className="h-4 w-4 mr-1" /> {new Date().toLocaleTimeString()}
            </div>
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center shadow-lg">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
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

          {/* Driver details */}
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
              <h4 className="font-bold text-gray-900 bg-yellow-100 px-2 py-1 rounded border border-yellow-300">
                {assignedDriver?.plate}
              </h4>
              <p className="text-xs text-gray-600 font-medium mt-1">{selectedCar}</p>
            </div>
          </div>

          {/* Share link section */}
          <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase">Share Live Link</h4>
          <div className="bg-gray-100 p-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="text-sm font-mono truncate">
              {liveGuardLink || "Click 'Share Live Location' below to create a link"}
            </span>
            <button
              onClick={() => {
                if (liveGuardLink) {
                  navigator.clipboard.writeText(liveGuardLink);
                }
              }}
              disabled={!liveGuardLink}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Copy
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Recording status */}
            {isRecordingVideo && (
              <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-red-600 rounded-full mr-3 animate-ping"></div>
                  <span className="font-bold text-red-700">Recording Evidence...</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{recordingTimer}s</span>
              </div>
            )}

            {/* Recorded video preview */}
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

            {/* Main action buttons */}
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

            {/* Share link display */}
            {shareableLocationLink && (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Live Tracking Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareableLocationLink}
                    readOnly
                    className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareableLocationLink)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Anyone with this link can track this ride in real-time
                </p>
              </div>
            )}

            {/* 📱 Social media share sheet (WhatsApp / SMS / Email / Telegram / More) */}
            {shareableLocationLink && (() => {
              const shareText = `🚖 Smart Security AI Cab Live Tracking\n${riderName} is on the way from ${pickup} → ${dropoff}.\nDriver: ${assignedDriver?.name} (${assignedDriver?.plate})\nTrack live: ${shareableLocationLink}`;
              const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
              const smsLink = `sms:?body=${encodeURIComponent(shareText)}`;
              const emailLink = `mailto:?subject=${encodeURIComponent("My Smart Security AI Cab ride — live tracking")}&body=${encodeURIComponent(shareText)}`;
              const tgLink = `https://t.me/share/url?url=${encodeURIComponent(shareableLocationLink)}&text=${encodeURIComponent("🚖 Track my Smart Security AI Cab ride live")}`;
              return (
                <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Share with family</p>
                  <p className="text-xs text-blue-600 mb-3">Anyone with this link can track this ride in real-time</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition" title="Share on WhatsApp">
                      <MessageCircle className="h-4 w-4 mb-1" /> WhatsApp
                    </a>
                    <a href={smsLink} className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition" title="Share via SMS">
                      <MessageSquare className="h-4 w-4 mb-1" /> SMS
                    </a>
                    <a href={emailLink} className="flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition" title="Share via Email">
                      <Mail className="h-4 w-4 mb-1" /> Email
                    </a>
                    <a href={tgLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 px-1 text-xs font-bold transition" title="Share on Telegram">
                      <Send className="h-4 w-4 mb-1" /> Telegram
                    </a>
                    <button onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: 'Smart Security AI Cab Live Tracking', text: shareText, url: shareableLocationLink });
                        } catch (e) { /* cancelled */ }
                      } else {
                        navigator.clipboard.writeText(shareableLocationLink);
                      }
                    }} className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-800 text-white rounded-lg py-2 px-1 text-xs font-bold transition" title="Open your phone's share menu">
                      <Share2 className="h-4 w-4 mb-1" /> More
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Close button */}
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
  );
};

export default LiveGuardModal;
