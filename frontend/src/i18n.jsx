import React, { createContext, useContext, useState, useEffect } from 'react';

// 🌐 INTERNATIONAL LANGUAGES — Smart Security AI Cab
//
// Language selection works through the in-page translator (same approach the
// app already used for Indian languages): we set the googtrans cookie and
// reload, so the WHOLE site (ride flow, safety, admin, everywhere) renders in
// the chosen language. The help widget + AI assistant additionally ship with
// authored translations for the 6 core languages so they work even before the
// page translator kicks in (and stay readable if the translator is blocked).

export const LANGS = [
  { code: 'en', google: 'en',     eng: 'English',                    native: 'English',         ai: 'en' },
  { code: 'gu', google: 'gu',     eng: 'Gujarati',                   native: 'ગુજરાતી',          ai: 'gu' },
  { code: 'hi', google: 'hi',     eng: 'Hindi',                      native: 'हिन्दी',           ai: 'hi' },
  { code: 'ru', google: 'ru',     eng: 'Russian',                    native: 'Русский',         ai: 'ru' },
  { code: 'ja', google: 'ja',     eng: 'Japanese',                   native: '日本語',           ai: 'ja' },
  { code: 'zh', google: 'zh-CN',  eng: 'Chinese (Simplified)',       native: '中文（简体）',     ai: 'zh' },
  { code: 'fr', google: 'fr',     eng: 'French',                     native: 'Français',        ai: 'fr' },
  { code: 'de', google: 'de',     eng: 'German',                     native: 'Deutsch',         ai: 'de' },
  { code: 'bn', google: 'bn',     eng: 'Bangla',                     native: 'বাংলা',            ai: 'en' },
  { code: 'kn', google: 'kn',     eng: 'Kannada',                    native: 'ಕನ್ನಡ',            ai: 'en' },
  { code: 'mr', google: 'mr',     eng: 'Marathi',                    native: 'मराठी',            ai: 'en' },
  { code: 'ta', google: 'ta',     eng: 'Tamil',                      native: 'தமிழ்',            ai: 'en' },
  { code: 'te', google: 'te',     eng: 'Telugu',                     native: 'తెలుగు',           ai: 'en' },
  { code: 'ur', google: 'ur',     eng: 'Urdu',                       native: 'اردو',             ai: 'en' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' }
];

export const SUPPORTED_LANG_CODES = LANGS.map((l) => l.code);

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : '';
}

export function getGoogleLang() {
  const m = getCookie('googtrans').match(/\/en\/([a-z-]{2,12})/);
  if (!m) return 'en';
  const code = m[1].toLowerCase();
  if (code.startsWith('zh')) return 'zh';
  return code;
}

/** Language code the AI assistant should answer in. */
export function getAiLang() {
  return getGoogleLang();
}

/** Switch the whole site to `code` (cookie + reload) — used by every picker. */
export function setSiteLanguage(code) {
  const lang = LANGS.find((l) => l.code === code) || LANGS[0];
  const clear = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  if (typeof document !== 'undefined') {
    document.cookie = clear;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    if (lang.google !== 'en') {
      document.cookie = `googtrans=/en/${lang.google}; path=/;`;
      document.cookie = `googtrans=/en/${lang.google}; path=/; domain=${window.location.hostname};`;
    }
    try { localStorage.setItem('smartcab_lang', code); } catch (e) { /* noop */ }
    window.location.reload();
  }
}

