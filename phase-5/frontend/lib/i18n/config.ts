import { LocalePrefix, Pathnames } from 'next-intl/routing';

// Supported locales for the application
export const locales = ['en', 'ur'] as const;
export type Locale = (typeof locales)[number];

// Default locale if none is specified
export const defaultLocale: Locale = 'en';

// Locale prefix strategy
export const localePrefix: LocalePrefix<typeof locales> = 'always';

// Define pathnames for each locale (optional - for localized routes)
export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
  '/tasks': {
    en: '/tasks',
    ur: '/tasks'
  },
  '/settings': {
    en: '/settings',
    ur: '/settings'
  },
  '/dashboard': {
    en: '/dashboard',
    ur: '/dashboard'
  },
  '/calendar': {
    en: '/calendar',
    ur: '/calendar'
  },
  '/chat': {
    en: '/chat',
    ur: '/chat'
  },
  '/signin': {
    en: '/signin',
    ur: '/signin'
  },
  '/signup': {
    en: '/signup',
    ur: '/signup'
  },
  '/forgot-password': {
    en: '/forgot-password',
    ur: '/forgot-password'
  },
  '/reset-password': {
    en: '/reset-password',
    ur: '/reset-password'
  }
} satisfies Pathnames<typeof locales>;

// Port configuration (used by next-intl for server-side)
export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;
