# Internationalization

## Scope

This spec covers locale loading and key-based user-facing copy.

## Current Solution

- Locale data is loaded dynamically by language.
- `en` is the current default baseline.
- App bootstrap renders a non-localized loading shell immediately, starts
  `App` module loading in parallel with locale and font readiness, keeps the
  live app render gated on those prerequisites, and keeps translation bytes out
  of the bootstrap JS graph.
- Bootstrap translation helpers resolve through the narrow
  `@realmfall/ui-react/i18n` export instead of the broad UI package barrel, so
  startup locale loading does not pull the shared UI entry onto the bootstrap
  path.
- Build chunking keeps that bootstrap i18n runtime in a dedicated `i18n` chunk,
  so locale loading does not make the large gameplay `state` chunk a bootstrap
  dependency.
- Eager bootstrap-facing label catalogs resolve translations lazily when fields
  are read instead of materializing `t(...)` output at module load, so deferred
  `App` module evaluation can overlap locale loading without locking key-shaped
  fallback text into startup caches.
- User-facing copy is expected to live in locale resources and label helpers, including gameplay state messages and content-definition labels.
- Shared tooltip helpers also source user-facing fragments from locale resources instead of assembling inline English copy inside UI modules.
- The translation layer resolves token replacement through keyed templates.
- Bootstrap-loaded locale assets stay compact JSON payloads so translation bytes do not bloat the bootstrap path.
- Repeated generated-recipe description families use compact shared phrasing so the default locale asset does not grow linearly with long near-duplicate sentences.
- The current gameplay code relies on translation keys for state messages, abilities, recipes, labels, and localized content-definition metadata.

## Main Implementation Areas

- `src/i18n/index.ts`
- `src/i18n/labels.ts`
- `src/i18n/locales/en.json`
- `src/game/content/i18n.ts`
- `src/game/state.ts`
