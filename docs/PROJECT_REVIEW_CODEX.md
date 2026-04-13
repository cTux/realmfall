# Pros

- The repo has a healthy baseline engineering setup. `package.json`, `eslint.config.js`, `vite.config.ts`, Husky, TypeScript strict mode, and the existing Vitest suite give the project real quality gates instead of depending on manual discipline.
- The architecture boundaries are clearer than average for a browser game. Gameplay and simulation logic live in `src/game`, app orchestration lives in `src/app`, and Pixi rendering concerns live in `src/ui/world`, which keeps most non-UI behavior testable and easier to evolve.
- The app already applies useful bundle and startup discipline. `src/main.tsx` loads i18n before bootstrapping the app, `src/app/App/AppWindows.tsx` lazy-loads secondary windows, and the production build is emitting separate chunks for deferred UI content instead of collapsing everything into one bundle.
- The Pixi world path already uses several strong performance-oriented patterns. `src/ui/world/renderSceneCache.ts` keeps persistent stage layers, `src/ui/world/renderScenePools.ts` reuses display objects, and `src/ui/world/renderScene.ts` separates static, interaction, and animated work instead of rebuilding the full scene indiscriminately every frame.
- Renderer determinism and reuse are backed by tests, not just intent. `src/ui/world/renderScene.test.ts` covers object reuse, deterministic cache behavior, fog handling, and animation-sensitive rendering behavior, which is exactly the kind of regression protection performance-sensitive rendering code needs.
- Save hydration is handled with compatibility in mind. `src/app/normalize.ts` preserves older shapes during load, and `src/app/App/useAppPersistence.ts` avoids duplicate writes by comparing serialized snapshots before persisting.
- Browser-specific polish is better than a typical prototype. The project has Storybook, PWA support, image optimization via `vite-plugin-minipic`, and explicit asset chunk naming, which makes the frontend pipeline easier to reason about and maintain.
- The current quality bar is real and verifiable. `pnpm test` passed 109 tests across 12 files, and `pnpm build` completed successfully during this review.

# Cons

- `src/app/App/App.tsx` is still a large orchestration root, and too much derived work hangs off whole-game state changes. Selectors such as visible tiles, current tile, town stock, combat enemies, inventory counts, and filtered logs all recompute from the top whenever `game` changes, which increases React work as the game grows.
- High-frequency world interaction still crosses the broad React state path. In `src/app/App/usePixiWorld.ts`, pointer movement updates `hoveredMove`, `hoveredSafePath`, and tooltip state through React setters, even though the world visuals are already driven by Pixi refs and the ticker.
- Tooltip follow behavior adds its own DOM animation loop. `src/ui/components/GameTooltip/GameTooltip.tsx` starts a continuous `requestAnimationFrame` position sync while the cursor-following tooltip is visible, so hover-heavy world interaction drives both Pixi work and separate DOM work at the same time.
- Static-world invalidation is still broader than it should be. In `src/ui/world/renderScene.ts`, the static layer rebuild is tied to `state` identity, `visibleTiles` identity, and `worldTimeMinutes`, which means terrain, fog, and stable markers can be regenerated even when only a smaller subset of world-facing inputs actually changed.
- Pixi renderer defaults are expensive by default. `src/app/App/usePixiWorld.ts` enables unconditional antialiasing and uses full `window.devicePixelRatio`, which is a risky default for high-DPI or lower-power devices where fill-rate cost matters.
- Persistence work is still heavier than necessary for interactive UI. `src/app/App/useAppPersistence.ts` rebuilds and serializes the full persisted snapshot whenever `game`, `windows`, `windowShown`, or `logFilters` change, which keeps save work close to several frequently-changing UI paths.
- The main shipped JavaScript footprint is still meaningful for a small game shell. The latest production build emitted about `182.53 kB` for the main app chunk, `143.58 kB` for `react-vendor`, and `434.81 kB` for the Pixi chunk before gzip, so bundle discipline still matters.
- Save protection is obfuscation, not real client-side security. `src/persistence/storage.ts` derives the AES key from a hardcoded passphrase that ships with the app, so anyone with the client code can derive the same key.

# Improvements

## Priority 1

- Move world hover, safe-path, and cursor-follow tooltip updates off broad React state where possible.
  Keep fast-changing world interaction in refs or a narrower external store, and only commit React updates for semantic UI changes that actually need React rendering.

- Tighten Pixi invalidation so static layers depend on stable world render inputs instead of full state identity.
  Terrain, fog, stable structure markers, and other map-static visuals should redraw only when their own inputs change, not because a minute tick advanced or an unrelated gameplay object changed identity.

- Break more selector and orchestration load out of `src/app/App/App.tsx`.
  The current root component is doing too much derived computation and coordination, which raises rerender cost and makes future changes riskier than they need to be.

- Reduce autosave work to explicit dirty categories.
  Separate gameplay persistence from transient window/layout/filter churn, and avoid rebuilding the entire serialized payload when only narrow UI state changed.

## Priority 2

- Add a device-aware Pixi quality budget.
  Cap effective resolution on high-DPI screens, make antialiasing conditional, and validate frame time on weaker devices instead of assuming full-quality defaults are acceptable everywhere.

- Add targeted performance verification for React rerenders and Pixi redraw behavior.
  The repo already tests rendering correctness well; the next step is to add checks or profiling guidance for hover churn, static-layer invalidation, autosave frequency, and world interaction hot paths.

- Make visible-world derivation more intentionally stable.
  `getVisibleTiles(game)` currently rebuilds arrays from root game changes; pushing toward stable world-facing selectors or cached derived models would make renderer invalidation easier to reason about and cheaper to maintain.

- Watch the initial app path for bundle creep.
  The current chunking story is decent, but the main app shell is already substantial enough that new UI dependencies and world helpers should be reviewed carefully before they land on the startup path.

## Priority 3

- Clarify docs around save protection.
  Contributor-facing docs should describe the current mechanism as local obfuscation rather than encryption security unless the trust model changes.

- Add explicit contributor guidance for browser performance work.
  A short repo-level note on expected profiling habits, render-budget thinking, and how to evaluate React rerenders versus Pixi redraws would help future changes stay aligned with the existing performance intent.

- Consider whether coverage reporting should become part of the standard workflow.
  The tooling is present and useful, so either make it part of regular review expectations or keep the quality workflow intentionally slimmer.
