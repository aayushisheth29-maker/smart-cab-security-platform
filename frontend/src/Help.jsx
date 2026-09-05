import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, MessageCircle, ShieldCheck, AlertTriangle, Bot, FileWarning } from 'lucide-react';
import { AssistantChat, SUPPORT_EMAIL } from './HelpAssistant';
import { LANGS, T, getAiLang, setSiteLanguage } from './i18n';

const Help = () => {
  const lang = getAiLang();
  const openWidget = (tab) => {
    window.dispatchEvent(new CustomEvent('smartcab:open-help', { detail: { tab } }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      {/* Simple Header */}
      <div className="bg-black text-white p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:text-gray-300 transition">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="notranslate">{T('close', lang)}</span>
          </Link>
          <div className="flex items-center space-x-2">
            <img src="/assets/security-cab-icon.png" alt="Smart Security AI Cab logo" className="h-8 w-8 rounded-lg object-cover ring-1 ring-amber-400/40" />
            <span className="font-bold notranslate">Smart Security AI Cab</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto mt-12 px-4">
        <h1 className="text-4xl font-bold mb-2 notranslate">{T('tab_help', lang)}</h1>
        <p className="text-gray-600 mb-8 text-lg notranslate">{T('help_subtitle', lang)}</p>

        {/* Language picker */}
        <div className="flex flex-wrap gap-2 mb-10">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setSiteLanguage(l.code)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition notranslate ${
                lang === l.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {l.eng} · {l.native}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Emergency — honest guidance, no fake toll-free number */}
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-bold text-xl mb-2 notranslate">{T('emergency_heading', lang)}</h3>
            <p className="text-gray-700 text-sm notranslate">{T('emergency_text', lang)}</p>
          </div>

          {/* AI Assistant — a real chat */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-green-50 p-4 rounded-full mb-4">
              <Bot className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl mb-2 notranslate">{T('tab_assistant', lang)}</h3>
            <p className="text-gray-600 text-sm mb-4 notranslate">{T('assistant_desc', lang)}</p>
            <button
              onClick={() => openWidget('assistant')}
              className="text-green-700 bg-green-100 hover:bg-green-200 font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="notranslate">{T('assistant_cta', lang)}</span>
            </button>
          </div>

          {/* Email the company */}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Smart Security AI Cab — Help / Report')}`}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:scale-105 transition transform cursor-pointer w-full"
          >
            <div className="bg-purple-50 p-4 rounded-full mb-4">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl mb-2 notranslate">{T('email_heading', lang)}</h3>
            <p className="text-gray-600 text-sm notranslate">{T('email_text', lang)}</p>
            <p className="text-purple-700 font-bold mt-4 text-sm notranslate">{T('email_btn', lang)}</p>
          </a>
        </div>

        {/* Report a driver */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-50 p-3 rounded-xl shrink-0">
              <FileWarning className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl notranslate">{T('tab_report', lang)}</h3>
              <p className="text-gray-600 text-sm mt-1 notranslate">{T('report_desc', lang)}</p>
            </div>
          </div>
          <button
            onClick={() => openWidget('report')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition notranslate"
          >
            {T('submit_report', lang)}
          </button>
        </div>

        {/* Inline AI assistant */}
        <div className="mb-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 notranslate">
            <Bot className="h-6 w-6 text-green-600" /> {T('tab_assistant', lang)}
          </h2>
          <AssistantChat initialHeight="h-[300px]" />
        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold mb-6 notranslate">{T('faq_heading', lang)}</h2>
        <div className="space-y-4">
          {[
            { q: 'faq_q1', a: 'faq_a1' },
            { q: 'faq_q2', a: 'faq_a2' },
            { q: 'faq_q3', a: 'faq_a3' },
          ].map((f) => (
            <div key={f.q} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-lg mb-2 notranslate">{T(f.q, lang)}</h4>
              <p className="text-gray-600 notranslate">{T(f.a, lang)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span className="notranslate">Smart Security AI Cab · {SUPPORT_EMAIL}</span>
        </div>
      </div>
    </div>
  );
};

export default Help;
