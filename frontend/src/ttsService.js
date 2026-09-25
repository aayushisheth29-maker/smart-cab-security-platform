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
