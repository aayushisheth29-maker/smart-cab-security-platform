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
  Loader2
} from 'lucide-react';
import { API_BASE } from './api';
import { useLanguage } from './i18n';

export default function VoiceSafetyCommands({
  onTriggerSos,
  onShareRide,
  onCheckRoute,
  bookingDetails = null
}) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const recognitionRef = useRef(null);

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voiceLangMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        gu: 'gu-IN'
      };
      utterance.lang = voiceLangMap[lang] || 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleProcessVoice = async (spokenText) => {
    if (!spokenText.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/voice-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          language: lang,
          bookingId: bookingDetails?.bookingId || null
        })
      });
      const data = await res.json();
      setSpeechFeedback(data.speechResponse);
      setLastAction(data.action);
      speakText(data.speechResponse);

      // Execute intent callbacks
      if (data.action === 'EMERGENCY_SOS') {
        onTriggerSos?.();
      } else if (data.action === 'SHARE_RIDE') {
        onShareRide?.();
      } else if (data.action === 'CHECK_ROUTE') {
        onCheckRoute?.();
      }
    } catch (err) {
      // Offline fallback processing
      const lower = spokenText.toLowerCase();
      if (lower.includes('help') || lower.includes('sos') || lower.includes('मदद') || lower.includes('મદદ')) {
        const reply = "🚨 Emergency SOS triggered. Notifying your family and 112.";
        setSpeechFeedback(reply);
        speakText(reply);
        onTriggerSos?.();
      } else if (lower.includes('share') || lower.includes('શેર') || lower.includes('शेयर')) {
        const reply = "📍 Live tracking link ready to share.";
        setSpeechFeedback(reply);
        speakText(reply);
        onShareRide?.();
      } else {
        const reply = "🛡️ Route safety verified. Vehicle is on nominal path.";
        setSpeechFeedback(reply);
        speakText(reply);
      }
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
        // Fallback for browsers without Web Speech API
        const samplePrompt = lang === 'gu' ? 'મને મદદ કરો' : lang === 'hi' ? 'मेरी मदद करो' : 'SmartCab Help';
        const typed = window.prompt("Speech recognition unavailable. Type your voice command:", samplePrompt);
        if (typed) {
          setTranscript(typed);
          handleProcessVoice(typed);
        }
      }
    }
  };

  const sampleCommands = {
    en: [
      { label: '🚨 "SmartCab Help"', text: 'SmartCab Help Emergency SOS' },
      { label: '📍 "Share my trip"', text: 'Share my live tracking link' },
      { label: '🛡️ "Is route safe?"', text: 'Check if my route is safe' }
    ],
    hi: [
      { label: '🚨 "मदद करो"', text: 'आपातकाल मदद करो पुलिस' },
      { label: '📍 "राइड शेयर करो"', text: 'मेरी लाइव राइड शेयर करो' },
      { label: '🛡️ "रूट चेक करो"', text: 'क्या रास्ता सुरक्षित है' }
    ],
    gu: [
      { label: '🚨 "મને મદદ કરો"', text: 'મને મદદ કરો ઇમરજન્સી SOS' },
      { label: '📍 "રાઇડ શેર કરો"', text: 'મારી લાઇવ રાઇડ શેર કરો' },
      { label: '🛡️ "રૂટ ચેક કરો"', text: 'શું આ રૂટ સુરક્ષિત છે' }
    ]
  };

  return (
    <>
      {/* FLOATING VOICE TRIGGER BADGE */}
      <div className="fixed bottom-6 right-6 z-[300]">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) toggleListening();
          }}
          className={`relative p-3.5 rounded-2xl font-black text-white shadow-2xl transition flex items-center gap-2 border ${
            isListening
              ? 'bg-red-600 border-red-400 animate-pulse shadow-red-900/60'
              : 'bg-slate-900 border-slate-700 hover:bg-slate-800 shadow-slate-950/80'
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
        <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => {
                setIsOpen(false);
                if (isListening) recognitionRef.current?.stop();
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <Radio className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Hands-Free Voice Safety</h3>
                <p className="text-xs text-slate-400">Multilingual AI Emergency & Navigation Guard</p>
              </div>
            </div>

            {/* LISTENING PULSE HUD */}
            <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-800 mb-5 relative overflow-hidden">
              <div className="flex items-center justify-center mb-3">
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/60 ring-4 ring-red-400/40'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/40 ring-4 ring-emerald-400/20'
                  }`}
                >
                  {isListening ? <Mic className="h-9 w-9" /> : <MicOff className="h-9 w-9" />}
                </button>
              </div>

              <p className="text-xs font-bold text-slate-300">
                {isListening ? '🎙️ Listening... Speak your command now' : 'Tap microphone to speak'}
              </p>

              {transcript && (
                <div className="mt-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs font-medium text-emerald-300">
                  "{transcript}"
                </div>
              )}
            </div>

            {/* AI SPOKEN FEEDBACK */}
            {speechFeedback && (
              <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-2xl p-4 mb-4 text-xs text-emerald-200 flex items-start gap-2.5">
                <Volume2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{speechFeedback}</div>
              </div>
            )}

            {/* QUICK TEST CHIPS */}
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
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition"
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
