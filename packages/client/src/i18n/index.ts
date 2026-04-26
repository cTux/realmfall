import enLocaleUrl from './locales/en.json?url';

type TranslationValue = string | number;

let translations: Record<string, string> = {};
let currentLanguage = 'en';
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

  translations = (await response.json()) as Record<string, string>;
  currentLanguage = language;
  return translations;
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function t(
  key: string,
  params?: Record<string, TranslationValue | undefined>,
) {
  const template = translations[key];
  if (!template) return key;
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{${token}}` : String(value);
  });
}
