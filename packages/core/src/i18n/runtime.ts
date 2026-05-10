type TranslationValue = string | number;
type RawTranslationValues = Record<string, unknown>;
type FlattenedTranslations = Record<string, string>;

const FALLBACK_LANGUAGE = 'en';

export type { TranslationValue };

const coreTranslations: Record<string, FlattenedTranslations> = {
  [FALLBACK_LANGUAGE]: {},
};

let currentLanguage = FALLBACK_LANGUAGE;
let translations = coreTranslations[FALLBACK_LANGUAGE];

export function getCurrentLanguage() {
  return currentLanguage;
}

export function setLocaleTranslations(
  language: string,
  nextTranslations: RawTranslationValues,
) {
  const normalized = flattenTranslations(nextTranslations);
  coreTranslations[language] = normalized;
  currentLanguage = language;
  translations = normalized;
}

export function clearTranslations() {
  const fallback = coreTranslations[FALLBACK_LANGUAGE];
  currentLanguage = FALLBACK_LANGUAGE;
  translations = fallback;
}

export function t(key: string, params?: Record<string, TranslationValue>) {
  const template = translations[key];
  if (!template) return key;
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{${token}}` : String(value);
  });
}

function flattenTranslations(input: RawTranslationValues) {
  const output: FlattenedTranslations = {};

  const walk = (value: unknown, path: string[]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      output[path.join('.')] = String(value);
      return;
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return;
    }

    for (const [key, nested] of Object.entries(value)) {
      walk(nested, [...path, key]);
    }
  };

  walk(input, []);
  return output;
}
