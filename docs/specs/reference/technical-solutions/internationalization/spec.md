# Internationalization

## Scope

This spec covers locale loading and key-based user-facing copy.

## Current Solution

- Locale data is loaded dynamically by language.
- `en` is the current default baseline.
- User-facing copy is expected to live in locale resources and label helpers.
- The translation layer resolves token replacement through keyed templates.
- The current gameplay code already relies on translation keys for messages, abilities, recipes, and labels.

## Main Implementation Areas

- `src/i18n/index.ts`
- `src/i18n/labels.ts`
- `src/i18n/locales/en.json`
