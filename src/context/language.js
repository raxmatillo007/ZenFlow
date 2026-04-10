import { inject, provide } from 'vue';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

const LanguageSymbol = Symbol('Language');

export const provideLanguage = () => {
  const [language, setLanguageValue] = useLocalStorage('zenflow-lang', 'en');

  const setLanguage = (lang) => {
    const next = ['uz', 'ru', 'en'].includes(lang) ? lang : 'en';
    setLanguageValue(next);
  };

  const t = (key) => {
    const locale = translations[language.value] || translations.en;
    return locale[key] || translations.en[key] || key;
  };

  const ctx = { language, setLanguage, t };
  provide(LanguageSymbol, ctx);
  return ctx;
};

export const useLanguage = () => {
  const context = inject(LanguageSymbol);
  if (!context) {
    throw new Error('useLanguage must be used within provideLanguage');
  }
  return context;
};
