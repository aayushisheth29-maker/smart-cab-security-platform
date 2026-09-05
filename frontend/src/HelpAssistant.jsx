import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X, MessageCircle, Send, FileWarning, ChevronDown, Mail } from 'lucide-react';
import { API_BASE } from './api';
import { T, LANGS, getAiLang, setSiteLanguage } from './i18n';

export const SUPPORT_EMAIL = 'support@smartsecurityaicab.com';

const INITIAL_CHIPS = {
  en: ['How do I book a ride?', 'Is SOS real?', 'I want to report a driver', 'Become a driver', 'Contact support'],
  ru: ['Как заказать поездку?', 'SOS работает?', 'Хочу пожаловаться на водителя', 'Стать водителем', 'Связаться с поддержкой'],
  ja: ['予約方法を教えて', 'SOSは本当に機能する？', 'ドライバーを通報したい', 'ドライバーになる', 'サポートに連絡する'],
  zh: ['如何预约行程？', 'SOS是真的吗？', '我想投诉司机', '成为司机', '联系客服'],
  fr: ['Comment réserver une course ?', 'Le SOS est-il réel ?', 'Je veux signaler un chauffeur', 'Devenir chauffeur', 'Contacter le support'],
  de: ['Wie buche ich eine Fahrt?', 'Ist SOS echt?', 'Ich will einen Fahrer melden', 'Fahrer werden', 'Support kontaktieren'],
};

// Wraps already-translated text so the page translator never re-translates it.
function TT({ k, lang }) {
  return <span className="notranslate">{T(k, lang)}</span>;
}

