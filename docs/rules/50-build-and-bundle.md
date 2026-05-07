# Build And Bundle Rules

## Build And Bundle

- Keep the production bundle intentional. Avoid pushing heavy world-only or secondary UI code onto the initial path when existing lazy-loading or chunking patterns can keep it deferred.
- When adding a new draggable window, preserve bundle splitting for its content instead of inlining that content into the initial app path.
- Prefer targeted code splitting for heavier dependencies instead of collapsing all third-party code into one growing vendor chunk.
- Treat the existing infinite retry loop for lazy window chunks as an intentional offline or eventual-consistency tradeoff. Do not flag that retry strategy as a general browser-resilience issue during best-practice reviews unless the task explicitly targets chunk-failure behavior.
- Treat bundle growth as a real performance cost, especially on the initial app path and in Pixi-heavy features.
- Keep one-off bundle audits, such as duplicate-dependency detection, behind explicit commands instead of paying their plugin cost on every production build.
- Keep visual bundle treemap audits behind explicit commands such as `pnpm build:visualize` instead of enabling the visualizer plugin on every production build.
- Keep `vite.config.ts` focused on top-level assembly. Move chunk routing, plugin wiring, local HTTPS certificate setup, and Vitest project definitions into neighboring `vite/*` helpers instead of regrowing one multi-responsibility config module.
- Tune Vite's generic chunk-size warning so it does not compete with the repository's intentional lazy-loading strategy or known large shared chunks such as `state` and `pixi`.
- Keep diagnostic or refresh-only startup chrome, such as version polling widgets, off the bootstrap path when a lazy client-side load preserves first interaction and gameplay behavior.
- Keep destructive, reset-only, or rare maintenance flows off the bootstrap graph. If a path only runs from a settings action or similar secondary UI, prefer importing its heavy helpers at action time instead of wiring them into `App` startup.
- Load bootstrap locales as compact data assets instead of eager application code when the app only needs a translation map before importing `App`.
- Use `modulepreload` hints for the deferred `App` entry when that lets the browser fetch the chunk while i18n loads, but keep `src/main.tsx` from evaluating `App` until `loadI18n()` resolves.
- Keep React Compiler enabled through the repository's Vite plugin helper for React 19 app builds, and guard the integration with a Vite plugin policy test when the compiler or plugin path changes.
- Keep shipped locale and other bootstrap-loaded JSON assets on LF line endings so emitted asset sizes stay stable across platforms.
- Keep large repeated locale families concise. When many entries differ only by set name or item slot, prefer shorter shared phrasing over long near-duplicate sentences so locale payloads do not grow faster than the feature surface.
- When new localization copy legitimately grows a bootstrap-loaded locale asset, preserve clarity and tighten duplication elsewhere instead of forcing unclear shorthand.
- Keep static production cache headers explicit. Vite hashed `assets/**` should ship with long-lived immutable caching, while HTML entry files and mutable metadata such as `version.json` should require revalidation.
- Keep generated equipment icon SVG imports out of gameplay and state-facing content modules. Gameplay content should use stable generated icon ids and pool sizes; UI asset modules should resolve those ids to vendored SVG URLs before rendering masks or image tags.
