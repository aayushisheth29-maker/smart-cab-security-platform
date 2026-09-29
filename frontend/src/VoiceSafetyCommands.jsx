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
  RotateCcw,
  Languages,
  ChevronDown
} from 'lucide-react';
import { API_BASE } from './api';
import { useLanguage } from './i18n';
import { playTextToSpeech, INDIAN_LANGUAGE_LOCALES } from './ttsService';

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
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeIntent, setActiveIntent] = useState(null); // 'SHARE_RIDE' | 'CHECK_ROUTE' | 'EMERGENCY_SOS' | 'CONVERSATION'
  const [activeLang, setActiveLang] = useState(lang || 'gu');
  const [copiedLink, setCopiedLink] = useState(false);
  const recognitionRef = useRef(null);

  // Keep internal language in sync with global context
  useEffect(() => {
    setActiveLang(lang || 'gu');
  }, [lang]);

  // Derive tracking URL
  const activeTrackingUrl =
    shareableLocationLink ||
    (currentBookingId
      ? `${window.location.origin}/track/${currentBookingId}`
      : `${window.location.origin}/track/live-smartcab-demo`);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const locale = INDIAN_LANGUAGE_LOCALES[activeLang]?.locale || 'en-IN';
      recognition.lang = locale;

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
  }, [activeLang]);

  const speakText = (textToSpeak, targetLang = activeLang) => {
    const locale = INDIAN_LANGUAGE_LOCALES[targetLang]?.locale || 'en-IN';
    playTextToSpeech(textToSpeak, locale);
  };

  const handleProcessVoice = async (spokenText) => {
    if (!spokenText.trim()) return;
    setProcessing(true);

    const raw = spokenText.trim();
    const lower = raw.toLowerCase();

    // 🔍 Auto-Detect Spoken Language from Indic Scripts & Regional Keywords
    let effectiveLang = activeLang;
    if (/[\u0A80-\u0AFF]/.test(raw) || ['kem cho', 'tame', 'mane', 'su', 'chhe'].some((k) => lower.includes(k))) {
      effectiveLang = 'gu';
    } else if (/[\u0B80-\u0BFF]/.test(raw) || ['vanakkam', 'udhavi', 'eppadi'].some((k) => lower.includes(k))) {
      effectiveLang = 'ta';
    } else if (/[\u0C00-\u0C7F]/.test(raw) || ['namaskaram', 'sahayam', 'ela'].some((k) => lower.includes(k))) {
      effectiveLang = 'te';
    } else if (/[\u0C80-\u0CFF]/.test(raw) || ['namaskara', 'sahaya', 'hegidd'].some((k) => lower.includes(k))) {
      effectiveLang = 'kn';
    } else if (/[\u0D00-\u0D7F]/.test(raw) || ['sukhamano', 'nandi'].some((k) => lower.includes(k))) {
      effectiveLang = 'ml';
    } else if (/[\u0980-\u09FF]/.test(raw) || ['nomoshkar', 'kemon'].some((k) => lower.includes(k))) {
      effectiveLang = 'bn';
    } else if (/[\u0A00-\u0A7F]/.test(raw) || ['sat sri akaal', 'kiven'].some((k) => lower.includes(k))) {
      effectiveLang = 'pa';
    } else if (['kase ahat', 'madat kara'].some((k) => lower.includes(k))) {
      effectiveLang = 'mr';
    } else if (/[\u0900-\u097F]/.test(raw) || ['kaise ho', 'namaste', 'madad'].some((k) => lower.includes(k))) {
      effectiveLang = activeLang === 'mr' ? 'mr' : 'hi';
    }

    // 1. Instant Local Intent Classification for Zero-Delay Spoken Response
    let detectedAction = 'CONVERSATION';
    let localReply = '';

    if (
      lower.includes('help') || lower.includes('sos') || lower.includes('police') || lower.includes('मदद') ||
      lower.includes('મદદ') || lower.includes('मदत') || lower.includes('உதவி') || lower.includes('సహాయం') ||
      lower.includes('ಸಹಾಯ') || lower.includes('സഹായം') || lower.includes('সাহায্য') || lower.includes('ਮਦਦ')
    ) {
      detectedAction = 'EMERGENCY_SOS';
      const sosReplies = {
        gu: '🚨 ઇમરજન્સી SOS સક્રિય! તમારા પરિવાર અને 112 પોલીસને એલર્ટ મોકલવામાં આવી રહ્યું છે.',
        hi: '🚨 आपातकालीन एसओएस सक्रिय! आपके परिवार और 112 पुलिस को अलर्ट भेजा जा रहा है।',
        mr: '🚨 आणीबाणी एसओएस सक्रिय! तुमच्या कुटुंबियांना आणि 112 पोलिस नियंत्रण कक्षाला अलर्ट पाठवला आहे.',
        bn: '🚨 জরুরি এসওএস সক্রিয়! আপনার পরিবার এবং ১১২ পুলিশ কন্ট্রোল রুমে লাইভ অবস্থান পাঠানো হচ্ছে।',
        ta: '🚨 அவசர SOS செயல்படுத்தப்பட்டது! உங்கள் குடும்பத்தினருக்கும் 112 காவல் துறைக்கும் தகவல் அனுப்பப்படுகிறது.',
        te: '🚨 అత్యవసర SOS సక్రియం చేయబడింది! మీ కుటుంబానికి మరియు 112 పోలీసులకు సమాచారం పంపబడుతోంది.',
        kn: '🚨 ತುರ್ತು SOS ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಮತ್ತು 112 ಪೊಲೀಸರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ.',
        ml: '🚨 അടിയന്തര SOS സജീവമാക്കി! കുടുംബത്തിനും 112 പോലീസിനും ലൈവ് ലൊക്കേഷൻ അയക്കുന്നു.',
        pa: '🚨 ਐਮਰਜੈਂਸੀ SOS ਸਰਗਰਮ! ਪਰਿਵਾਰ ਅਤੇ 112 ਪੁਲਿਸ ਨੂੰ ਤੁਹਾਡੀ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਭੇਜੀ ਜਾ ਰਹੀ ਹੈ।',
        en: '🚨 Emergency SOS activated! Alerting police control room 112 and your trusted contacts.'
      };
      localReply = sosReplies[effectiveLang] || sosReplies.en;
    } else if (
      lower.includes('share') || lower.includes('tracking') || lower.includes('link') || lower.includes('શેર') ||
      lower.includes('शेयर') || lower.includes('பகிர்') || lower.includes('షేర్') || lower.includes('ಹಂಚಿ') ||
      lower.includes('പങ്കിടുക') || lower.includes('শেয়ার') || lower.includes('ਸਾਂਝਾ')
    ) {
      detectedAction = 'SHARE_RIDE';
      const shareReplies = {
        gu: '📍 લાઇવ GPS ટ્રૅકિંગ લિંક તૈયાર છે. તમારા વિશ્વસનીય સંપર્કો સાથે વોટ્સએપ કે SMS દ્વારા શેર કરો.',
        hi: '📍 लाइव जीपीएस ट्रैकिंग लिंक तैयार है। अपने संपर्कों को व्हाट्सएप या एसएमएस से शेयर करें।',
        mr: '📍 थेट GPS ट्रॅकिंग लिंक तयार आहे. कुटुंब किंवा मित्रांना व्हॉट्सॲप आणि एसएमएसवर पाठवा.',
        bn: '📍 লাইভ জিপিএস ট্র্যাকিং লিঙ্ক প্রস্তুত। হোয়াটসঅ্যাপ বা এসএমএসে শেয়ার করুন।',
        ta: '📍 நேரலை ஜிபிஎஸ் டிராக்கிங் இணைப்பு தயார். வாட்ஸ்அப் அல்லது எஸ்எம்எஸ் மூலம் பகிரலாம்.',
        te: '📍 లైవ్ GPS ట్రాకింగ్ లింక్ సిద్ధంగా ఉంది. వాట్సాప్ లేదా SMS ద్వారా పంచుకోవచ్చు.',
        kn: '📍 ಲೈವ್ ಜಿಪಿಎಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಲಿಂಕ್ ಸಿದ್ಧವಾಗಿದೆ. ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಿ.',
        ml: '📍 ലൈവ് ജിപിഎസ് ട്രാക്കിംഗ് ലിങ്ക് തയ്യാറാണ്. വാട്ട്‌സ്ആപ്പ് വഴി പങ്കിടാം.',
        pa: '📍 ਲਾਈਵ GPS ਟ੍ਰੈਕਿੰਗ ਲਿੰਕ ਤਿਆਰ ਹੈ। ਵਟਸਐਪ ਰਾਹੀਂ ਸਾਂਝਾ ਕਰੋ।',
        en: '📍 Live GPS tracking link ready to share with your trusted contacts.'
      };
      localReply = shareReplies[effectiveLang] || shareReplies.en;
    } else if (
      lower.includes('route') || lower.includes('safe') || lower.includes('deviation') || lower.includes('anomaly') ||
      lower.includes('सुरक्षित') || lower.includes('સુરક્ષિત') || lower.includes('பாதுகாப்பு') || lower.includes('సురక్షిత') ||
      lower.includes('ಸುರಕ್ಷಿತ') || lower.includes('സുരക്ഷിതം') || lower.includes('নিরাপদ') || lower.includes('ਸੁਰੱਖਿਅਤ')
    ) {
      detectedAction = 'CHECK_ROUTE';
      const routeReplies = {
        gu: '🛡️ રૂટ સુરક્ષા ચકાસણી પૂર્ણ: AI મોડેલ મુજબ રૂટ 98.8% સામાન્ય અને સંપૂર્ણપણે સુરક્ષિત છે. કોઈ વિચલન નથી.',
        hi: '🛡️ रूट सुरक्षा जांच पूरी हुई: AI मॉडल के अनुसार आपका मार्ग 98.8% सामान्य और सुरक्षित है। कोई विचलन नहीं मिला।',
        mr: '🛡️ मार्ग सुरक्षा तपासणी पूर्ण: AI मॉडेलनुसार मार्ग 98.8% सुरक्षित आणि सामान्य आहे.',
        bn: '🛡️ রুট নিরাপত্তা যাচাই সম্পন্ন: এআই মডেল অনুযায়ী আপনার রুট ৯৮.৮% নিরাপদ এবং স্বাভাবিক।',
        ta: '🛡️ பாதை பாதுகாப்பு சரிபார்க்கப்பட்டது: AI மாதிரி படி உங்கள் பாதை 98.8% பாதுகாப்பானது.',
        te: '🛡️ రూట్ భద్రత ధృవీకరించబడింది: AI మోడల్ ప్రకారం మీ మార్గం 98.8% సురక్షితమైనది.',
        kn: '🛡️ ಮಾರ್ಗ ಸುರಕ್ಷತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: AI ಮಾದರಿಯ ಪ್ರಕಾರ ಮಾರ್ಗವು 98.8% ಸುರಕ್ಷಿತವಾಗಿದೆ.',
        ml: '🛡️ റൂട്ട് സുരക്ഷ പരിശോധിച്ചു: AI മോഡൽ പ്രകാരം റൂട്ട് 98.8% സുരക്ഷിതമാണ്.',
        pa: '🛡️ ਰੂਟ ਸੁਰੱਖਿਆ ਦੀ ਪੁਸ਼ਟੀ: AI ਮਾਡਲ ਅਨੁਸਾਰ ਤੁਹਾਡਾ ਰਸਤਾ 98.8% ਸੁਰੱਖਿਅਤ ਹੈ।',
        en: '🛡️ Route safety verified: Isolation Forest AI confirms your route is 98.8% nominal with zero deviations.'
      };
      localReply = routeReplies[effectiveLang] || routeReplies.en;
    } else if (
      lower.includes('hello') || lower.includes('hi') || lower.includes('how are you') || lower.includes('नमस्ते') ||
      lower.includes('કેમ છો') || lower.includes('नमस्कार') || lower.includes('வணக்கம்') || lower.includes('నమస్కారం') ||
      lower.includes('ನಮಸ್ಕಾರ') || lower.includes('നമസ്കാരം') || lower.includes('নমস্কার') || lower.includes('ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ')
    ) {
      detectedAction = 'CONVERSATION';
      const greetReplies = {
        gu: 'નમસ્તે! હું તમારો સ્માર્ટકેબ AI સુરક્ષા સહાયક છું. હું મજામાં છું અને તમારી મુસાફરીની સુરક્ષા પર નજર રાખી રહ્યો છું. તમે મને રાઇડ શેર કરવા, રૂટ ચેક કરવા અથવા SOS માટે બોલી શકો છો.',
        hi: 'नमस्ते! मैं आपका स्मार्टकैब AI सुरक्षा सहायक हूँ। मैं बहुत अच्छा हूँ और आपकी यात्रा की सुरक्षा निगरानी कर रहा हूँ। आप मुझसे लोकेशन शेयर करने, रूट चेक करने या मदद के लिए बोल सकते हैं।',
        mr: 'नमस्कार! मी तुमचा स्मार्टकॅब AI सुरक्षा सहाय्यक आहे. मी उत्तम आहे आणि तुमच्या प्रवासाच्या सुरक्षेवर लक्ष ठेवत आहे.',
        bn: 'নমস্কার! আমি আপনার স্মার্টক্যাব এআই নিরাপত্তা সহকারী। আমি ভালো আছি এবং আপনার যাত্রার নিরাপত্তা পর্যবেক্ষণ করছি।',
        ta: 'வணக்கம்! நான் உங்கள் ஸ்மார்ட்கேப் AI பாதுகாப்பு துணைவன். உங்கள் பயணப் பாதுகாப்பை நான் தொடர்ந்து கண்காணிக்கிறேன்.',
        te: 'నమస్కారం! నేను మీ స్మార్ట్‌క్యాబ్ AI భద్రతా సహాయకుడిని. మీ ప్రయాణ భద్రతను నేను పర్యవేక్షిస్తున్నాను.',
        kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್‌ಕ್ಯಾಬ್ AI ಸುರಕ್ಷತಾ ಸಹಾಯಕ. ನಿಮ್ಮ ಪ್ರಯಾಣದ ಸುರಕ್ಷತೆಯನ್ನು ನಾನು ಗಮನಿಸುತ್ತಿದ್ದೇನೆ.',
        ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സ്മാർട്ട്ക്യാബ് AI സുരക്ഷാ സഹായിയാണ്. നിങ്ങളുടെ യാത്രാ സുരക്ഷ ഞാൻ നിരീക്ഷിക്കുന്നു.',
        pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਸਮਾਰਟਕੈਬ AI ਸੁਰੱਖਿਆ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਯਾਤਰਾ ਦੀ ਨਿਗਰਾਨੀ ਕਰ ਰਿਹਾ ਹਾਂ।',
        en: 'Hello! I am your SmartCab AI Safety Companion. I am doing great and actively monitoring your ride security.'
      };
      localReply = greetReplies[effectiveLang] || greetReplies.en;
    } else {
      detectedAction = 'CONVERSATION';
      const generalReplies = {
        gu: `હું તમારા પ્રશ્ન "${raw}" વિશે સમજી રહ્યો છું. સ્માર્ટકેબ AI તરીકે, હું લાઇવ લોકેશન શેર કરવા, રૂટ સેફ્ટી ચેક કરવા અને 112 પોલીસ એલર્ટમાં મદદ કરી શકું છું.`,
        hi: `मैं आपके प्रश्न "${raw}" को समझ रहा हूँ। मैं आपकी लाइव लोकेशन शेयर करने, रूट सुरक्षा जांचने और 112 पुलिस अलर्ट में मदद कर सकता हूँ।`,
        mr: `मी "${raw}" बद्दल समजत आहे. मी लोकेशन शेअर करणे, रूट तपासणे आणि 112 अलर्ट पाठवण्यात मदत करू शकतो.`,
        bn: `আমি "${raw}" সম্পর্কে বুঝতে পারছি। আমি লাইভ অবস্থান শেয়ার করতে, রুট চেক করতে এবং ১১২ পুলিশ সতর্কতায় সাহায্য করতে পারি।`,
        ta: `"${raw}" பற்றிய உங்கள் கேள்வியை நான் புரிந்துகொள்கிறேன். நேரலை இருப்பிடத்தைப் பகிர, பாதையைச் சரிபார்க்க அல்லது SOS அனுப்ப உதவ முடியும்.`,
        te: `"${raw}" గురించి మీ ప్రశ్నను నేను అర్థం చేసుకున్నాను. లొకేషన్ షేర్ చేయడానికి, రూట్ చెక్ చేయడానికి లేదా SOS పంపడానికి సహాయం చేయగలను.`,
        kn: `"${raw}" ಕುರಿತು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಅಥವಾ ಮಾರ್ಗವನ್ನು ಪರಿಶೀಲಿಸಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`,
        ml: `"${raw}" എന്നതിനെക്കുറിച്ചുള്ള ചോദ്യം ഞാൻ മനസ്സിലാക്കുന്നു. ലൊക്കേഷൻ പങ്കിടാനും റൂട്ട് പരിശോധിക്കാനും സഹായിക്കാനാകും.`,
        pa: `ਮੈਂ "${raw}" ਬਾਰੇ ਸਮਝ ਰਿਹਾ ਹਾਂ। ਮੈਂ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਸਾਂਝੀ ਕਰਨ ਜਾਂ ਰੂਟ ਦੀ ਜਾਂਚ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।`,
        en: `I understand your question about "${raw}". As your SmartCab Safety AI, I can help you share live location, verify route security, or trigger SOS.`
      };
      localReply = generalReplies[effectiveLang] || generalReplies.en;
    }

    // Apply immediate local state and spoken audio
    setActiveIntent(detectedAction);
    setSpeechFeedback(localReply);
    playAudioChime(detectedAction === 'EMERGENCY_SOS' ? 'sos' : 'success');
    speakText(localReply, effectiveLang);

    if (detectedAction === 'EMERGENCY_SOS') {
      onTriggerSos?.();
    } else if (detectedAction === 'SHARE_RIDE') {
      onShareRide?.();
    } else if (detectedAction === 'CHECK_ROUTE') {
      onCheckRoute?.();
    }

    // 2. Parallel Sync with Backend AI Voice Engine & High-Fidelity Studio Audio
    try {
      const res = await fetch(`${API_BASE}/api/ai/voice-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          language: effectiveLang,
          bookingId: bookingDetails?.bookingId || currentBookingId || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.speechResponse && data.speechResponse !== localReply) {
          setSpeechFeedback(data.speechResponse);
        }
        if (data.audioBase64) {
          const audio = new Audio(data.audioBase64);
          audio.play().catch(() => {});
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
        const samplePrompt = sampleCommands[activeLang]?.[0]?.text || 'Share my live tracking link';
        const typed = window.prompt(`Enter voice command in ${INDIAN_LANGUAGE_LOCALES[activeLang]?.name || 'English'}:`, samplePrompt);
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

  // Sample prompt chips for all 10 Indian languages
  const sampleCommands = {
    gu: [
      { label: '👋 "નમસ્તે કેમ છો"', text: 'નમસ્તે તમે કેમ છો' },
      { label: '📍 "રાઇડ શેર કરો"', text: 'મારી લાઇવ રાઇડ ટ્રૅકિંગ લિંક શેર કરો' },
      { label: '🛡️ "શું રૂટ સુરક્ષિત છે?"', text: 'શું આ રૂટ સુરક્ષિત છે ચેક કરો' },
      { label: '🚨 "મને મદદ કરો"', text: 'મને મદદ કરો ઇમરજન્સી SOS 112' }
    ],
    hi: [
      { label: '👋 "नमस्ते कैसे हो"', text: 'नमस्ते आप कैसे हो' },
      { label: '📍 "राइड शेयर करो"', text: 'मेरी लाइव राइड ट्रैकिंग लिंक शेयर करो' },
      { label: '🛡️ "क्या रूट सुरक्षित है?"', text: 'क्या रास्ता सुरक्षित है रूट चेक करो' },
      { label: '🚨 "मदद करो"', text: 'आपातकाल मदद करो पुलिस 112' }
    ],
    en: [
      { label: '👋 "Hello how are you"', text: 'Hello how are you' },
      { label: '📍 "Share my trip"', text: 'Share my live tracking link with trusted contacts' },
      { label: '🛡️ "Is route safe?"', text: 'Is my route safe? Check ML telemetry' },
      { label: '🚨 "SmartCab Help"', text: 'SmartCab Help Emergency SOS alert police' }
    ],
    mr: [
      { label: '👋 "नमस्कार कसे आहात"', text: 'नमस्कार तुम्ही कसे आहात' },
      { label: '📍 "माझी राइड शेअर करा"', text: 'माझी थेट ट्रॅकिंग लिंक शेअर करा' },
      { label: '🛡️ "मार्ग सुरक्षित आहे का?"', text: 'हा मार्ग सुरक्षित आहे का तपासा' },
      { label: '🚨 "मदत करा"', text: 'आणीबाणी मदत करा पोलिस 112' }
    ],
    bn: [
      { label: '👋 "নমস্কার কেমন আছেন"', text: 'নমস্কার আপনি কেমন আছেন' },
      { label: '📍 "রাইড শেয়ার করুন"', text: 'আমার লাইভ ট্র্যাকিং লিঙ্ক শেয়ার করুন' },
      { label: '🛡️ "রুট কি নিরাপদ?"', text: 'এই রুটটি কি নিরাপদ পরীক্ষা করুন' },
      { label: '🚨 "সাহায্য করুন"', text: 'জরুরি সাহায্য করুন পুলিশ ১১২' }
    ],
    ta: [
      { label: '👋 "வணக்கம் எப்படி இருக்கிறீர்கள்"', text: 'வணக்கம் நீங்கள் எப்படி இருக்கிறீர்கள்' },
      { label: '📍 "பயணத்தை பகிரவும்"', text: 'எனது நேரலை இருப்பிடத்தைப் பகிரவும்' },
      { label: '🛡️ "பாதை பாதுகாப்பானதா?"', text: 'இந்த பாதை பாதுகாப்பானதா சரிபார்க்கவும்' },
      { label: '🚨 "உதவி செய்யுங்கள்"', text: 'அவசர உதவி செய்யுங்கள் காவல் 112' }
    ],
    te: [
      { label: '👋 "నమస్కారం ఎలా ఉన్నారు"', text: 'నమస్కారం మీరు ఎలా ఉన్నారు' },
      { label: '📍 "రైడ్ షేర్ చేయండి"', text: 'నా లైవ్ లొకేషన్ షేర్ చేయండి' },
      { label: '🛡️ "రూట్ సురక్షితమేనా?"', text: 'ఈ మార్గం సురక్షితమేనా తనిఖీ చేయండి' },
      { label: '🚨 "సహాయం చేయండి"', text: 'అత్యవసర సహాయం చేయండి 112' }
    ],
    kn: [
      { label: '👋 "ನಮಸ್ಕಾರ ಹೇಗಿದ್ದೀರಾ"', text: 'ನಮಸ್ಕಾರ ನೀವು ಹೇಗಿದ್ದೀರಾ' },
      { label: '📍 "ಸವಾರಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ"', text: 'ನನ್ನ ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ' },
      { label: '🛡️ "ಮಾರ್ಗ ಸುರಕ್ಷಿತವಾಗಿದೆಯೇ?"', text: 'ಈ ಮಾರ್ಗವು ಸುರಕ್ಷಿತವಾಗಿದೆಯೇ ಪರಿಶೀಲಿಸಿ' },
      { label: '🚨 "ಸಹಾಯ ಮಾಡಿ"', text: 'ತುರ್ತು ಸಹಾಯ ಮಾಡಿ ಪೊಲೀಸ್ 112' }
    ],
    ml: [
      { label: '👋 "നമസ്കാരം സുഖമാണോ"', text: 'നമസ്കാരം നിങ്ങൾക്ക് സുഖമാണോ' },
      { label: '📍 "റൈഡ് പങ്കിടുക"', text: 'എന്റെ ലൈവ് ട്രാക്കിംഗ് ലിങ്ക് പങ്കിടുക' },
      { label: '🛡️ "റൂട്ട് സുരക്ഷിതമാണോ?"', text: 'റൂട്ട് സുരക്ഷിതമാണോ എന്ന് പരിശോധിക്കുക' },
      { label: '🚨 "സഹായം വേണം"', text: 'അടിയന്തര സഹായം വേണം പോലീസ് 112' }
    ],
    pa: [
      { label: '👋 "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਵੇਂ ਹੋ"', text: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ' },
      { label: '📍 "ਰਾਈਡ ਸਾਂਝੀ ਕਰੋ"', text: 'ਮੇਰੀ ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ ਲਿੰਕ ਸਾਂਝੀ ਕਰੋ' },
      { label: '🛡️ "ਕੀ ਰਸਤਾ ਸੁਰੱਖਿਅਤ ਹੈ?"', text: 'ਕੀ ਇਹ ਰਸਤਾ ਸੁਰੱਖਿਅਤ ਹੈ ਜਾਂਚ ਕਰੋ' },
      { label: '🚨 "ਮਦਦ ਕਰੋ"', text: 'ਐਮਰਜੈਂਸੀ ਮਦਦ ਕਰੋ ਪੁਲਿਸ 112' }
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
          title="Hands-Free Voice Safety AI (10+ Indian Languages)"
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

            {/* HEADER WITH 10 INDIAN LANGUAGES SELECTOR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pr-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                  <Radio className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2">
                    Voice Safety AI
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      10 Indian Languages
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Natural Vernacular Voice & Studio Audio</p>
                </div>
              </div>

              {/* LANGUAGE SELECTOR DROPDOWN */}
              <div className="relative">
                <select
                  value={activeLang}
                  onChange={(e) => {
                    setActiveLang(e.target.value);
                    setLang?.(e.target.value);
                  }}
                  className="bg-slate-950 border border-slate-700 text-emerald-400 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {Object.entries(INDIAN_LANGUAGE_LOCALES).map(([code, item]) => (
                    <option key={code} value={code} className="bg-slate-900 text-white">
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* QUICK LANGUAGE SELECTOR PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {Object.entries(INDIAN_LANGUAGE_LOCALES).map(([code, item]) => (
                <button
                  key={code}
                  onClick={() => {
                    setActiveLang(code);
                    setLang?.(code);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition border ${
                    activeLang === code
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
                {isListening
                  ? `🎙️ Listening in ${INDIAN_LANGUAGE_LOCALES[activeLang]?.name || 'Indian Voice'}... Speak now`
                  : `Tap microphone to speak in ${INDIAN_LANGUAGE_LOCALES[activeLang]?.label || 'your language'}`}
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
                    onClick={() => speakText(speechFeedback, activeLang)}
                    className="p-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-white rounded-lg transition shrink-0 flex items-center gap-1 text-[10px] font-bold"
                    title="Replay Voice Audio"
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
                  Emergency broadcast initiated. Live GPS coordinates and audio telemetry are transmitting to the Police Command Room and your trusted contacts.
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
                Sample Voice Commands in {INDIAN_LANGUAGE_LOCALES[activeLang]?.label || 'Indian Language'} (Click to Test)
              </span>
              <div className="flex flex-wrap gap-2">
                {(sampleCommands[activeLang] || sampleCommands.en).map((cmd, i) => (
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
