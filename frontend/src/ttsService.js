/**
 * 🎙️ Centralized Indian Multilingual Text-To-Speech (TTS) Engine
 * Supports Gujarati (gu-IN), Hindi (hi-IN), English (en-IN), Marathi (mr-IN),
 * Bengali (bn-IN), Tamil (ta-IN), Telugu (te-IN), Kannada (kn-IN), Malayalam (ml-IN), Punjabi (pa-IN).
 */

import { API_BASE } from './api';

// Standard Indian BCP-47 Locale Code Registry
export const INDIAN_LANGUAGE_LOCALES = {
  gu: { locale: 'gu-IN', name: 'Gujarati (ગુજરાતી)', label: 'ગુજરાતી' },
  hi: { locale: 'hi-IN', name: 'Hindi (हिन्दी)', label: 'हिन्दी' },
  en: { locale: 'en-IN', name: 'English (India)', label: 'English' },
  mr: { locale: 'mr-IN', name: 'Marathi (मराठी)', label: 'मराठी' },
  bn: { locale: 'bn-IN', name: 'Bengali (বাংলা)', label: 'বাংলা' },
  ta: { locale: 'ta-IN', name: 'Tamil (தமிழ்)', label: 'தமிழ்' },
  te: { locale: 'te-IN', name: 'Telugu (తెలుగు)', label: 'తెలుగు' },
  kn: { locale: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', label: 'ಕನ್ನಡ' },
  ml: { locale: 'ml-IN', name: 'Malayalam (മലയാളം)', label: 'മലയാളം' },
  pa: { locale: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)', label: 'ਪੰਜਾਬੀ' },
};

let activeAudioInstance = null;
let audioCtxInstance = null;

function getAudioContext() {
  if (!audioCtxInstance && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtxInstance = new AudioContextClass();
    }
  }
  if (audioCtxInstance && audioCtxInstance.state === 'suspended') {
    audioCtxInstance.resume().catch(() => {});
  }
  return audioCtxInstance;
}

/**
 * Synthesizes crystal-clear audio tones using browser Web Audio API
 */
export function playSynthesizedChime(frequencies = [523.25, 659.25, 783.99], noteDuration = 0.12, type = 'sine') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    let startTime = ctx.currentTime;
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime + index * noteDuration);

      gain.gain.setValueAtTime(0.001, startTime + index * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + index * noteDuration + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (index + 1) * noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * noteDuration);
      osc.stop(startTime + (index + 1) * noteDuration + 0.05);
    });
  } catch (err) {
    console.warn('Web Audio chime note:', err);
  }
}

/**
 * 🔔 Safety Chime Presets
 */
export const Chimes = {
  driverArrived: () => playSynthesizedChime([587.33, 880, 1174.66], 0.14, 'triangle'),
  tripStarted: () => playSynthesizedChime([440, 554.37, 659.25, 880], 0.1, 'sine'),
  milestoneHalfway: () => playSynthesizedChime([659.25, 783.99, 987.77], 0.12, 'sine'),
  approachingDestination: () => playSynthesizedChime([783.99, 880, 1046.5], 0.12, 'triangle'),
  tripCompleted: () => playSynthesizedChime([523.25, 659.25, 783.99, 1046.5], 0.15, 'sine'),
  sosAlert: () => playSynthesizedChime([880, 440, 880, 440], 0.18, 'sawtooth'),
  securityCheck: () => playSynthesizedChime([523.25, 659.25], 0.12, 'sine')
};

