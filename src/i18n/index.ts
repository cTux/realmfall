type TranslationValue = string | number;

let translations: Record<string, string> = {};
let currentLanguage = 'en';

export async function loadI18n(language = 'en') {
  const localeModule = await import(`./locales/${language}.json`);
  translations = localeModule.default;
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