// ---------------------------------------------------------------------------
// 💬 HELP CENTER + AI ASSISTANT — authored translations
// ---------------------------------------------------------------------------
export const HELP_T = {
  help_title: {
    en: 'Help & Support',
    hi: 'सहायता एवं समर्थन',
    gu: 'સહાય અને સપોર્ટ',
    ru: 'Помощь и поддержка',
    ja: 'ヘルプ＆サポート',
    zh: '帮助与支持',
    fr: 'Aide et support',
    de: 'Hilfe & Support',
  },
  help_subtitle: {
    en: 'Report a driver, find help or email us — available in your language.',
    hi: 'ड्राइवर की रिपोर्ट करें, मदद पाएं या हमें ईमेल करें — आपकी भाषा में।',
    gu: 'ડ્રાઈવરની ફરિયાદ કરો, સહાય મેળવો અથવા ઈમેલ કરો — તમારી ભાષામાં ઉપલબ્ધ.',
    ru: 'Пожаловаться на водителя, найти помощь или написать нам — на вашем языке.',
    ja: 'ドライバーの通報、お困りごとの解決、メールでのお問い合わせ — ご希望の言語でどうぞ。',
    zh: '投诉司机、寻求帮助或给我们发邮件 — 支持您的语言。',
    fr: 'Signaler un chauffeur, trouver de l’aide ou nous écrire — dans votre langue.',
    de: 'Fahrer melden, Hilfe finden oder uns mailen — in deiner Sprache.',
  },
  tab_help: { en: 'Help Center', hi: 'सहायता केंद्र', gu: 'હેલ્પ સેન્ટર', ru: 'Справочный центр', ja: 'ヘルプセンター', zh: '帮助中心', fr: 'Centre d’aide', de: 'Hilfe-Center' },
  tab_report: { en: 'Report a Driver', hi: 'ड्राइवर रिपोर्ट', gu: 'ડ્રાઈવર ફરિયાદ', ru: 'Пожаловаться на водителя', ja: 'ドライバーを通報', zh: '投诉司机', fr: 'Signaler un chauffeur', de: 'Fahrer melden' },
  tab_assistant: { en: 'AI Assistant', hi: 'एआई सहायक', gu: 'AI સહાયક', ru: 'ИИ-помощник', ja: 'AIアシスタント', zh: 'AI助手', fr: 'Assistant IA', de: 'KI-Assistent' },
  close: { en: 'Close', hi: 'बंद करें', gu: 'બંધ કરો', ru: 'Закрыть', ja: '閉じる', zh: '关闭', fr: 'Fermer', de: 'Schließen' },

  faq_heading: { en: 'Frequently asked questions', hi: 'अक्सर पूछे जाने वाले सवाल', gu: 'વારંવાર પૂછાતા પ્રશ્નો', ru: 'Часто задаваемые вопросы', ja: 'よくある質問', zh: '常见问题', fr: 'Questions fréquentes', de: 'Häufige Fragen' },
  faq_q1: { en: 'How does AI route security work?', hi: 'एआई रूट सुरक्षा कैसे काम करती है?', gu: 'AI રૂટ સુરક્ષા કેવી રીતે કાર્ય કરે છે?', ru: 'Как работает ИИ-контроль маршрута?', ja: 'AIルート安全機能とは？', zh: 'AI路线安全是如何工作的？', fr: 'Comment fonctionne la sécurité IA de l’itinéraire ?', de: 'Wie funktioniert die KI-Routensicherheit?' },
  faq_a1: {
    en: 'Live GPS follows your route. If the vehicle deviates, the app alerts and flags the unusual behaviour so our team can check on you.',
    hi: 'लाइव जीपीएस आपके मार्ग को ट्रैक करता है। यदि वाहन विचलित होता है, तो ऐप तुरंत चेतावनी जारी करता है।',
    gu: 'લાઇવ GPS તમારા રૂટને ટ્રૅક કરે છે. જો વાહન વિચલિત થાય, તો ઍપ તરત જ ચેતવણી આપે છે જેથી સુરક્ષા ટીમ તમને સહાય કરી શકે.',
    ru: 'GPS в реальном времени следит за маршрутом. При отклонении приложение предупреждает и помечает необычное поведение.',
    ja: 'リアルタイムGPSがルートを追跡します。逸脱を検知するとアプリが通知し、異常な挙動としてフラグを立ててチームが確認します。',
    zh: '实时GPS追踪路线。若车辆偏离，应用会提醒并标记异常行为，让团队联系您。',
    fr: 'Le GPS suit votre itinéraire en temps réel. En cas de déviation, l’app alerte et signale le comportement inhabituel.',
    de: 'Live-GPS verfolgt deine Route. Bei Abweichung warnt die App und markiert das ungewöhnliche Verhalten.',
  },
  emergency_heading: { en: 'In an emergency', hi: 'आपातकाल में', gu: 'ઇમરજન્સી સમયે', ru: 'В экстренной ситуации', ja: '緊急時は', zh: '紧急情况', fr: 'En cas d’urgence', de: 'Im Notfall' },
  emergency_text: {
    en: 'Call your local emergency number immediately (112 in India), then use the SOS button in the app.',
    hi: 'तुरंत 112 डायल करें, फिर ऐप में एसओएस बटन दबाएं।',
    gu: 'તરત જ 112 પર કૉલ કરો, પછી ઍપમાં SOS બટન દબાવો.',
    ru: 'Сначала позвоните в местную службу спасения (112 в Индии), затем нажмите SOS в приложении.',
    ja: 'まず現地の緊急番号（インドは112）にお電話ください。その後にアプリのSOSボタンを使用してください。',
    zh: '请立即拨打当地紧急号码（印度为112），然后使用应用内的SOS按钮。',
    fr: 'Appelez immédiatement votre numéro local (112 en Inde), puis utilisez le bouton SOS dans l’app.',
    de: 'Ruf sofort die örtliche Notrufnummer an (in Indien 112), dann nutze den SOS-Button in der App.',
  },
  send: { en: 'Send', hi: 'भेजें', gu: 'મોકલો', ru: 'Отправить', ja: '送信', zh: '发送', fr: 'Envoyer', de: 'Senden' },
  typing: { en: 'thinking…', hi: 'सोच रहा हूँ…', gu: 'વિચારી રહ્યું છે…', ru: 'думаю…', ja: '考え中…', zh: '思考中…', fr: 'réfléchit…', de: 'denkt nach…' },
  assistant_welcome: {
    en: 'Hello! 👋 I’m here to help — booking, fares, safety, SOS, reporting a driver or becoming a driver. What do you need?',
    hi: 'नमस्ते! 👋 मैं आपकी सहायता के लिए यहाँ हूँ — बुकिंग, किराया, सुरक्षा, एसओएस या ड्राइवर बनने से जुड़े कोई भी सवाल पूछें।',
    gu: 'નમસ્તે! 👋 હું તમારી સહાય માટે અહીં છું — બુકિંગ, ભાડું, સુરક્ષા, SOS, ડ્રાઈવર રજીસ્ટ્રેશન અંગે સહાય મેળવો.',
    ru: 'Здравствуйте! 👋 Я здесь, чтобы помочь — бронирование, стоимость, безопасность, SOS, жалобы на водителя или работа водителем.',
    ja: 'こんにちは！👋 予約、料金、安全、SOS、ドライバー通報、ドライバー応募 — ご質問をどうぞ。',
    zh: '您好！👋 我可以帮助预订、费用、安全、SOS、投诉司机或成为司机。请问需要什么？',
    fr: 'Bonjour ! 👋 Je peux aider pour la réservation, les tarifs, la sécurité, le SOS ou devenir chauffeur.',
    de: 'Hallo! 👋 Ich helfe bei Buchen, Preisen, Sicherheit, SOS oder Fahrer werden.',
  }
};

export const T = (key, lang = 'en') => {
  const bucket = HELP_T[key];
  if (!bucket) return key;
  return bucket[lang] || bucket.en;
};

export const normalizeAiLang = (l) => {
  const code = (l || 'en').toLowerCase();
  if (code.startsWith('zh')) return 'zh';
  return ['en', 'gu', 'hi', 'ru', 'ja', 'zh', 'fr', 'de'].includes(code) ? code : 'en';
};

// ---------------------------------------------------------------------------
// Context & Hook for React components
// ---------------------------------------------------------------------------
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return getGoogleLang() || localStorage.getItem('smartcab_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    setSiteLanguage(newLang);
  };

  const t = (key) => T(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    const curLang = typeof window !== 'undefined' ? (getGoogleLang() || localStorage.getItem('smartcab_lang') || 'en') : 'en';
    return {
      lang: curLang,
      setLanguage: setSiteLanguage,
      t: (key) => T(key, curLang)
    };
  }
  return context;
}

export function LanguageSwitcher({ className = '' }) {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700 text-xs font-bold ${className}`}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
            lang === l.code ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title={l.label}
        >
          <span>{l.native}</span>
        </button>
      ))}
    </div>
  );
}
