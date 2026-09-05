import { useEffect } from 'react';

/**
 * Loads the in-page translator ONCE at the app root so every route (home,
 * login, rides, safety, admin…) renders in the selected language. The widget
 * itself is hidden — the googtrans cookie drives automatic page translation.
 */
export default function I18nLoader() {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;
    const addScript = document.createElement('script');
    addScript.id = 'google-translate-script';
    addScript.setAttribute('src', 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
    document.body.appendChild(addScript);
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
    };
  }, []);

  return <div id="google_translate_element" style={{ display: 'none' }}></div>;
}
