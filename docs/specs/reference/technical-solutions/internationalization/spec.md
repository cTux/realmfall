# Internationalization

## Scope

This spec covers locale loading and key-based user-facing copy.

## Current Solution

- Locale data is loaded dynamically by language.
- `en` is the current default baseline.
- User-facing copy is expected to live in locale resources and label helpers, including gameplay state messages and content-definition labels.
- The translation layer resolves token replacement through keyed templates.
- The current gameplay code relies on translation keys for state messages, abilities, recipes, labels, and localized content-definition metadata.

## Main Implementation Areas

- `src/i18n/index.ts`
- `src/i18n/labels.ts`
- `src/i18n/locales/en.json`
- `src/game/content/i18n.ts`
- `src/game/state.ts`
