import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe, X, Check, Sparkles, Search } from 'lucide-react';

// 🌐 INTERNATIONAL & INDIAN VERNACULAR LANGUAGES — Smart Security AI Cab
//
// Language selection works through the in-page Google translator + native React state.
// Setting the googtrans cookie translates the whole app safely without breaking React DOM.

export const LANGS = [
  // 🇮🇳 Indian Languages
  { code: 'gu', google: 'gu',     eng: 'Gujarati',                   native: 'ગુજરાતી',          ai: 'gu', region: 'India' },
  { code: 'hi', google: 'hi',     eng: 'Hindi',                      native: 'हिन्दी',           ai: 'hi', region: 'India' },
  { code: 'mr', google: 'mr',     eng: 'Marathi',                    native: 'मराठी',            ai: 'mr', region: 'India' },
  { code: 'bn', google: 'bn',     eng: 'Bangla',                     native: 'বাংলা',            ai: 'bn', region: 'India' },
  { code: 'ta', google: 'ta',     eng: 'Tamil',                      native: 'தமிழ்',            ai: 'ta', region: 'India' },
  { code: 'te', google: 'te',     eng: 'Telugu',                     native: 'తెలుగు',           ai: 'te', region: 'India' },
  { code: 'kn', google: 'kn',     eng: 'Kannada',                    native: 'ಕನ್ನಡ',            ai: 'kn', region: 'India' },
  { code: 'ml', google: 'ml',     eng: 'Malayalam',                  native: 'മലയാളം',          ai: 'ml', region: 'India' },
  { code: 'pa', google: 'pa',     eng: 'Punjabi',                    native: 'ਪੰਜਾਬੀ',          ai: 'pa', region: 'India' },
  { code: 'ur', google: 'ur',     eng: 'Urdu',                       native: 'اردو',             ai: 'ur', region: 'India' },
  // 🌍 International Languages
  { code: 'en', google: 'en',     eng: 'English',                    native: 'English',         ai: 'en', region: 'Global' },
  { code: 'es', google: 'es',     eng: 'Spanish',                    native: 'Español',         ai: 'es', region: 'Global' },
  { code: 'fr', google: 'fr',     eng: 'French',                     native: 'Français',        ai: 'fr', region: 'Global' },
  { code: 'de', google: 'de',     eng: 'German',                     native: 'Deutsch',         ai: 'de', region: 'Global' },
  { code: 'ru', google: 'ru',     eng: 'Russian',                    native: 'Русский',         ai: 'ru', region: 'Global' },
  { code: 'ja', google: 'ja',     eng: 'Japanese',                   native: '日本語',           ai: 'ja', region: 'Global' },
  { code: 'zh', google: 'zh-CN',  eng: 'Chinese (Simplified)',       native: '中文（简体）',     ai: 'zh', region: 'Global' },
  { code: 'ar', google: 'ar',     eng: 'Arabic',                     native: 'العربية',          ai: 'ar', region: 'Global' },
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
    try {
      localStorage.setItem('smartcab_lang', code);
    } catch (e) { /* noop */ }
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
  send: { en: 'Send', hi: 'भेजें', gu: 'મોકલો', ru: 'Отправить', ja: '送信', zh: '发送', fr: 'Envoyer', de: 'Senden' },
  typing: { en: 'thinking…', hi: 'सोच रहा हूँ…', gu: 'વિચારી રહ્યું છે…', ru: 'думаю…', ja: '考え中…', zh: '思考中…', fr: 'réfléchit…', de: 'denkt nach…' },
};

export const T = (key, lang = 'en') => {
  const bucket = HELP_T[key];
  if (!bucket) return key;
  return bucket[lang] || bucket.en;
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

/**
 * 🌐 Globe Icon Language Switcher & Full Multilingual Modal
 * Renders the prominent Globe button and dropdown supporting all Indian & International languages.
 */
export function LanguageSwitcher({ className = '', showGlobeOnly = false }) {
  const { lang, setLanguage } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeLangObj = LANGS.find((l) => l.code === lang) || LANGS[0];

  const filteredLangs = LANGS.filter(
    (l) =>
      l.eng.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indianLangs = filteredLangs.filter((l) => l.region === 'India');
  const globalLangs = filteredLangs.filter((l) => l.region === 'Global');

  return (
    <>
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {/* 🌐 PROMINENT GLOBE BUTTON */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl border border-slate-700 transition shadow-sm text-xs font-bold"
          title="🌐 Select Language (Google Translate & AI Voice)"
        >
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="notranslate">{activeLangObj.native || 'English'}</span>
        </button>

        {/* Quick switch pills for top 3 languages if not globe-only */}
        {!showGlobeOnly && (
          <div className="hidden sm:inline-flex items-center bg-slate-900/80 rounded-xl p-0.5 border border-slate-800 text-xs font-bold">
            {['en', 'hi', 'gu'].map((code) => {
              const l = LANGS.find((item) => item.code === code);
              return (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2 py-1 rounded-lg transition notranslate ${
                    lang === code ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title={l?.eng}
                >
                  {l?.native}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌐 FULL MULTILINGUAL TRANSLATOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[85vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pr-10">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <Globe className="h-6 w-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2 notranslate">
                  Select Language / ભાષા પસંદ કરો
                </h3>
                <p className="text-xs text-slate-400">
                  Google Translate & Multilingual Voice AI Support
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search language (e.g. Gujarati, Hindi, French, Marathi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Language Lists */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-5">
              {/* 🇮🇳 Indian Languages */}
              {indianLangs.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 notranslate">
                    <span>🇮🇳</span> Indian Vernacular Languages
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {indianLangs.map((l) => {
                      const isSelected = lang === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            setIsModalOpen(false);
                            setLanguage(l.code);
                          }}
                          className={`p-3 rounded-2xl border text-left transition flex items-center justify-between notranslate ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold">{l.native}</div>
                            <div className="text-[11px] text-slate-400">{l.eng}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🌍 International Languages */}
              {globalLangs.length > 0 && (
                <div>
                  <div className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 notranslate">
                    <span>🌍</span> International Languages
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {globalLangs.map((l) => {
                      const isSelected = lang === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            setIsModalOpen(false);
                            setLanguage(l.code);
                          }}
                          className={`p-3 rounded-2xl border text-left transition flex items-center justify-between notranslate ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold">{l.native}</div>
                            <div className="text-[11px] text-slate-400">{l.eng}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Translates entire app & activates matching Voice AI
              </span>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setLanguage('en');
                }}
                className="text-slate-400 hover:text-white underline text-xs"
              >
                Reset to English
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