// ---------------------------------------------------------------------------
// AI ASSISTANT CHAT — shared by the floating widget and the /help page
// ---------------------------------------------------------------------------
export function AssistantChat({ initialHeight = 'h-[380px]' }) {
  const lang = getAiLang();
  const [messages, setMessages] = useState([{ role: 'ai', text: T('assistant_welcome', lang) }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState(INITIAL_CHIPS[lang] || INITIAL_CHIPS.en);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setError('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'assistant error');
      setMessages((m) => [...m, { role: 'ai', text: data.reply }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length) setChips(data.suggestions);
    } catch (e) {
      setError(T('assistant_error', lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className={`overflow-y-auto p-4 space-y-3 ${initialHeight}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap notranslate ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="text-xs text-slate-400 bg-slate-100 rounded-2xl px-3 py-2 notranslate">
              <TT k="typing" lang={lang} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chips.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase w-full notranslate"><TT k="quick" lang={lang} /></span>
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-2.5 py-1 transition notranslate"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 p-3">
        {error && <p className="text-xs font-semibold text-red-600 mb-2 notranslate">{error}</p>}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={T('assistant_placeholder', lang)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 notranslate"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="bg-slate-900 text-white rounded-xl px-4 flex items-center justify-center hover:bg-slate-700 disabled:opacity-50 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// REPORT A DRIVER (rider → company support ticket)
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { key: 'report_driver', tkey: 'cat_report' },
  { key: 'unsafe_driving', tkey: 'cat_safe' },
  { key: 'overcharging', tkey: 'cat_fare' },
  { key: 'harassment', tkey: 'cat_harass' },
  { key: 'lost_item', tkey: 'cat_lost' },
  { key: 'other', tkey: 'cat_other' },
];

function ReportDriver() {
  const lang = getAiLang();
  const [form, setForm] = useState({ name: '', email: '', rideCode: '', category: 'report_driver', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 5) {
      setErr(T('report_required', lang));
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/support/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          category: form.category,
          rideCode: form.rideCode.trim(),
          message: form.message.trim(),
          language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : 'submit failed');
      const ref = data?.request?.reference ? ` · ${data.request.reference}` : '';
      setDone(`✅ ${T('report_success', lang)}${ref}`);
      setForm({ name: '', email: '', rideCode: '', category: 'report_driver', message: '' });
    } catch (e2) {
      setErr(typeof e2?.message === 'string' ? e2.message : T('report_error', lang));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 notranslate';

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder={T('field_name', lang)} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <input type="email" placeholder={T('field_email', lang)} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
      </div>
      <input placeholder={T('field_ride', lang)} value={form.rideCode}
        onChange={(e) => setForm({ ...form, rideCode: e.target.value })} className={field} />
      <div className="relative">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className={`${field} appearance-none pr-9`}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{T(c.tkey, lang)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
      <textarea placeholder={T('field_message', lang)} rows={4} value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={`${field} resize-none`} />
      {done && <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 notranslate">✅ {done}</p>}
      {err && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 notranslate">⚠️ {err}</p>}
      <button type="submit" disabled={busy}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-60 notranslate">
        {busy ? '…' : <TT k="submit_report" lang={lang} />}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FLOATING HELP BUTTON + MODAL (available on every page)
// ---------------------------------------------------------------------------
export default function FloatingHelp() {
  const lang = getAiLang();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('help');

  // The /help page can open the same widget (e.g. "Ask the AI assistant").
  useEffect(() => {
    const handler = (e) => {
      const which = e.detail?.tab || 'help';
      setTab(which);
      setOpen(true);
    };
    window.addEventListener('smartcab:open-help', handler);
    return () => window.removeEventListener('smartcab:open-help', handler);
  }, []);

  const tabBtn = (key, icon, label) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 rounded-xl transition notranslate ${
        tab === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {icon}
      <span className="notranslate">{label}</span>
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Help and support"
        title="Help & Support"
        className="fixed bottom-5 right-5 z-[450] h-14 w-14 rounded-full bg-slate-900 text-white shadow-2xl border-2 border-amber-400 flex items-center justify-center hover:scale-105 active:scale-95 transition transform animate-in fade-in zoom-in duration-300"
      >
        <LifeBuoy className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg notranslate"><TT k="help_title" lang={lang} /></h3>
                <p className="text-[11px] text-slate-300 notranslate"><TT k="help_subtitle" lang={lang} /></p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-4 pb-2 flex gap-2">
              {tabBtn('help', <MessageCircle className="h-3.5 w-3.5" />, T('tab_help', lang))}
              {tabBtn('report', <FileWarning className="h-3.5 w-3.5" />, T('tab_report', lang))}
              {tabBtn('assistant', <LifeBuoy className="h-3.5 w-3.5" />, T('tab_assistant', lang))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-3">
              {tab === 'help' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="font-extrabold text-red-700 text-sm notranslate"><TT k="emergency_heading" lang={lang} /></p>
                    <p className="text-xs text-red-600 mt-1 notranslate"><TT k="emergency_text" lang={lang} /></p>
                  </div>

                  <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Smart Security AI Cab — Help / Report')}`}
                    className="block bg-purple-50 border border-purple-200 rounded-2xl p-4 hover:bg-purple-100 transition">
                    <p className="font-extrabold text-purple-700 text-sm notranslate"><TT k="email_heading" lang={lang} /></p>
                    <p className="text-xs text-purple-600 mt-1 notranslate"><TT k="email_text" lang={lang} /></p>
                    <p className="text-xs font-bold text-purple-700 mt-2 notranslate"><TT k="email_btn" lang={lang} /></p>
                  </a>

                  <div>
                    <p className="text-sm font-extrabold text-slate-700 mb-2 notranslate"><TT k="faq_heading" lang={lang} /></p>
                    <details className="bg-slate-50 rounded-xl px-4 py-3 mb-2">
                      <summary className="text-sm font-bold text-slate-800 cursor-pointer notranslate"><TT k="faq_q1" lang={lang} /></summary>
                      <p className="text-xs text-slate-600 mt-2 notranslate"><TT k="faq_a1" lang={lang} /></p>
                    </details>
                    <details className="bg-slate-50 rounded-xl px-4 py-3 mb-2">
                      <summary className="text-sm font-bold text-slate-800 cursor-pointer notranslate"><TT k="faq_q2" lang={lang} /></summary>
                      <p className="text-xs text-slate-600 mt-2 notranslate"><TT k="faq_a2" lang={lang} /></p>
                    </details>
                    <details className="bg-slate-50 rounded-xl px-4 py-3">
                      <summary className="text-sm font-bold text-slate-800 cursor-pointer notranslate"><TT k="faq_q3" lang={lang} /></summary>
                      <p className="text-xs text-slate-600 mt-2 notranslate"><TT k="faq_a3" lang={lang} /></p>
                    </details>
                  </div>
                </div>
              )}

              {tab === 'report' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 notranslate"><TT k="report_desc" lang={lang} /></p>
                  <ReportDriver />
                </div>
              )}

              {tab === 'assistant' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 notranslate"><TT k="assistant_desc" lang={lang} /></p>
                  <AssistantChat initialHeight="h-[300px]" />
                </div>
              )}
            </div>

            {/* Language row */}
            <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide notranslate">
                <TT k="language_heading" lang={lang} />
              </span>
              <select
                value={lang}
                onChange={(e) => setSiteLanguage(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500 notranslate"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.eng} · {l.native}</option>
                ))}
              </select>
              <a href={`mailto:${SUPPORT_EMAIL}`} title="Email us" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
