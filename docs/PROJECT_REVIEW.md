# Project Review

## Pros

- The project has a strong engineering baseline. `package.json`, `vite.config.ts`, ESLint, Prettier, Husky, and Vitest provide real quality gates instead of relying on manual discipline. Current verification is healthy: `pnpm test` passed `109` tests across `12` files, and `pnpm build` completed successfully.
- The architecture is mostly well separated. Gameplay and simulation live in `src/game`, React app orchestration lives in `src/app`, and Pixi world rendering is isolated in `src/ui/world`, which keeps the core game logic more testable and easier to reason about.
- Initial-load discipline is better than average for a browser game. `src/main.tsx` lazy-loads the app after locale bootstrapping, `src/app/App/usePixiWorld.ts` lazy-loads Pixi and the world renderer, and `src/app/App/AppWindows.tsx` plus individual window modules defer secondary UI content behind `lazy(...)` boundaries.
- The production bundle is intentionally chunked. `vite.config.ts` splits `pixi`, `react-vendor`, and other vendor code into separate chunks, and the current build output shows that secondary window content is shipping as many small deferred chunks instead of collapsing back into one large initial bundle.
- The Pixi renderer has a solid foundation for performance work. `src/ui/world/renderSceneCache.ts` keeps persistent scene containers and layer separation, while `src/ui/world/renderScenePools.ts` reuses `Graphics`, `Sprite`, `Text`, and shadowed marker instances instead of reallocating display objects every render.
- Deterministic rendering inputs are already cached in useful places. `src/ui/world/renderScene.ts` caches cloud inputs by seed and tile ground-cover presentation by stable keys, which is the right direction for keeping stable presentation work off the hot path.
- The world path mostly follows one clear scheduler. `src/app/App/usePixiWorld.ts` drives `renderScene(...)` from the Pixi ticker instead of layering multiple competing world redraw loops on top of each other.
- Save handling is more disciplined than most local-save browser projects. `src/app/normalize.ts` normalizes older save shapes before hydration, and `src/app/App/useAppPersistence.ts` debounces saves and avoids writing identical serialized snapshots repeatedly.
- Test coverage is meaningful in the places that matter most for this stack. `src/ui/world/renderScene.test.ts`, `src/ui/world/timeOfDay.test.ts`, `src/ui/world/worldMapFishEye.test.ts`, `src/game/state.test.ts`, `src/app/normalize.test.ts`, and `src/app/App/App.test.tsx` provide useful regression protection across gameplay, rendering math, hydration, and app wiring.
- The asset and platform toolchain is thoughtful. `vite-plugin-minipic`, `vite-plugin-pwa`, and duplicated-dependency detection in `vite.config.ts` show good awareness of browser delivery concerns rather than treating the app as a purely local prototype.

## Cons

- The biggest performance issue is in Pixi invalidation. `src/app/App/usePixiWorld.ts` renders from the ticker every frame, and `src/ui/world/renderScene.ts` treats `scene.staticWorldTimeMinutes !== worldTimeMinutes` and `scene.interactionWorldTimeMinutes !== worldTimeMinutes` as redraw triggers. Because world time advances continuously, the supposedly static and interaction layers are effectively rebuilt every frame.
- The renderer still traverses the full visible tile set on the hot path. `src/ui/world/renderScene.ts` loops through all visible tiles and performs geometry, styling, fog, marker, and overlay work inside the frame render, so the static-layer architecture is not delivering as much value as it could until invalidation is tighter.
- Hover handling is too expensive for a pointer-move path. In `src/app/App/usePixiWorld.ts`, each `pointermove` can do hex lookup, `getEnemiesAt(...)`, distance work, safe-path calculation, tooltip selection, and React state updates. That mixes CPU-heavy interaction logic with one of the highest-frequency browser events.
- High-frequency world interaction still propagates through broad React state. `src/app/App/App.tsx` stores `hoveredMove`, `hoveredSafePath`, and tooltip state at the app level, while `src/app/App/usePixiWorld.ts` updates them from pointer movement. That means Pixi-world hover churn can participate in whole-app React rerenders.
- `App` is still a large coordination hub with many root-level derived values. In `src/app/App/App.tsx`, values such as `getVisibleTiles(game)`, `getCurrentTile(game)`, `getTownStock(game)`, `getEnemiesAt(...)`, and filtered logs are recomputed from broad state changes, which increases rerender scope as the game grows.
- Memoization around the window system is only partially effective. Many windows are wrapped in `memo`, but `src/app/App/AppWindows.tsx` still passes fresh inline closures like `onMove={(position) => ...}` and `onClose={() => ...}` on every render, so child memo boundaries do not buy as much containment as they appear to.
- Dragging a window updates top-level state on every pointer move. `src/ui/components/DraggableWindow/DraggableWindow.tsx` calls `onMove(...)` for each drag event, and `src/app/App/useAppControllers.ts` stores that directly in shared `windows` state, which can cause wide React rerender work while a single floating window is being dragged.
- Tooltip following uses a continuous DOM animation loop. `src/ui/components/GameTooltip/GameTooltip.tsx` starts a `requestAnimationFrame` loop whenever `followCursor` is enabled, which keeps DOM writes running every frame while the tooltip is visible even if the pointer has stopped moving.
- Log typing animation scales poorly with log count. `src/ui/components/LogWindow/LogWindowContent.tsx` creates a `setInterval` per rendered log line, which is visually fine at small volumes but can become unnecessarily noisy when many logs are visible at once.
- Pixi startup quality defaults are still aggressive. `src/app/App/usePixiWorld.ts` enables `antialias: true` and uses full `window.devicePixelRatio`, which can raise GPU fill-rate cost sharply on high-DPI displays and weaker devices.
- Some caches have no obvious session bounds. `src/ui/world/renderSceneCache.ts` stores `tileGroundCoverPresentationByKey` and `cloudInputsBySeed` in long-lived `Map`s, and the ground-cover cache in particular has no eviction policy, so extended play sessions can accumulate memory.
- There is still real bundle pressure on the main game path. The latest build outputs roughly `434.81 kB` for `pixi`, `143.58 kB` for `react-vendor`, and `182.53 kB` for the main app chunk before gzip, so initial parse and execution cost still deserve active budget discipline.
- Browser-side save protection is obfuscation, not security. `src/persistence/storage.ts` derives the AES key from a hardcoded client-side passphrase, so anyone with the shipped code can derive the same key.