export const MILESTONE_SCRIPTS = {
  DRIVER_ARRIVED: {
    en: "Your driver has arrived at the pickup point. Please verify vehicle plate and enter the cab.",
    hi: "आपके ड्राइवर पिकअप स्थान पर पहुँच चुके हैं। कृपया गाड़ी नंबर चेक करके बैठें।",
    gu: "તમારા ડ્રાઈવર પિકઅપ પોઈન્ટ પર પહોંચી ગયા છે. કૃપા કરીને ગાડી નંબર ચેક કરો.",
    mr: "तुमचे चालक पिकअप ठिकाणी पोहोचले आहेत. कृपया गाडी क्रमांक तपासून बसा.",
    ta: "உங்கள் ஓட்டுநர் பிக்கப் இடத்திற்கு வந்துவிட்டார். வாகன எண்ணை சரிபார்க்கவும்."
  },
  TRIP_STARTED: {
    en: "Trip started. 24/7 AI live GPS guard and route deviation monitoring are now active.",
    hi: "आपकी यात्रा शुरू हो गई है। स्मार्टकैब AI सुरक्षा और लाइव GPS मॉनिटरिंग सक्रिय है।",
    gu: "તમારી રાઈડ શરૂ થઈ ગઈ છે. સ્માર્ટકેબ AI સુરક્ષા અને લાઈવ GPS મોનિટરિંગ સક્રિય છે.",
    mr: "तुमचा प्रवास सुरू झाला आहे. लाईव्ह AI GPS सुरक्षा प्रणाली सक्रिय आहे.",
    ta: "பயணம் தொடங்கியது. நேரலை ஜிபிஎஸ் பாதுகாப்பு கண்காணிக்கப்படுகிறது."
  },
  HALFWAY: {
    en: "You have completed 50% of your trip. The vehicle is following the safest AI-verified route.",
    hi: "आपकी 50% यात्रा पूरी हो चुकी है। गाड़ी सबसे सुरक्षित मार्ग पर चल रही है।",
    gu: "તમારી 50% મુસાફરી પૂર્ણ થઈ છે. ગાડી સૌથી સુરક્ષિત રૂટ પર ચાલી રહી છે.",
    mr: "आपला 50% प्रवास पूर्ण झाला आहे. वाहन सुरक्षित मार्गावर आहे.",
    ta: "பயணத்தில் 50% முடிந்தது. வாகனம் பாதுகாப்பான பாதையில் செல்கிறது."
  },
  APPROACHING_DESTINATION: {
    en: "Approaching your destination in approximately two minutes. Please collect all personal belongings.",
    hi: "लगभग 2 मिनट में आपकी मंज़िल आने वाली है। कृपया अपना सारा सामान साथ ले लें।",
    gu: "લગભગ 2 મિનિટમાં તમારું ગંતવ્ય સ્થાન આવી જશે. કૃપા કરીને તમારો સામાન સાથે લઈ લો.",
    mr: "पुढील 2 मिनिटांत आपले गंतव्यस्थान येईल. कृपया आपले सामान तपासा.",
    ta: "இன்னும் இரண்டு நிமிடங்களில் சேருமிடம் வந்துவிடும். உங்கள் உடமைகளை சரிபார்க்கவும்."
  },
  TRIP_COMPLETED: {
    en: "You have arrived safely. Thank you for riding with Smart Security AI Cab. Have a great day!",
    hi: "आप सुरक्षित पहुँच गए हैं। स्मार्टकैब के साथ यात्रा करने के लिए धन्यवाद। आपका दिन शुभ हो!",
    gu: "તમે સુરક્ષિત રીતે પહોંચી ગયા છો. સ્માર્ટકેબ સાથે મુસાફરી કરવા બદલ આભાર. આપનો દિવસ શુભ રહે!",
    mr: "आपण सुरक्षितपणे पोहोचला आहात. स्मार्टकॅब निवडल्याबद्दल धन्यवाद!",
    ta: "பாதுகாப்பாக வந்து சேர்ந்தீர்கள். ஸ்மார்ட்கேப் உடன் பயணித்ததற்கு நன்றி!"
  }
};

/**
 * Spoken trip milestone announcer
 */
export async function announceMilestone(milestoneKey, lang = 'gu-IN') {
  const shortLang = lang.split('-')[0].toLowerCase();
  const scriptGroup = MILESTONE_SCRIPTS[milestoneKey];
  if (!scriptGroup) return;

  const textToSpeak = scriptGroup[shortLang] || scriptGroup['en'];

  // 1. Play corresponding chime
  if (milestoneKey === 'DRIVER_ARRIVED') Chimes.driverArrived();
  else if (milestoneKey === 'TRIP_STARTED') Chimes.tripStarted();
  else if (milestoneKey === 'HALFWAY') Chimes.milestoneHalfway();
  else if (milestoneKey === 'APPROACHING_DESTINATION') Chimes.approachingDestination();
  else if (milestoneKey === 'TRIP_COMPLETED') Chimes.tripCompleted();

  // 2. Speak milestone text with slight pause
  setTimeout(() => {
    playTextToSpeech(textToSpeak, lang);
  }, 400);
}

/**
 * Converts text into natural spoken audio in the specified Indian locale.
 * @param {string} text - The AI text response to speak
 * @param {string} languageCode - e.g. "gu-IN", "hi-IN", "en-IN", "mr-IN"
 * @param {Object} options - playback options
 */
export async function playTextToSpeech(text, languageCode = 'gu-IN', options = {}) {
  if (!text || !text.trim()) return;

  // Stop any currently playing audio
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch (e) { /* ignore */ }
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // 1. Primary: High-fidelity Server-side Studio Indian Audio stream
  try {
    const res = await fetch(`${API_BASE}/api/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        language: languageCode
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.audioBase64) {
        const audio = new Audio(data.audioBase64);
        activeAudioInstance = audio;
        await audio.play();
        return { source: 'studio_tts', success: true };
      }
    }
  } catch (err) {
    console.warn('Backend studio TTS stream note:', err.message);
  }

  // 2. Fallback: Client-Side Web Speech API with Indic Voice Matcher
  if ('speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = languageCode.split('-')[0].toLowerCase();
        let match = voices.find(
          (v) => v.lang.toLowerCase().startsWith(langPrefix) || v.lang.includes(languageCode)
        );
        if (!match && langPrefix === 'gu') {
          // If Windows/Android lacks standalone Gujarati voice, use high-quality Hindi Indian voice
          match = voices.find((v) => v.lang.startsWith('hi') || v.lang.includes('hi-IN'));
        }
        if (!match) {
          match = voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India'));
        }
        if (match) utterance.voice = match;
      }

      window.speechSynthesis.speak(utterance);
      return { source: 'web_speech', success: true };
    } catch (e) {
      console.warn('Client speech synthesis fallback error:', e);
    }
  }

  return { source: 'none', success: false };
}

