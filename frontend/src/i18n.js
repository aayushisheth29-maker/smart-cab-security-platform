// 🌐 INTERNATIONAL LANGUAGES — Smart Security AI Cab
//
// Language selection works through the in-page translator (same approach the
// app already used for Indian languages): we set the googtrans cookie and
// reload, so the WHOLE site (ride flow, safety, admin, everywhere) renders in
// the chosen language. The help widget + AI assistant additionally ship with
// authored translations for the 6 core languages so they work even before the
// page translator kicks in (and stay readable if the translator is blocked).
//
// Codes:
//   code   -> stable app code (used by the language picker + assistant)
//   google -> language code handed to the translator (zh-CN for Simplified Chinese)
//   ai     -> language code understood by POST /api/assistant

export const LANGS = [
  { code: 'en', google: 'en',     eng: 'English',                    native: 'English',         ai: 'en' },
  { code: 'ru', google: 'ru',     eng: 'Russian',                    native: 'Русский',         ai: 'ru' },
  { code: 'ja', google: 'ja',     eng: 'Japanese',                   native: '日本語',           ai: 'ja' },
  { code: 'zh', google: 'zh-CN',  eng: 'Chinese (Simplified)',       native: '中文（简体）',     ai: 'zh' },
  { code: 'fr', google: 'fr',     eng: 'French',                     native: 'Français',        ai: 'fr' },
  { code: 'de', google: 'de',     eng: 'German',                     native: 'Deutsch',         ai: 'de' },
  { code: 'bn', google: 'bn',     eng: 'Bangla',                     native: 'বাংলা',            ai: 'en' },
  { code: 'gu', google: 'gu',     eng: 'Gujarati',                   native: 'ગુજરાતી',          ai: 'en' },
  { code: 'hi', google: 'hi',     eng: 'Hindi',                      native: 'हिन्दी',           ai: 'en' },
  { code: 'kn', google: 'kn',     eng: 'Kannada',                    native: 'ಕನ್ನಡ',            ai: 'en' },
  { code: 'mr', google: 'mr',     eng: 'Marathi',                    native: 'मराठी',            ai: 'en' },
  { code: 'ta', google: 'ta',     eng: 'Tamil',                      native: 'தமிழ்',            ai: 'en' },
  { code: 'te', google: 'te',     eng: 'Telugu',                     native: 'తెలుగు',           ai: 'en' },
  { code: 'ur', google: 'ur',     eng: 'Urdu',                       native: 'اردو',             ai: 'en' },
];

export const SUPPORTED_LANG_CODES = LANGS.map((l) => l.code);

function getCookie(name) {
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
  document.cookie = clear;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  if (lang.google !== 'en') {
    document.cookie = `googtrans=/en/${lang.google}; path=/;`;
    document.cookie = `googtrans=/en/${lang.google}; path=/; domain=${window.location.hostname};`;
  }
  try { localStorage.setItem('smartcab_lang', code); } catch (e) { /* noop */ }
  window.location.reload();
}

// ---------------------------------------------------------------------------
// 💬 HELP CENTER + AI ASSISTANT — authored translations (en/ru/ja/zh/fr/de)
// Render with <T k="key" /> inside the widget so the page translator doesn't
// re-translate text we already wrote in the target language.
// ---------------------------------------------------------------------------

