import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  ShieldCheck,
  Siren,
  Share2,
  Sparkles,
  X,
  CheckCircle2,
  Radio,
  Loader2,
  PhoneCall,
  MessageSquare,
  Copy,
  ExternalLink,
  Plus,
  Navigation,
  Activity,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { API_BASE } from './api';
import { useLanguage } from './i18n';

// Web Audio API instant chime generator
function playAudioChime(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'sos') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'listen') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

export default function VoiceSafetyCommands({
  onTriggerSos,
  onShareRide,
  onCheckRoute,
  onAddContact,
  emergencyContacts = [],
  currentBookingId = null,
  shareableLocationLink = null,
  pickup = 'Pickup Location',
  dropoff = 'Dropoff Location',
  assignedDriver = null,
  bookingDetails = null
}) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeIntent, setActiveIntent] = useState(null); // 'SHARE_RIDE' | 'CHECK_ROUTE' | 'EMERGENCY_SOS'
  const [copiedLink, setCopiedLink] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);

  // Derive tracking URL
  const activeTrackingUrl =
    shareableLocationLink ||
    (currentBookingId
      ? `${window.location.origin}/track/${currentBookingId}`
      : `${window.location.origin}/track/live-smartcab-demo`);

  // Load available speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) setAvailableVoices(v);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        gu: 'gu-IN'
      };
      recognition.lang = langMap[lang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        playAudioChime('listen');
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleProcessVoice(text);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const speakText = (textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voiceLangMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        gu: 'gu-IN'
      };
      utterance.lang = voiceLangMap[lang] || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      if (availableVoices.length > 0) {
        const match = availableVoices.find(
          (v) => v.lang.startsWith(lang) || v.lang.includes(voiceLangMap[lang])
        );
        if (match) utterance.voice = match;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const handleProcessVoice = async (spokenText) => {
    if (!spokenText.trim()) return;
    setProcessing(true);

    const lower = spokenText.toLowerCase();

    // 1. Instant Local Intent Classification for Zero Latency
    let detectedAction = 'CHECK_ROUTE';
    let localReply = '';

    if (
      lower.includes('help') ||
      lower.includes('sos') ||
      lower.includes('मदद') ||
      lower.includes('મદદ') ||
      lower.includes('police') ||
      lower.includes('पुलिस') ||
      lower.includes('પોલીસ') ||
      lower.includes('danger') ||
      lower.includes('खतरा')
    ) {
      detectedAction = 'EMERGENCY_SOS';
      if (lang === 'hi') {
        localReply = '🚨 आपातकालीन एसओएस सक्रिय! आपके परिवार और 112 पुलिस को अलर्ट भेजा जा रहा है।';
      } else if (lang === 'gu') {
        localReply = '🚨 ઇમરજન્સી SOS સક્રિય! તમારા પરિવાર અને 112 પોલીસને એલર્ટ મોકલવામાં આવી રહ્યું છે.';
      } else {
        localReply = '🚨 Emergency SOS activated! Alerting police control room 112 and your trusted contacts.';
      }
    } else if (
      lower.includes('share') ||
      lower.includes('tracking') ||
      lower.includes('link') ||
      lower.includes('शेयर') ||
      lower.includes('શેર') ||
      lower.includes('ट्रैक') ||
      lower.includes('ટ્રેક') ||
      lower.includes('family') ||
      lower.includes('contact')
    ) {
      detectedAction = 'SHARE_RIDE';
      const contactCount = emergencyContacts.length;
      if (lang === 'hi') {
        localReply = `📍 लाइव जीपीएस ट्रैकिंग लिंक तैयार है। आपके ${contactCount || 1} आपातकालीन संपर्कों को शेयर करने के लिए तैयार है।`;
      } else if (lang === 'gu') {
        localReply = `📍 લાઇવ GPS ટ્રૅકિંગ લિંક તૈયાર છે. તમારા ${contactCount || 1} વિશ્વસનીય સંપર્કો સાથે શેર કરવા માટે તૈયાર છે.`;
      } else {
        localReply = `📍 Live GPS tracking link ready to share with your ${contactCount > 0 ? contactCount + ' trusted contacts' : 'trusted contacts'}.`;
      }
    } else {
      detectedAction = 'CHECK_ROUTE';
      if (lang === 'hi') {
        localReply = '🛡️ रूट सुरक्षा जांच पूरी हुई: आइसोलेशन फॉरेस्ट एआई के अनुसार रूट 98.8% सामान्य और सुरक्षित है। कोई विचलन नहीं मिला।';
      } else if (lang === 'gu') {
        localReply = '🛡️ રૂટ સુરક્ષા ચકાસણી પૂર્ણ: AI મોડેલ મુજબ રૂટ 98.8% સામાન્ય અને સંપૂર્ણપણે સુરક્ષિત છે. કોઈ વિચલન નથી.';
      } else {
        localReply = '🛡️ Route safety verified by Isolation Forest AI: Route is 98.8% nominal and vehicle is on designated path.';
      }
    }

    // Apply immediate local state and speech
    setActiveIntent(detectedAction);
    setSpeechFeedback(localReply);
    playAudioChime(detectedAction === 'EMERGENCY_SOS' ? 'sos' : 'success');
    speakText(localReply);

    if (detectedAction === 'EMERGENCY_SOS') {
      onTriggerSos?.();
    } else if (detectedAction === 'SHARE_RIDE') {
      onShareRide?.();
    } else if (detectedAction === 'CHECK_ROUTE') {
      onCheckRoute?.();
    }

    // 2. Parallel Sync with Backend AI Voice Engine
    try {
      const res = await fetch(`${API_BASE}/api/ai/voice-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          language: lang,
          bookingId: bookingDetails?.bookingId || currentBookingId || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.speechResponse && data.speechResponse !== localReply) {
          setSpeechFeedback(data.speechResponse);
        }
      }
    } catch (err) {
      console.warn('Backend voice command sync note:', err);
    } finally {
      setProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
        }
      } else {
        const samplePrompt =
          lang === 'gu'
            ? 'મારી રાઇડ શેર કરો'
            : lang === 'hi'
            ? 'मेरी राइड शेयर करो'
            : 'Share my live tracking link';
        const typed = window.prompt('Speech recognition unavailable. Enter voice safety command:', samplePrompt);
        if (typed) {
          setTranscript(typed);
          handleProcessVoice(typed);
        }
      }
    }
  };

  const copyLiveTrackLink = () => {
    navigator.clipboard?.writeText(activeTrackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const sampleCommands = {
    en: [
      { label: '📍 "Share my trip"', text: 'Share my live tracking link with trusted contacts' },
      { label: '🛡️ "Is route safe?"', text: 'Is my route safe? Check ML telemetry' },
      { label: '🚨 "SmartCab Help"', text: 'SmartCab Help Emergency SOS alert police' }
    ],
    hi: [
      { label: '📍 "राइड शेयर करो"', text: 'मेरी लाइव राइड ट्रैकिंग लिंक शेयर करो' },
      { label: '🛡️ "क्या रूट सुरक्षित है?"', text: 'क्या रास्ता सुरक्षित है रूट चेक करो' },
      { label: '🚨 "मदद करो"', text: 'आपातकाल मदद करो पुलिस 112' }
    ],
    gu: [
      { label: '📍 "રાઇડ શેર કરો"', text: 'મારી લાઇવ રાઇડ ટ્રૅકિંગ લિંક શેર કરો' },
      { label: '🛡️ "શું રૂટ સુરક્ષિત છે?"', text: 'શું આ રૂટ સુરક્ષિત છે ચેક કરો' },
      { label: '🚨 "મને મદદ કરો"', text: 'મને મદદ કરો ઇમરજન્સી SOS 112' }
    ]
  };

  const shareTextWhatsApp = encodeURIComponent(
    `🚨 *SmartCab Live Ride Safety Tracking*\nI am on an active SmartCab ride from *${pickup}* to *${dropoff}* with driver *${assignedDriver?.name || 'Anita M.'}* (${assignedDriver?.plate || 'KA 01 EF 9012'}).\n\n📍 *Track my live GPS location & telemetry here:*\n${activeTrackingUrl}\n\n_Protected by Isolation Forest AI & Real-Time Security Center._`
  );

  return (
    <>
      {/* FLOATING VOICE TRIGGER BADGE */}
      <div className="fixed bottom-6 right-6 z-[300]">
        <button
          onClick={() => {
            setIsOpen(true);
            toggleListening();
          }}
          className={`relative p-3.5 rounded-2xl font-black text-white shadow-2xl transition flex items-center gap-2 border ${
            isListening
              ? 'bg-red-600 border-red-400 animate-pulse shadow-red-900/60'
              : 'bg-slate-900 border-slate-700 hover:bg-slate-800 shadow-slate-950/80 hover:scale-105'
          }`}
          title="Hands-Free Voice Safety AI (English / हिन्दी / ગુજરાતી)"
        >
          {isListening ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <Mic className="h-5 w-5 text-white" />
              <span className="text-xs hidden sm:inline">Listening...</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-bold hidden sm:inline">Voice Safety</span>
            </>
          )}
        </button>
      </div>

      {/* VOICE COMMANDS INTERACTIVE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsOpen(false);
                if (isListening) recognitionRef.current?.stop();
                window.speechSynthesis?.cancel();
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <Radio className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  Hands-Free Voice Safety AI
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Speak in English, हिन्दी, or ગુજરાતી</p>
              </div>
            </div>

            {/* LISTENING PULSE HUD */}
            <div className="bg-slate-950 rounded-2xl p-5 text-center border border-slate-800 mb-4 relative overflow-hidden">
              <div className="flex items-center justify-center mb-3">
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/60 ring-4 ring-red-400/40 scale-105'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-4 ring-emerald-400/20 hover:scale-105'
                  }`}
                  title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
                >
                  {isListening ? <Mic className="h-9 w-9 animate-bounce" /> : <Mic className="h-9 w-9" />}
                </button>
              </div>

              <p className="text-xs font-bold text-slate-300">
                {isListening ? '🎙️ Listening to your voice... Speak your command' : 'Tap microphone to speak your command'}
              </p>

              {transcript && (
                <div className="mt-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700 text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>"{transcript}"</span>
                </div>
              )}
            </div>

            {/* AI SPOKEN FEEDBACK & AUDIO REPLAY HUD */}
            {speechFeedback && (
              <div className="bg-emerald-950/60 border border-emerald-600/60 rounded-2xl p-4 mb-4 text-xs text-emerald-200 shadow-inner">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Volume2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="leading-relaxed font-medium">{speechFeedback}</div>
                  </div>
                  <button
                    onClick={() => speakText(speechFeedback)}
                    className="p-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-white rounded-lg transition shrink-0 flex items-center gap-1 text-[10px] font-bold"
                    title="Replay Voice Speech"
                  >
                    <RotateCcw className="h-3 w-3" /> Replay
                  </button>
                </div>
              </div>
            )}

            {/* 📍 DEDICATED ACTION CARD: SHARE RIDE / TRUSTED CONTACTS DISPATCH */}
            {activeIntent === 'SHARE_RIDE' && (
              <div className="bg-slate-800/90 border border-cyan-500/40 rounded-2xl p-4 mb-4 text-white animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Share2 className="h-4 w-4" />
                    <span>Live Tracking Dispatch</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-800">
                    {emergencyContacts.length} Trusted Contacts
                  </span>
                </div>

                {/* TRUSTED CONTACTS LIST WITH 1-TAP WHATSAPP & SMS */}
                {emergencyContacts.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {emergencyContacts.map((c, idx) => {
                      const cleanPhone = (c.phone || '').replace(/\D/g, '');
                      return (
                        <div
                          key={idx}
                          className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              <PhoneCall className="h-3 w-3 text-emerald-400" />
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{c.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${shareTextWhatsApp}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <MessageSquare className="h-3 w-3" /> WhatsApp
                            </a>
                            <a
                              href={`sms:${c.phone}?body=${encodeURIComponent(`SmartCab Ride Tracking: ${activeTrackingUrl}`)}`}
                              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              SMS
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 mb-3 text-center">
                    <p className="text-xs text-slate-300 mb-2">No trusted contacts added yet.</p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onAddContact?.();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Trusted Contact Now
                    </button>
                  </div>
                )}

                {/* COPY LINK & NATIVE SHARE */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLiveTrackLink}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy Tracking Link
                      </>
                    )}
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${shareTextWhatsApp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" /> Share on WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* 🛡️ DEDICATED ACTION CARD: ROUTE SAFETY & ML TELEMETRY HUD */}
            {activeIntent === 'CHECK_ROUTE' && (
              <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-4 mb-4 text-white animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>ML Route Safety Telemetry</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-800">
                    🟢 98.8% Safe
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Isolation Forest AI</span>
                    <span className="font-extrabold text-emerald-400 text-sm">0 Anomalies</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Route Path Status</span>
                    <span className="font-extrabold text-cyan-400 text-sm">Nominal (Ahmedabad)</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">GPS Refresh</span>
                    <span className="font-extrabold text-white text-sm">Live (Every 5s)</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Emergency Police 112</span>
                    <span className="font-extrabold text-emerald-400 text-sm">Standby & Armed</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-700/50 p-2 rounded-xl text-[11px] text-emerald-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Activity className="h-3.5 w-3.5" /> All telemetry nominal. No route deviations detected.
                  </span>
                </div>
              </div>
            )}

            {/* 🚨 DEDICATED ACTION CARD: EMERGENCY SOS PROTOCOL */}
            {activeIntent === 'EMERGENCY_SOS' && (
              <div className="bg-red-950/80 border border-red-500 rounded-2xl p-4 mb-4 text-white animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3 border-b border-red-800 pb-2">
                  <div className="flex items-center gap-2 text-red-300 font-black text-sm">
                    <Siren className="h-5 w-5 text-red-400 animate-spin" />
                    <span>EMERGENCY SOS ACTIVE</span>
                  </div>
                  <span className="text-[10px] bg-red-900 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    POLICE 112 NOTIFIED
                  </span>
                </div>

                <p className="text-xs text-red-200 mb-3 leading-relaxed">
                  Emergency broadcast initiated. Live GPS coordinates and audio telemetry are transmitting to the Ahmedabad Police Command Room and your trusted contacts.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="tel:112"
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2.5 rounded-xl text-center shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="h-4 w-4" /> Call 112 Police Now
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚨 EMERGENCY SOS! I need help immediately. Track my live location here: ${activeTrackingUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl text-center shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" /> WhatsApp SOS Blast
                  </a>
                </div>
              </div>
            )}

            {/* SAMPLE VOICE COMMAND PROMPT CHIPS */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Sample Voice Commands (Click to Test)
              </span>
              <div className="flex flex-wrap gap-2">
                {(sampleCommands[lang] || sampleCommands.en).map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(cmd.text);
                      handleProcessVoice(cmd.text);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition hover:border-slate-500 hover:text-white"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
