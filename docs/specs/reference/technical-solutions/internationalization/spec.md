# Internationalization

## Scope

This spec covers locale loading and key-based user-facing copy.

## Current Solution

- Locale data is loaded dynamically by language.
- `en` is the current default baseline.
- The client ships `en` and `ua` locale assets, with Ukrainian kept on the same lazy-loaded path as English instead of being bundled into the bootstrap graph.
- App bootstrap renders a non-localized loading shell immediately, fetches the active locale asset before importing `App`, and keeps translation bytes out of the bootstrap JS graph.
- User-facing copy is expected to live in locale resources and label helpers, including gameplay state messages and content-definition labels.
- Shared tooltip helpers also source user-facing fragments from locale resources instead of assembling inline English copy inside UI modules.
- The translation layer resolves token replacement through keyed templates.
- Bootstrap-loaded locale assets stay compact JSON payloads so translation bytes remain within the tracked startup budget envelope.
- Repeated generated-recipe description families use compact shared phrasing so the default locale asset does not grow linearly with long near-duplicate sentences.
- The current gameplay code relies on translation keys for state messages, abilities, recipes, labels, and localized content-definition metadata.
- Interface settings persist the selected language and expose English plus Ukrainian in the in-game language selector.

## Main Implementation Areas

- `src/i18n/index.ts`
- `src/i18n/labels.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/ua.json`
- `src/app/interfaceSettings.ts`
- `src/game/content/i18n.ts`
- `src/game/state.ts`