## Improvements

### High Priority

- Keep pointer-move hot paths out of broad React state.
  In `src/app/App/usePixiWorld.ts` and `src/app/App/App.tsx`, prefer refs or a narrower interaction store for hover selection, safe-path previews, and follow-cursor tooltip positioning so world hover does not rerender the whole app.

- Cut pointer-move computation before it happens.
  Avoid recalculating safe paths, enemy tooltips, and related hover work on every `pointermove` when the hovered hex has not changed. Deduplicate by tile first, then only do the heavier work when the target meaningfully changes.

- Reduce React work during window dragging.
  In `src/ui/components/DraggableWindow/DraggableWindow.tsx`, keep drag motion local until the next animation frame or until drag end, instead of committing shared app state on every raw pointer event.

- Add a device-aware Pixi quality budget.
  In `src/app/App/usePixiWorld.ts`, cap renderer resolution, make antialiasing conditional, and validate acceptable defaults for high-DPI laptops, integrated GPUs, and mobile-class devices instead of assuming full-quality settings are safe everywhere.

### Medium Priority

- Break more root-level derivation out of `App`.
  Move expensive selectors and interaction-specific state from `src/app/App/App.tsx` into focused hooks or narrower component boundaries so gameplay, world hover, logs, and windows do not all recompute together.

- Make the existing window memoization actually pay off.
  Replace the repeated inline `onMove` and `onClose` closures in `src/app/App/AppWindows.tsx` with stabler props or narrower wrappers so `memo(...)` on the window components reduces rerenders in practice.

- Replace always-on tooltip RAF syncing with event-driven updates.
  `src/ui/components/GameTooltip/GameTooltip.tsx` should follow cursor motion only when the cursor position changes, rather than running a perpetual `requestAnimationFrame` loop while visible.

- Rework log-line animation so it scales with longer sessions.
  `src/ui/components/LogWindow/LogWindowContent.tsx` should avoid a timer per row. A shared animation clock, CSS-driven reveal, or only animating the newest entries would keep the effect without multiplying timers.

- Bound or prune long-lived render caches.
  Add a clear invalidation strategy or size limit for caches such as `tileGroundCoverPresentationByKey` in `src/ui/world/renderSceneCache.ts` so long exploration sessions do not grow memory without limit.

- Add tests or profiling checks for the real hot paths.
  Extend coverage so the suite catches the current live-render invalidation problem, hover-frequency regressions, and drag/tooltip update churn instead of only validating correctness in lower-frequency scenarios.

- Keep bundle growth under an explicit budget.
  The current split is healthy, but the main startup path is still substantial. Adding chunk-size guardrails or a lightweight documented budget would help prevent regressions from quietly accumulating.

### Low Priority

- Tighten wording around local save protection in docs.
  Describe `src/persistence/storage.ts` as local obfuscation rather than meaningful client-side secrecy unless the trust model changes.

- Document browser-performance expectations for contributors.
  Add lightweight guidance for how to inspect React rerenders, Pixi redraw cost, bundle impact, and target behavior on high-DPI or weaker hardware so future changes are easier to evaluate consistently.

- Consider whether every current visual effect belongs on the default path.
  Atmosphere layers, cloud density, and shadowed marker presentation are visually strong, but they should keep being weighed against real frame-time budgets as the world renderer evolves.
