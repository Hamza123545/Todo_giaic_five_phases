'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition, useCallback, useEffect, useState } from 'react';
import type { Locale, LanguagePreference } from '@/types/i18n';
import { getLanguageDirection, isRTL, LANGUAGE_PREFERENCE_KEY } from '@/types/i18n';

/**
 * Custom hook for managing language/locale switching with localStorage persistence
 *
 * Features:
 * - Get current locale
 * - Switch between locales with URL navigation
 * - Persist language preference to localStorage
 * - Get language direction (LTR/RTL)
 * - Loading state during language switch
 *
 * @returns Language management utilities
 */
export function useLanguage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Save language preference to localStorage
   */
  const saveLanguagePreference = useCallback((newLocale: Locale) => {
    if (typeof window === 'undefined') return;

    try {
      const preference: LanguagePreference = {
        locale: newLocale,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }, []);

  /**
   * Load language preference from localStorage
   */
  const loadLanguagePreference = useCallback((): Locale | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
      if (!stored) return null;

      const preference: LanguagePreference = JSON.parse(stored);
      return preference.locale;
    } catch (error) {
      console.error('Failed to load language preference:', error);
      return null;
    }
  }, []);

  /**
   * Switch to a new locale/language
   * - Navigates to the new locale URL
   * - Saves preference to localStorage
   * - Updates document direction for RTL support
   */
  const switchLanguage = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;

      setIsLoading(true);

      // Save preference before navigation
      saveLanguagePreference(newLocale);

      // Update document direction immediately for better UX
      if (typeof document !== 'undefined') {
        document.documentElement.dir = getLanguageDirection(newLocale);
        document.documentElement.lang = newLocale;
      }

      // Extract the path without the current locale prefix
      // pathname format: /[locale]/path or just /[locale]
      const segments = pathname.split('/');
      // Remove empty first segment and current locale
      const pathWithoutLocale = segments.slice(2).join('/');
      const newPath = `/${newLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`;

      // Navigate to the new locale path
      startTransition(() => {
        router.push(newPath);
        router.refresh();
        setIsLoading(false);
      });
    },
    [locale, pathname, router, saveLanguagePreference]
  );

  /**
   * Initialize language preference on mount
   * Ensures localStorage preference matches current locale
   */
  useEffect(() => {
    const savedLocale = loadLanguagePreference();

    // Set document attributes for current locale
    if (typeof document !== 'undefined') {
      document.documentElement.dir = getLanguageDirection(locale);
      document.documentElement.lang = locale;
    }

    // If no saved preference exists, save current locale
    if (!savedLocale) {
      saveLanguagePreference(locale);
    }
    // If saved preference differs from URL locale, URL takes precedence
    // (user may have navigated directly to a locale URL)
    else if (savedLocale !== locale) {
      saveLanguagePreference(locale);
    }
  }, [locale, loadLanguagePreference, saveLanguagePreference]);

  return {
    /** Current active locale */
    locale,

    /** Switch to a new locale */
    switchLanguage,

    /** Whether a language switch is in progress */
    isLoading: isPending || isLoading,

    /** Get direction for current locale (ltr or rtl) */
    direction: getLanguageDirection(locale),

    /** Check if current locale is RTL */
    isRTL: isRTL(locale),

    /** Load saved language preference */
    loadLanguagePreference,

    /** Save language preference */
    saveLanguagePreference,
  };
}
