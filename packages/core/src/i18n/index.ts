import enLocale from './locales/en.json';
import { setLocaleTranslations, type TranslationValue } from './runtime';

export { t, clearTranslations, getCurrentLanguage } from './runtime';
export type { TranslationValue };
export { setLocaleTranslations };

setLocaleTranslations('en', enLocale as Record<string, unknown>);

export const FALLBACK_LANGUAGE = 'en';
