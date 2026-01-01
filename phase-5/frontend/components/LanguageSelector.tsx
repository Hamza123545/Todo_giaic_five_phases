'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { languages, type Locale } from '@/types/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

/**
 * Language Selector Component
 *
 * Dropdown menu for switching between supported languages
 * - Displays current language with flag
 * - Shows all available languages
 * - Persists selection to localStorage
 * - Updates URL to new locale
 */
export function LanguageSelector() {
  const { locale, switchLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages[locale];

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    switchLanguage(newLocale);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isLoading}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.nativeName}</span>
          </span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {(Object.entries(languages) as [Locale, typeof languages[Locale]][]).map(
          ([langCode, langInfo]) => (
            <DropdownMenuItem
              key={langCode}
              onClick={() => handleLanguageChange(langCode)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{langInfo.flag}</span>
                <span>{langInfo.nativeName}</span>
              </span>
              {locale === langCode && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
