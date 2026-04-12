# Project Review

## Pros

- Tooling and delivery basics are in good shape. The project uses strict TypeScript, ESLint, Prettier, Vitest, Husky, and a working GitHub Actions workflow that runs typecheck, lint, test, and build.
- The codebase mostly respects the intended architectural split. Gameplay rules live in `src/game`, app orchestration lives in `src/app`, presentational windows live in `src/ui/components`, and Pixi rendering is isolated in `src/ui/world`.
- Save compatibility has a solid baseline. `src/app/normalize.ts` normalizes older save shapes before hydration instead of assuming a fresh save format.
- The UI layer already uses several good React containment patterns. Many window components are wrapped in `memo`, and window contents are lazy-loaded so secondary UI does not all land on the initial path.
- Pixi rendering already has some important performance-aware structure. `src/ui/world/renderSceneCache.ts` and `src/ui/world/renderScenePools.ts` reuse containers, graphics, sprites, and text instead of recreating display objects every frame.
- Rendering math and visual helpers have dedicated tests. `src/ui/world/renderScene.test.ts`, `src/ui/world/timeOfDay.test.ts`, and `src/ui/world/worldMapFishEye.test.ts` give the rendering path more protection than most browser-game prototypes have.
- The project currently builds and tests cleanly, which reduces the risk that the review is describing an architecture that only works in development.

## Cons

- React work is still too tightly coupled to map pointer movement. In `src/app/App/usePixiWorld.ts:159-226`, every pointer move can call `setHoveredMove` and `setTooltip`, which pushes high-frequency map interaction back through React state and can trigger avoidable rerenders while the Pixi canvas is already repainting every frame.
- The Pixi scene is fully redrawn on every ticker frame even when most layers are static. `src/ui/world/renderScene.ts:50-52` resets the pools, then `:79-232` rebuilds visible tiles, markers, clouds, overlays, and effects every tick. That is simple and correct, but it will become expensive as world detail grows.
- The rendering path currently does duplicate work around updates. `src/app/App/usePixiWorld.ts:94-108` renders from the Pixi ticker, and `:263-274` also calls `renderScene` again from a React effect whenever `game`, `selected`, `hoveredMove`, or `visibleTiles` change.
- The world renderer still does avoidable per-frame deterministic recomputation. `src/ui/world/renderSceneEnvironment.ts:61` creates a new RNG for every cloud on every frame, and `:141` does the same for tile background selection. Those values are stable enough to cache per tile or per scene.
- Browser persistence is more expensive than it needs to be. `src/app/App/useAppPersistence.ts:126-149` serializes and encrypts the whole save on every relevant state change and also repeats the same work every 5 seconds. That means gameplay actions can trigger full JSON serialization, AES work, and `localStorage` writes far more often than necessary.
- The save protection is still only obfuscation. `src/persistence/storage.ts:2-59` derives the AES key from a hardcoded client-side passphrase, so it should not be treated as real security.
- Pixi initialization favors visual quality over frame budget on weaker devices. `src/app/App/usePixiWorld.ts:74-80` enables antialiasing and uses full `window.devicePixelRatio`, which can multiply fill-rate cost on high-DPI mobile or laptop displays.
- The production bundle is still heavier than it should be for the current app shape. `pnpm build` produces a `vendors` chunk at about 619 kB minified, and the current Vite config groups all `node_modules` code into one manual vendor chunk instead of splitting heavier dependencies more intentionally.
- Lint is not fully clean. `src/ui/components/windowLabels.tsx:73` still triggers the React Fast Refresh warning because the file exports non-component helpers alongside JSX.

## Improvements

### High Priority

- Add a device-aware Pixi quality budget.
  Cap renderer resolution, consider making antialiasing optional, and profile the world view on high-DPI screens so visual defaults do not quietly consume too much frame time.

### Medium Priority

- Clarify persistence language everywhere.
  Keep documenting browser-side save handling as local obfuscation rather than encryption, unless persistence moves to a server-backed or signed model.

- Fix the Fast Refresh lint warning.
  Move shared window-label constants or helpers into a non-component module so component files only export component concerns.

### Low Priority

- Add lightweight performance budgets to contributor docs.
  A short note covering expected FPS targets, acceptable bundle growth, and how to evaluate React rerenders versus Pixi redraw cost would help keep future changes disciplined.

- Consider exposing coverage reporting in scripts or CI output.
  The project already depends on `@vitest/coverage-v8`; either use it explicitly or remove the unused dependency to keep the toolchain intentional.
