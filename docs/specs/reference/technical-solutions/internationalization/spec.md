# Internationalization

## Scope

This spec covers locale loading and key-based user-facing copy.

## Current Solution

- Locale data is loaded dynamically by language.
- `en` is the current default baseline.
- App bootstrap renders a non-localized loading shell immediately, fetches the active locale asset before importing `App`, and keeps translation bytes out of the bootstrap JS graph.
- User-facing copy is expected to live in locale resources and label helpers, including gameplay state messages and content-definition labels.
- Shared tooltip helpers also source user-facing fragments from locale resources instead of assembling inline English copy inside UI modules.
- The translation layer resolves token replacement through keyed templates.
- Bootstrap-loaded locale assets stay compact JSON payloads, and the `en` locale file is kept minified so locale bytes stay within the tracked startup budget envelope.
- The current gameplay code relies on translation keys for state messages, abilities, recipes, labels, and localized content-definition metadata.

## Main Implementation Areas

- `src/i18n/index.ts`
- `src/i18n/labels.ts`
- `src/i18n/locales/en.json`
- `src/game/content/i18n.ts`
- `src/game/state.ts`
