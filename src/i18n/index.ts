import fr from './locales/fr';
import type { TranslationKeys } from './locales/fr';

type Locale = 'fr';

const translations: Record<Locale, TranslationKeys> = {
  fr,
};

let currentLocale: Locale = 'fr';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(): TranslationKeys {
  return translations[currentLocale];
}

export type { TranslationKeys };
