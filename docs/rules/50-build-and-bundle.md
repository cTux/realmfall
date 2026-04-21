# Build And Bundle Rules

## Build And Bundle

- Keep the production bundle intentional. Avoid pushing heavy world-only or secondary UI code onto the initial path when existing lazy-loading or chunking patterns can keep it deferred.
- When adding a new draggable window, preserve bundle splitting for its content instead of inlining that content into the initial app path.
- Prefer targeted code splitting for heavier dependencies instead of collapsing all third-party code into one growing vendor chunk.
- Treat the existing infinite retry loop for lazy window chunks as an intentional offline or eventual-consistency tradeoff. Do not flag that retry strategy as a general browser-resilience issue during best-practice reviews unless the task explicitly targets chunk-failure behavior.
- Treat bundle growth as a real performance cost, especially on the initial app path and in Pixi-heavy features.
- Document small bundle-size expectations in contributor-facing guidance so chunk regressions are easier to spot before they become large enough to require emergency refactors.
- Keep the automated startup chunk budget check aligned with the current envelope. `pnpm build:budget` should enforce the live startup bootstrap graph, including the main entry, bootstrap-loaded app chunks, locale payloads, and core vendor chunks used before the first interactive render.
- Keep one-off bundle audits, such as duplicate-dependency detection, behind explicit commands instead of paying their plugin cost on every production build.
- Tune Vite's generic chunk-size warning so it does not compete with the repository's explicit startup chunk budgets. `pnpm build:budget` should remain the primary signal for allowed large shared chunks such as `state` and `pixi`.
- Keep diagnostic or refresh-only startup chrome, such as version polling widgets, off the bootstrap path when a lazy client-side load preserves first interaction and gameplay behavior.
- Keep destructive, reset-only, or rare maintenance flows off the bootstrap graph. If a path only runs from a settings action or similar secondary UI, prefer importing its heavy helpers at action time instead of wiring them into `App` startup.
- Load bootstrap locales as compact data assets instead of eager application code when the app only needs a translation map before importing `App`. Keep the emitted locale payload small enough to remain under the tracked startup budget.
- Keep shipped locale and other startup-budgeted JSON assets on LF line endings so emitted asset sizes and chunk-budget checks stay stable across platforms.
- Keep large repeated locale families concise. When many entries differ only by set name or item slot, prefer shorter shared phrasing over long near-duplicate sentences so locale payloads do not grow faster than the feature surface.
