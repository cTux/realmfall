# Browser, React, And Pixi Performance Remediation Plan

## Execution Order

| Order | Priority | Fix                                       | Goal                                                                                                                                       | Primary verification                                              |
| ----- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1     | `P1`     | Startup bootstrap overlap                 | Remove eager translation blockers where needed and overlap `App` module loading with locale and font readiness.                            | Focused bootstrap tests plus client build and manifest inspection |
| 2     | `P1`     | Visible-only Pixi icon preload            | Keep world bootstrap blocked only on first-frame visible icon textures and push reachable or catalog warmup behind first paint.            | Focused Pixi bootstrap tests plus client build                    |
| 3     | `P1`     | Lower animated world redraw cadence       | Stop stable animated-world layers from rerendering at the full ticker FPS when only idle cloud, atmosphere, or marker animation is active. | Focused render-loop tests                                         |
| 4     | `P1`     | Tile-resolution sync dependency narrowing | Stop unrelated immutable `GameState` clones from retriggering visible-frontier coordinator sync.                                           | Focused tile-resolution tests plus client typecheck               |

## Fix 1: Startup Bootstrap Overlap

### Current problem

- `packages/client-web/src/main.tsx` waits for both `loadI18n(...)` and
  `loadInterfaceFontFamily(...)` to finish before calling `import('./app/App')`.
- `packages/client-web/src/i18n/bootstrap.ts` fetches and parses the full locale
  JSON before startup can proceed.
- At least one eager translation cache in the `App` import graph,
  `packages/client-web/src/ui/windowLabels.ts`, materializes `t(...)` output at
  module load, which makes earlier `App` import unsafe until those eager
  translation sites are removed or narrowed.

### Owned scope

- `packages/client-web/src/main.tsx`
- `packages/client-web/src/i18n/bootstrap.ts`
- `packages/client-web/src/ui/windowLabels.ts`
- Any additional eager-translation helper modules in the `App` import graph
- `packages/client-web/src/main.test.tsx`
- Any focused tests needed for eager translation helpers

### Planned change

1. Audit the `App` bootstrap graph for top-level translation materialization
   that would lock in raw keys if `App` starts importing before i18n finishes.
2. Convert those eager translation caches to lazy accessors or per-render label
   helpers so `App` import no longer requires translations to be populated at
   module-evaluation time.
3. Start the `import('./app/App')` work as soon as bootstrap begins and await
   it alongside locale and font readiness instead of serializing it after the
   locale fetch completes.
4. Keep the first real `App` render gated on locale and font readiness so the
   user never sees key-shaped fallback text on the live shell.
5. Re-check the built manifest to confirm the bootstrap path does not add new
   eager dependencies while the `App` module work overlaps the locale path.

### Non-regression constraints

- Do not render the live app shell with untranslated key strings.
- Do not widen the bootstrap JS graph by moving the full locale payload into the
  eager entry.
- Do not reintroduce the broad UI-root i18n import path that was removed in the
  earlier startup split.

### Verification

- Extend `packages/client-web/src/main.test.tsx` to prove `App` import work starts
  before the locale promise resolves while the live render stays gated.
- Keep `packages/client-web/src/game/content/i18nBootstrapOrder.test.ts` green.
- Add or update a focused test for any refactored eager translation helper such
  as `windowLabels`.
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/game/content/i18nBootstrapOrder.test.ts`
- `pnpm --filter @realmfall/client-web test:jsdom -- packages/client-web/src/main.test.tsx`
- `pnpm --filter @realmfall/client-web build`
- Inspect `packages/client-web/dist/.vite/manifest.json` plus
  `packages/client-web/dist/index.html` and confirm the bootstrap path overlaps the
  deferred `App` graph instead of waiting on locale completion first.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/internationalization/spec.md`
- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/specs/reference/technical-solutions/browser-entry-metadata/spec.md`
- `docs/rules/50-build-and-bundle.md`

### Commit boundary

- One commit for startup bootstrap overlap only. Do not mix Pixi or
  tile-resolution changes into this commit.

## Fix 2: Visible-Only Pixi Icon Preload

### Current problem

- `packages/client-web/src/app/App/world/pixiWorldBootstrap.ts` currently blocks on
  `ensureWorldIconTexturesLoaded(...)` for the union of visible-tile icons and
  reachable-ring icons before the Pixi app is initialized.
- Many of those icons are SVG-backed and go through image decode plus
  rasterization work in `packages/client-web/src/ui/world/worldIcons.ts`, so the
  bootstrap path does more main-thread work than the first visible frame needs.
- The runtime already supports placeholder textures and background warmup, but
  the initial bootstrap path is wider than the current Pixi spec describes.

### Owned scope

- `packages/client-web/src/app/App/world/pixiWorldBootstrap.ts`
- `packages/client-web/src/ui/world/worldIcons.ts`
- `packages/client-web/src/app/App/world/pixiWorldRenderLoop.ts` if reachable warmup
  timing needs to shift after first paint
- Focused Pixi bootstrap or icon-loading tests

### Planned change

1. Reduce the blocking preload set to visible-world icon asset ids for the
   first frame only.
2. Move reachable-ring warmup fully behind first paint, using the existing
   background warmup path instead of the blocking bootstrap await.
3. Preserve the global background catalog warmup that runs after Pixi bootstrap,
   but avoid duplicating the same blocking reachable preload first.
4. Keep placeholder-texture fallback behavior intact for icons that are first
   requested after initial canvas mount.

### Non-regression constraints

- Do not allow missing visible-frame icons on the first painted world scene.
- Do not remove the background warmup path for later icon discovery.
- Do not regress canvas-error handling or the existing retry path.

### Verification

- Add or extend a focused bootstrap test to prove reachable-ring icon ids are
  no longer part of the blocking preload set.
- Keep or update `packages/client-web/src/ui/world/worldIcons.test.ts` coverage for
  placeholder and background warmup behavior.
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/ui/world/worldIcons.test.ts packages/client-web/src/app/App/world/pixiWorldRenderLoop.test.ts`
- `pnpm --filter @realmfall/client-web build`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/40-pixi-performance.md`

### Commit boundary

- One commit for visible-only Pixi icon preload only. Do not combine it with
  animated-cadence or startup bootstrap changes.

## Fix 3: Lower Animated World Redraw Cadence

### Current problem

- `packages/client-web/src/ui/world/renderCadence.ts` sets
  `ANIMATED_LAYER_FPS = DEFAULT_WORLD_RENDER_FPS`.
- `packages/client-web/src/app/App/world/pixiWorldRenderLoop.ts` stores
  `animationBucket` from the selected world render FPS, so the snapshot changes
  every frame even when only idle animated layers are active.
- `packages/client-web/src/ui/world/renderSceneShared.ts` and
  `packages/client-web/src/ui/world/renderSceneFrameState.ts` already support a
  separate animated render token, but the live frame loop feeds them a per-frame
  cadence.

### Owned scope

- `packages/client-web/src/ui/world/renderCadence.ts`
- `packages/client-web/src/app/App/world/pixiWorldRenderLoop.ts`
- `packages/client-web/src/app/App/world/worldRenderSnapshot.ts`
- Any adjacent render-token helpers needed to keep naming and semantics clear
- `packages/client-web/src/app/App/world/pixiWorldRenderLoop.test.ts`

### Planned change

1. Introduce a lower animated-world cadence constant separate from the selected
   Pixi ticker FPS.
2. Compute the render-loop animation bucket from that lower animated cadence
   instead of the full ticker cadence, while keeping movement-transition and
   movement-cooldown tokens on their existing higher-frequency invalidation path.
3. Pass the lower-cadence animated time into `renderScene(...)` so cloud,
   atmosphere, marker-bob, and combat-feedback animations stop forcing
   full-speed redraws when the world is otherwise static.
4. Keep the current invalidation checks for hover, queued paths, icon texture
   loads, terrain toggles, cloud settings, and movement transitions.

### Non-regression constraints

- Do not degrade active movement transitions or cooldown arcs.
- Do not stall combat intro feedback, floating text, or icon-arrival redraws.
- Do not couple the lower animated cadence to the persisted `worldRenderFps`
  setting if that would restore per-frame invalidation.

### Verification

- Extend `packages/client-web/src/app/App/world/pixiWorldRenderLoop.test.ts` with a
  case proving stable scenes stop rerendering on every ticker frame when only
  the idle animation bucket is involved.
- Keep existing render-loop tests for cloud settings, terrain toggles, icon
  texture versioning, adjacent-move suppression, and transition expiry green.
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/app/App/world/pixiWorldRenderLoop.test.ts`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/40-pixi-performance.md`

### Commit boundary

- One commit for animated world redraw cadence only. Do not mix it with visible
  icon preload changes.

## Fix 4: Tile-Resolution Sync Dependency Narrowing

### Current problem

- `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.ts`
  runs coordinator sync from an effect that depends on the whole `game` object
  and then redundantly also lists the world-facing fields it actually reads.
- Immutable `setGame(...)` clones that do not change the visible frontier can
  still retrigger `syncTileResolutionCoordinator(...)`.
- The helper already only needs `bloodMoonActive`, `player`, `radius`, `seed`,
  and `tiles`, so the effect dependency list is broader than the synchronized
  payload.

### Owned scope

- `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.ts`
- `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.test.ts`
- Any small helper extraction needed to keep the visible-frontier sync payload
  explicit

### Planned change

1. Remove the broad `game` dependency from the coordinator-sync effect.
2. Drive the effect from the exact world-facing inputs that
   `syncTileResolutionCoordinator(...)` consumes.
3. If needed, extract a small visible-frontier sync payload so the effect body
   can stop closing over the full game object while staying lint-clean.
4. Preserve the separate visible-tile rebuild effect and the coordinator
   bootstrap path unchanged.

### Non-regression constraints

- Do not skip sync when `bloodMoonActive`, `player.coord`, `radius`, `seed`, or
  `tiles` actually change.
- Do not trigger a second visible-tile rebuild just to narrow the effect
  dependency list.
- Do not widen the coordinator sync contract again through a helper that accepts
  full `GameState`.

### Verification

- Extend `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.test.ts`
  with coverage that the helper payload stays narrowed to the visible-frontier
  inputs.
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.test.ts`
- `pnpm --filter @realmfall/client-web typecheck`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md`
- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`

### Commit boundary

- One commit for tile-resolution sync dependency narrowing only.

## Delegation Rules For This Workspace

- The main thread owns planning, code review, verification, docs, and git
  decisions.
- Only the implementation work for the four fixes is delegated.
- Each worker handoff must include the owned files, preserved behaviors, target
  tests, and an escalation path to return `NEEDS_CONTEXT` instead of guessing
  across broader shared behavior.
- Each fix lands in its own commit after main-thread review, doc updates, and
  verification.
