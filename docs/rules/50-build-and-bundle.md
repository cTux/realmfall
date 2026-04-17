# Build And Bundle Rules

## Build And Bundle

- Keep the production bundle intentional. Avoid pushing heavy world-only or secondary UI code onto the initial path when existing lazy-loading or chunking patterns can keep it deferred.
- When adding a new draggable window, preserve bundle splitting for its content instead of inlining that content into the initial app path.
- Prefer targeted code splitting for heavier dependencies instead of collapsing all third-party code into one growing vendor chunk.
- Treat the existing infinite retry loop for lazy window chunks as an intentional offline or eventual-consistency tradeoff. Do not flag that retry strategy as a general browser-resilience issue during best-practice reviews unless the task explicitly targets chunk-failure behavior.
- Treat bundle growth as a real performance cost, especially on the initial app path and in Pixi-heavy features.
- Document small bundle-size expectations in contributor-facing guidance so chunk regressions are easier to spot before they become large enough to require emergency refactors.
- Keep the automated startup chunk budget check aligned with the current envelope. `pnpm build:budget` should enforce the live startup bootstrap graph, including the main entry, bootstrap-loaded app chunks, locale payloads, and core vendor chunks used before the first interactive render.
