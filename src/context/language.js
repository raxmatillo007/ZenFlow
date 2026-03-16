import { inject, provide } from 'vue';
import { translations } from '../translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

const LanguageSymbol = Symbol('Language');

const ruOverrides = {
  'level': 'Уровень',
  'nextLevel': 'След. уровень',
  'streak': 'Серия дней',
  'timer.minutes': 'мин',
  'stats.title': 'Статистика',
  'stats.totalFocus': 'Всего фокуса',
  'stats.sessions': 'Сессии',
  'stats.history': 'История',
  'stats.overview': 'Обзор',
  'stats.empty': 'Сессий пока нет',
  'stats.session_name': 'Фокус-сессия',
  'oak.growth': 'Рост дуба',
  'oak.next_reward': 'Следующая награда на уровне',
  'oak.levelup': 'Уровень повышен!',
  'oak.stage.soil': 'Стадия земли',
  'oak.stage.seed': 'Желудь',
  'oak.stage.sprout': 'Росток',
  'oak.stage.sapling': 'Саженец',
  'oak.stage.young': 'Молодой дуб',
  'oak.stage.strong': 'Крепкий дуб',
  'oak.stage.big': 'Большой дуб',
  'oak.stage.ancient': 'Древний дуб',
  'oak.stage.legend': 'Легендарный дуб',
  'oak.rank.rookie': 'Новичок',
  'oak.rank.apprentice': 'Ученик',
  'oak.rank.focused': 'Сфокусированный',
  'oak.rank.master': 'Мастер',
  'oak.rank.legend': 'Легенда',
  'oak.reward.badge': 'Значок',
  'oak.reward.aura': 'Аура',
  'oak.reward.theme': 'Тема',
  'progress.detail_btn': 'Подробнее',
  'progress.detail': 'Прогресс',
  'progress.total_xp': 'Всего XP',
  'progress.daily_goal': 'Дневная цель',
  'progress.today_focus': 'Фокус сегодня',
  'progress.daily_completed': 'Дневная цель выполнена',
  'progress.rewards': 'Награды',
  'progress.recent_sessions': 'Последние сессии',
  'progress.locked': 'Закрыто',
  'progress.milestone': 'Рубеж',
  'progress.continue': 'Продолжить'
};

export const provideLanguage = () => {
  const [language, setLanguageValue] = useLocalStorage('zenflow-lang', 'uz');
  const setLanguage = (lang) => setLanguageValue(lang);
  const hasEncodingNoise = (value) => typeof value === 'string' && /Р|С|вЂ|©/.test(value);
  const t = (key) => {
    if (language.value === 'ru' && ruOverrides[key]) return ruOverrides[key];
    const localized = translations[language.value]?.[key];
    if (language.value === 'ru' && hasEncodingNoise(localized)) {
      return translations.en?.[key] || key;
    }
    return localized || key;
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
