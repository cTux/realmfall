export type TranslationValue = string | number;

type TranslationParams = Record<string, TranslationValue | undefined>;

const FALLBACK_LANGUAGE = 'en';

let translations: Record<string, string> = {};
let currentLanguage = FALLBACK_LANGUAGE;

export function getCurrentLanguage() {
  return currentLanguage;
}

export function setLocaleTranslations(
  language: string,
  nextTranslations: Record<string, string>,
) {
  translations = nextTranslations;
  currentLanguage = language;
}

export function clearTranslations() {
  translations = {};
  currentLanguage = FALLBACK_LANGUAGE;
}

export function t(key: string, params?: TranslationParams) {
  const template = translations[key];
  if (!template) return key;
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{${token}}` : String(value);
  });
}
