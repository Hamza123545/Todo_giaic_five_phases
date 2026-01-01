import { Locale } from '../lib/i18n/config';

// Language preference stored in localStorage
export interface LanguagePreference {
  locale: Locale;
  lastUpdated: number;
}

// Language direction for RTL/LTR layout
export type Direction = 'ltr' | 'rtl';

// Language display information
export interface LanguageInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: Direction;
  flag: string;
}

// All supported languages with their display info
export const languages: Record<Locale, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    direction: 'rtl',
    flag: '🇵🇰',
  },
};

// Helper to get language direction
export function getLanguageDirection(locale: Locale): Direction {
  return languages[locale].direction;
}

// Helper to check if locale is RTL
export function isRTL(locale: Locale): boolean {
  return languages[locale].direction === 'rtl';
}

// localStorage key for language preference
export const LANGUAGE_PREFERENCE_KEY = 'user-language-preference';

// Translation namespaces
export type TranslationNamespace =
  | 'common'
  | 'tasks'
  | 'voice'
  | 'settings'
  | 'auth'
  | 'navigation'
  | 'chatbot';

// Translation key structure for type safety
export interface TranslationKeys {
  common: {
    buttons: Record<string, string>;
    errors: Record<string, string>;
    labels: Record<string, string>;
    messages: Record<string, string>;
  };
  tasks: {
    list: Record<string, string>;
    form: Record<string, string>;
    item: Record<string, string>;
    details: Record<string, string>;
  };
  voice: {
    button: Record<string, string>;
    status: Record<string, string>;
    feedback: Record<string, string>;
    errors: Record<string, string>;
    help: Record<string, string>;
  };
  settings: {
    language: Record<string, string>;
    voice: Record<string, string>;
    notifications: Record<string, string>;
    profile: Record<string, string>;
  };
  auth: {
    login: Record<string, string>;
    signup: Record<string, string>;
    forgot_password: Record<string, string>;
  };
  navigation: {
    header: Record<string, string>;
    sidebar: Record<string, string>;
    breadcrumbs: Record<string, string>;
  };
  chatbot: {
    interface: Record<string, string>;
    suggestions: Record<string, string>;
    responses: Record<string, string>;
  };
}
