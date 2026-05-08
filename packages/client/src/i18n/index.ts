import enLocaleUrl from './locales/en.json?url';
import { getCurrentLanguage, setLocaleTranslations, t } from '@realmfall/ui-react';
const LOCALE_ASSET_URLS: Record<string, string> = {
  en: enLocaleUrl,
};

export async function loadI18n(language = 'en') {
  const localeUrl = LOCALE_ASSET_URLS[language];
  if (!localeUrl) {
    throw new Error(`Unsupported locale: ${language}`);
  }

  const response = await fetch(localeUrl);
  if (!response.ok) {
    throw new Error(`Failed to load locale asset: ${language}`);
  }

  const translations = (await response.json()) as Record<string, string>;
  setLocaleTranslations(language, translations);
  return translations;
}

export { getCurrentLanguage, t };
