# Project Review

## Pros

- The project has strong baseline engineering hygiene. `package.json`, `eslint.config.js`, `vite.config.ts`, Husky, and the test suite give the repo working typecheck, lint, format, test, and build paths instead of relying on manual discipline.
- The architectural split is mostly clear and healthy. Gameplay rules stay in `src/game`, React orchestration stays in `src/app`, and Pixi rendering concerns stay in `src/ui/world`, which keeps most domain logic testable without the browser.
- React containment is better than average for a browser game UI. `src/app/App/AppWindows.tsx` lazy-loads secondary windows, and many UI windows are wrapped in `memo`, which helps keep desktop-style window rendering from fanning out unnecessarily.
- The world renderer already follows several good Pixi practices. `src/ui/world/renderSceneCache.ts` keeps persistent stage layers, and `src/ui/world/renderScenePools.ts` reuses `Graphics`, `Sprite`, and `Text` instances instead of allocating display objects every render.
- The current world path uses one clear render loop. `src/app/App/usePixiWorld.ts` drives `renderScene` from the Pixi ticker rather than layering multiple always-on render schedulers.
- Deterministic visual inputs are partly cached already. `src/ui/world/renderScene.ts` caches cloud inputs by seed and ground-cover presentation by tile key, which prevents some stable presentation data from being regenerated on every render.
- Save hydration is handled with backward-compatibility in mind. `src/app/normalize.ts` normalizes older shapes before hydration, and `src/app/App/useAppPersistence.ts` avoids rewriting identical serialized snapshots.
- The rendering path and game rules have meaningful automated coverage. `src/ui/world/renderScene.test.ts`, `src/ui/world/timeOfDay.test.ts`, `src/ui/world/worldMapFishEye.test.ts`, `src/game/state.test.ts`, and `src/app/App/App.test.tsx` give the project more regression protection than most prototypes in this space.
- Current quality checks are green. `pnpm test` passed 85 tests across 12 files, and `pnpm build` completed successfully.

## Cons

- High-frequency world interaction still crosses into broad React state. `src/app/App/usePixiWorld.ts` updates `setHoveredMove` and `setTooltip` from pointer movement, and `src/app/App/App.tsx` stores both values in top-level component state. That makes pointer hover and tooltip churn participate in React rerender work even though Pixi is already handling the visual world loop.
- `App` remains a large coordination point with expensive derived work keyed off the whole `game` object. In `src/app/App/App.tsx`, selectors such as `getVisibleTiles(game)`, `getCurrentTile(game)`, `getTownStock(game)`, `getEnemiesAt(...)`, and log filtering are all recomputed from root state transitions, which will become more noticeable as the world state and UI surface area grow.
- Static Pixi layers are separated, but they are still invalidated more often than ideal. In `src/ui/world/renderScene.ts`, `shouldRenderStatic` depends on `scene.staticState !== state`, `scene.staticVisibleTiles !== visibleTiles`, and `scene.staticWorldTimeMinutes !== worldTimeMinutes`, so any game-state identity change or minute tick can rebuild terrain, fog, ground cover, and static markers.
- Tooltip following uses a continuous DOM animation loop. `src/ui/components/GameTooltip/GameTooltip.tsx` starts a `requestAnimationFrame` loop whenever `followCursor` is enabled, which is simple and smooth but keeps DOM position sync work running every frame while the tooltip is visible.
- Persistence still does expensive work on too many UI and gameplay changes. `src/app/App/useAppPersistence.ts` serializes the entire persisted snapshot whenever `game`, `windows`, `windowShown`, or `logFilters` change, then encrypts and writes it after debounce. Duplicate writes are avoided, but the repeated full snapshot serialization cost still sits on a hot path.
- Browser-side save protection is only obfuscation. `src/persistence/storage.ts` derives the AES key from a hardcoded client-side passphrase, so anyone with the shipped code can derive the same key.
- Pixi startup defaults are still aggressive for weaker or high-DPI devices. `src/app/App/usePixiWorld.ts` enables `antialias: true` and uses full `window.devicePixelRatio`, which can raise fill-rate cost sharply on laptops, tablets, and mobile screens.
- Some lazy-loading intent is not turning into real chunk isolation. `pnpm build` reports that modules such as `src/game/state.ts`, `src/ui/tooltips.ts`, and `src/ui/world/timeOfDay.ts` are both statically and dynamically imported, so those dynamic imports do not actually move code off the initial path.
- The production bundle is still sizable for a small game shell. The current build output includes roughly `434.81 kB` for `pixi`, `143.57 kB` for `react-vendor`, and `99.37 kB` for the main app chunk before gzip, so initial load discipline still matters.

## Improvements

### High Priority

- Move hover-selection and follow-cursor tooltip behavior off the broad React path.
  Keep world hover state in refs or a narrower store consumed by Pixi and only commit React state for semantic UI changes that genuinely need React rendering.

- Tighten static-layer invalidation in the world renderer.
  Keep terrain, fog, and stable markers on truly static layers keyed to map-content changes, and avoid rebuilding them for minute-based lighting changes unless the specific layer output actually changes.

- Reduce persistence work to meaningful dirty categories.
  Separate gameplay saves from transient UI changes, skip full snapshot serialization when only non-persisted gameplay data changed, and consider hashing or targeted dirty flags instead of rebuilding the whole payload every time.

- Fix the lazy-loading paths that currently do not split.
  Either remove ineffective dynamic imports or restructure shared world modules so deferred imports actually reduce the initial bundle.

### Medium Priority

- Add a device-aware Pixi quality budget.
  Cap renderer resolution, make antialiasing conditional, and validate world performance on high-DPI and lower-power devices instead of assuming full-quality defaults.

- Break more root-level derivation out of `App`.
  Move expensive selectors and interaction-specific state into focused hooks so frequent gameplay and hover updates do not force one large coordinator to recompute unrelated values.

- Add targeted performance verification for the hot paths.
  Cover autosave dedupe behavior, static-layer invalidation behavior, and hover/tooltip update frequency with focused tests or profiling notes so regressions are easier to catch.

### Low Priority

- Clarify persistence wording across docs.
  Describe the current save mechanism as local obfuscation rather than security unless the trust model changes.

- Add lightweight contributor guidance for browser performance.
  Document expected FPS targets, acceptable bundle growth, and how to inspect React rerenders versus Pixi redraw cost during changes.

- Make coverage reporting explicitly part of the workflow or trim the dependency.
  `@vitest/coverage-v8` is installed and a `test:coverage` script exists, so either surface that in contributor guidance and CI expectations or keep the toolchain leaner.