export const HELP_T = {
  help_title: {
    en: 'Help & Support',
    ru: 'Помощь и поддержка',
    ja: 'ヘルプ＆サポート',
    zh: '帮助与支持',
    fr: 'Aide et support',
    de: 'Hilfe & Support',
  },
  help_subtitle: {
    en: 'Report a driver, find help or email us — available in your language.',
    ru: 'Пожаловаться на водителя, найти помощь или написать нам — на вашем языке.',
    ja: 'ドライバーの通報、お困りごとの解決、メールでのお問い合わせ — ご希望の言語でどうぞ。',
    zh: '投诉司机、寻求帮助或给我们发邮件 — 支持您的语言。',
    fr: 'Signaler un chauffeur, trouver de l’aide ou nous écrire — dans votre langue.',
    de: 'Fahrer melden, Hilfe finden oder uns mailen — in deiner Sprache.',
  },
  tab_help: { en: 'Help Center', ru: 'Справочный центр', ja: 'ヘルプセンター', zh: '帮助中心', fr: 'Centre d’aide', de: 'Hilfe-Center' },
  tab_report: { en: 'Report a Driver', ru: 'Пожаловаться на водителя', ja: 'ドライバーを通報', zh: '投诉司机', fr: 'Signaler un chauffeur', de: 'Fahrer melden' },
  tab_assistant: { en: 'AI Assistant', ru: 'ИИ-помощник', ja: 'AIアシスタント', zh: 'AI助手', fr: 'Assistant IA', de: 'KI-Assistent' },
  close: { en: 'Close', ru: 'Закрыть', ja: '閉じる', zh: '关闭', fr: 'Fermer', de: 'Schließen' },

  // Help tab
  faq_heading: { en: 'Frequently asked questions', ru: 'Часто задаваемые вопросы', ja: 'よくある質問', zh: '常见问题', fr: 'Questions fréquentes', de: 'Häufige Fragen' },
  faq_q1: { en: 'How does AI route security work?', ru: 'Как работает ИИ-контроль маршрута?', ja: 'AIルート安全機能とは？', zh: 'AI路线安全是如何工作的？', fr: 'Comment fonctionne la sécurité IA de l’itinéraire ?', de: 'Wie funktioniert die KI-Routensicherheit?' },
  faq_a1: {
    en: 'Live GPS follows your route. If the vehicle deviates, the app alerts and flags the unusual behaviour so our team can check on you — it never declares an emergency on its own.',
    ru: 'GPS в реальном времени следит за маршрутом. При отклонении приложение предупреждает и помечает необычное поведение, чтобы команда могла проверить вас — само оно экстренную ситуацию не объявляет.',
    ja: 'リアルタイムGPSがルートを追跡します。逸脱を検知するとアプリが通知し、異常な挙動としてフラグを立ててチームが確認します。単独で緊急事態と判断することはありません。',
    zh: '实时GPS追踪路线。若车辆偏离，应用会提醒并标记异常行为，让团队联系您——不会自行判定为紧急情况。',
    fr: 'Le GPS suit votre itinéraire en temps réel. En cas de déviation, l’app alerte et signale le comportement inhabituel ; elle ne déclare jamais une urgence seule.',
    de: 'Live-GPS verfolgt deine Route. Bei Abweichung warnt die App und markiert das ungewöhnliche Verhalten — sie erklärt nie von sich aus einen Notfall.',
  },
  faq_q2: { en: 'How do I report a driver?', ru: 'Как пожаловаться на водителя?', ja: 'ドライバーを通報するには？', zh: '如何投诉司机？', fr: 'Comment signaler un chauffeur ?', de: 'Wie melde ich einen Fahrer?' },
  faq_a2: {
    en: 'Open Help → Report a Driver, choose a category, describe what happened and send. The report is saved with your ride details and our team reviews every one.',
    ru: 'Откройте «Помощь» → «Пожаловаться на водителя», выберите категорию, опишите ситуацию и отправьте. Жалоба сохраняется с данными поездки, и команда проверяет каждую.',
    ja: '「ヘルプ」→「ドライバーを通報」からカテゴリを選び、状況を入力して送信してください。乗車情報と一緒に保存され、すべて担当チームが確認します。',
    zh: '打开“帮助”→“投诉司机”，选择类别，描述情况并提交。报告会连同行程信息保存，团队会逐条处理。',
    fr: 'Ouvrez Aide → Signaler un chauffeur, choisissez une catégorie, décrivez et envoyez. Le signalement est enregistré avec les détails de la course et examiné par notre équipe.',
    de: 'Öffne Hilfe → Fahrer melden, wähle eine Kategorie, beschreibe den Vorfall und sende ab. Die Meldung wird mit den Fahrtdetails gespeichert und geprüft.',
  },
  faq_q3: { en: 'Is the SOS button a call to emergency services?', ru: 'Кнопка SOS — это звонок в экстренные службы?', ja: 'SOSボタンは緊急通報ですか？', zh: 'SOS按钮会呼叫急救服务吗？', fr: 'Le bouton SOS appelle-t-il les secours ?', de: 'Ruft der SOS-Button den Rettungsdienst an?' },
  faq_a3: {
    en: 'No. SOS alerts the security team inside the app. In a real emergency, always call your local emergency number first (112 in India).',
    ru: 'Нет. SOS отправляет сигнал службе безопасности внутри приложения. При реальной опасности сначала звоните в местную службу спасения (112 в Индии).',
    ja: 'いいえ。SOSはアプリ内の警備チームへ通知します。本当の緊急時は、まず現地の緊急番号（インドは112）にお電話ください。',
    zh: '不是。SOS会在应用内提醒安全团队。遇到真正紧急情况，请先拨打当地紧急号码（印度为112）。',
    fr: 'Non. Le SOS alerte l’équipe de sécurité dans l’app. En vraie urgence, appelez d’abord votre numéro local (112 en Inde).',
    de: 'Nein. SOS alarmiert die Sicherheitscrew in der App. Bei echter Gefahr ruf zuerst die örtliche Notrufnummer an (in Indien 112).',
  },
  emergency_heading: { en: 'In an emergency', ru: 'В экстренной ситуации', ja: '緊急時は', zh: '紧急情况', fr: 'En cas d’urgence', de: 'Im Notfall' },
  emergency_text: {
    en: 'Call your local emergency number immediately (112 in India), then use the SOS button in the app.',
    ru: 'Сначала позвоните в местную службу спасения (112 в Индии), затем нажмите SOS в приложении.',
    ja: 'まず現地の緊急番号（インドは112）にお電話ください。その後にアプリのSOSボタンを使用してください。',
    zh: '请立即拨打当地紧急号码（印度为112），然后使用应用内的SOS按钮。',
    fr: 'Appelez immédiatement votre numéro local (112 en Inde), puis utilisez le bouton SOS dans l’app.',
    de: 'Ruf sofort die örtliche Notrufnummer an (in Indien 112), dann nutze den SOS-Button in der App.',
  },
  email_heading: { en: 'Email Smart Security AI Cab', ru: 'Написать в Smart Security AI Cab', ja: 'Smart Security AI Cabへメール', zh: '给Smart Security AI Cab发邮件', fr: 'Écrire à Smart Security AI Cab', de: 'Smart Security AI Cab mailen' },
  email_text: {
    en: 'For non-urgent questions, reports and feedback — include your Ride ID if you have one.',
    ru: 'Для не срочных вопросов, жалоб и отзывов — укажите номер поездки, если он есть.',
    ja: '緊急ではない質問・通報・ご意見は、Ride IDをお持ちなら併記してください。',
    zh: '非紧急的问题、报告和反馈 — 如有行程编号请附上。',
    fr: 'Pour les questions non urgentes, signalements et retours — indiquez votre ID de course si vous l’avez.',
    de: 'Für nicht dringende Fragen, Meldungen und Feedback — gib deine Ride-ID an, falls vorhanden.',
  },
  email_btn: { en: 'Open email app ✉️', ru: 'Открыть почту ✉️', ja: 'メールアプリを開く ✉️', zh: '打开邮件 ✉️', fr: 'Ouvrir la messagerie ✉️', de: 'E-Mail-App öffnen ✉️' },
  assistant_cta: { en: 'Ask the AI assistant', ru: 'Спросить ИИ-помощника', ja: 'AIアシスタントに聞く', zh: '询问AI助手', fr: 'Demander à l’assistant IA', de: 'Frag den KI-Assistenten' },

  // Report tab
  report_heading: { en: 'Report a driver', ru: 'Пожаловаться на водителя', ja: 'ドライバーを通報', zh: '投诉司机', fr: 'Signaler un chauffeur', de: 'Fahrer melden' },
  report_desc: {
    en: 'Your report goes straight to our team with the ride details. Drivers are protected too — reports are reviewed fairly on both sides.',
    ru: 'Ваша жалоба сразу попадает к команде вместе с данными поездки. Водители также защищены — жалобы рассматриваются объективно с обеих сторон.',
    ja: '通報は乗車情報と一緒に担当チームへ届きます。ドライバーも保護されており、報告は双方に公平に審査されます。',
    zh: '报告会连同行程信息直接发送给团队。司机同样受保护 — 报告会公平地双向审核。',
    fr: 'Votre signalement arrive à notre équipe avec les détails de la course. Les chauffeurs sont aussi protégés — chaque signalement est examiné équitablement.',
    de: 'Deine Meldung geht mit den Fahrtdetails an unser Team. Auch Fahrer sind geschützt — Meldungen werden fair von beiden Seiten geprüft.',
  },
  field_name: { en: 'Your name', ru: 'Ваше имя', ja: 'お名前', zh: '您的姓名', fr: 'Votre nom', de: 'Dein Name' },
  field_email: { en: 'Email (so we can reply)', ru: 'Email (для ответа)', ja: 'メールアドレス（返信用）', zh: '邮箱（便于回复）', fr: 'Email (pour répondre)', de: 'E-Mail (für Antwort)' },
  field_ride: { en: 'Ride ID (optional, e.g. SC-2026-000012)', ru: 'Номер поездки (необязательно, напр. SC-2026-000012)', ja: 'Ride ID（任意、例 SC-2026-000012）', zh: '行程编号（可选，如SC-2026-000012）', fr: 'ID de course (optionnel, ex. SC-2026-000012)', de: 'Ride-ID (optional, z. B. SC-2026-000012)' },
  cat_label: { en: 'What happened?', ru: 'Что произошло?', ja: '何が起きましたか？', zh: '发生了什么？', fr: 'Que s’est-il passé ?', de: 'Was ist passiert?' },
  cat_report: { en: 'Unprofessional / rude behaviour', ru: 'Непрофессиональное / грубое поведение', ja: '無礼・不適切な言動', zh: '不专业/态度差', fr: 'Comportement impoli / non professionnel', de: 'Unhöfliches / unprofessionelles Verhalten' },
  cat_safe: { en: 'Unsafe driving', ru: 'Небезопасное вождение', ja: '危険な運転', zh: '危险驾驶', fr: 'Conduite dangereuse', de: 'Unsicheres Fahren' },
  cat_fare: { en: 'Overcharging / fare issue', ru: 'Завышенная стоимость / вопрос по тарифу', ja: '過剰請求・料金トラブル', zh: '多收费/费用问题', fr: 'Trop facturé / problème de tarif', de: 'Überhöhter Preis / Tarifproblem' },
  cat_harass: { en: 'Harassment / safety concern', ru: 'Домогательства / опасения за безопасность', ja: 'ハラスメント・安全上の懸念', zh: '骚扰/安全问题', fr: 'Harcèlement / problème de sécurité', de: 'Belästigung / Sicherheitsbedenken' },
  cat_lost: { en: 'Lost item', ru: 'Забытая вещь', ja: '忘れ物', zh: '遗失物品', fr: 'Objet perdu', de: 'Gegenstand vergessen' },
  cat_other: { en: 'Other', ru: 'Другое', ja: 'その他', zh: '其他', fr: 'Autre', de: 'Sonstiges' },
  field_message: { en: 'Describe what happened…', ru: 'Опишите, что произошло…', ja: '状況を説明してください…', zh: '描述发生了什么…', fr: 'Décrivez ce qui s’est passé…', de: 'Beschreibe, was passiert ist…' },
  submit_report: { en: 'Send report', ru: 'Отправить жалобу', ja: '送信する', zh: '提交报告', fr: 'Envoyer le signalement', de: 'Meldung senden' },
  report_success: {
    en: 'Report saved. Our team reviews every request (usually within 24–48 hours).',
    ru: 'Жалоба сохранена. Команда проверяет каждую заявку (обычно в течение 24–48 часов).',
    ja: '通報を受け付けました。すべてのご依頼を確認しています（通常24〜48時間以内）。',
    zh: '报告已保存。团队会处理每条请求（通常在24–48小时内）。',
    fr: 'Signalement enregistré. Notre équipe examine chaque demande (généralement sous 24–48 h).',
    de: 'Meldung gespeichert. Jede Anfrage wird geprüft (meist innerhalb von 24–48 Stunden).',
  },
  report_error: { en: 'Could not send — please try again.', ru: 'Не удалось отправить — попробуйте снова.', ja: '送信できませんでした — もう一度お試しください。', zh: '发送失败 — 请重试。', fr: 'Envoi impossible — veuillez réessayer.', de: 'Senden fehlgeschlagen — bitte erneut versuchen.' },
  report_required: { en: 'Please add a short description.', ru: 'Добавьте короткое описание.', ja: '簡単な説明を入力してください。', zh: '请填写简短描述。', fr: 'Ajoutez une courte description.', de: 'Bitte füge eine kurze Beschreibung hinzu.' },

  // Assistant tab
  assistant_heading: { en: 'AI Assistant', ru: 'ИИ-помощник', ja: 'AIアシスタント', zh: 'AI助手', fr: 'Assistant IA', de: 'KI-Assistent' },
  assistant_desc: {
    en: 'Ask about booking, fares, safety, SOS, reporting or becoming a driver. Answers come from our safety guide.',
    ru: 'Спрашивайте о бронировании, стоимости, безопасности, SOS, жалобах или работе водителем. Ответы — из нашего руководства по безопасности.',
    ja: '予約、料金、安全、SOS、通報、ドライバー応募についてお尋ねください。回答は安全性ガイドに基づいています。',
    zh: '可以询问预订、费用、安全、SOS、投诉或成为司机。答案来自我们的安全指南。',
    fr: 'Posez vos questions sur la réservation, les tarifs, la sécurité, le SOS, les signalements ou devenir chauffeur. Les réponses viennent de notre guide de sécurité.',
    de: 'Frag nach Buchung, Preisen, Sicherheit, SOS, Meldungen oder Fahrer werden. Antworten stammen aus unserem Sicherheitsleitfaden.',
  },
  assistant_placeholder: { en: 'Type your question…', ru: 'Введите вопрос…', ja: '質問を入力…', zh: '输入您的问题…', fr: 'Écrivez votre question…', de: 'Tippe deine Frage…' },
  quick: { en: 'Quick questions', ru: 'Быстрые вопросы', ja: 'クイック質問', zh: '快捷问题', fr: 'Questions rapides', de: 'Schnellfragen' },
  send: { en: 'Send', ru: 'Отправить', ja: '送信', zh: '发送', fr: 'Envoyer', de: 'Senden' },
  typing: { en: 'thinking…', ru: 'думаю…', ja: '考え中…', zh: '思考中…', fr: 'réfléchit…', de: 'denkt nach…' },
  assistant_error: { en: 'Assistant unavailable — try again or email us.', ru: 'Помощник недоступен — попробуйте снова или напишите нам.', ja: 'アシスタントに接続できません — 再試行またはメールでご連絡ください。', zh: '助手暂不可用 — 请重试或发送邮件。', fr: 'Assistant indisponible — réessayez ou écrivez-nous.', de: 'Assistent nicht erreichbar — versuch es erneut oder mail uns.' },
  assistant_welcome: {
    en: 'Hello! 👋 I’m here to help — booking, fares, safety, SOS, reporting a driver, lost items, becoming a driver or languages. What do you need?',
    ru: 'Здравствуйте! 👋 Я здесь, чтобы помочь — бронирование, стоимость, безопасность, SOS, жалобы на водителя, забытые вещи, работа водителем или языки. Что вам нужно?',
    ja: 'こんにちは！👋 予約、料金、安全、SOS、ドライバー通報、忘れ物、ドライバー応募、言語 — ご質問をどうぞ。',
    zh: '您好！👋 我可以帮助预订、费用、安全、SOS、投诉司机、遗失物品、成为司机或语言切换。请问需要什么？',
    fr: 'Bonjour ! 👋 Je peux aider pour la réservation, les tarifs, la sécurité, le SOS, les signalements, les objets perdus, devenir chauffeur ou les langues. Que vous faut-il ?',
    de: 'Hallo! 👋 Ich helfe bei Buchen, Preisen, Sicherheit, SOS, Fahrer-Meldung, verlorenen Sachen, Fahrer werden oder Sprachen. Was brauchst du?',
  },

  // Language row
  language_heading: { en: 'Language', ru: 'Язык', ja: '言語', zh: '语言', fr: 'Langue', de: 'Sprache' },
};

export const T = (key, lang) => {
  const bucket = HELP_T[key];
  if (!bucket) return key;
  return bucket[lang] || bucket.en;
};

/** Logs the site language from an injected API response (normalizes zh-CN etc.). */
export const normalizeAiLang = (l) => {
  const code = (l || 'en').toLowerCase();
  if (code.startsWith('zh')) return 'zh';
  return ['en', 'ru', 'ja', 'zh', 'fr', 'de'].includes(code) ? code : 'en';
};
