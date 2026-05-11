# Performance Audit Remediation Plan

## Execution Order

| Order | Priority | Fix                                   | Goal                                                                                                                                | Primary verification                               |
| ----- | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1     | `P1`     | Hover-analysis active-backend sync    | Stop rebuilding and cloning the same nearby hover snapshot into both the worker path and the local fallback on every hover refresh. | Focused hover-analysis tests plus client typecheck |
| 2     | `P1`     | Shared UI generated-icon export split | Keep the shared UI root barrel free of generated-icon asset imports so startup-adjacent consumers do not pull that graph eagerly.   | Client build plus manifest inspection              |
| 3     | `P2`     | Bootstrap-shell config split          | Keep the bootstrap spinner config on a tiny entry-safe module instead of the window-registry module.                                | Client build plus preload inspection               |
| 4     | `P3`     | Canonical item-icon helper path       | Remove duplicated item-icon fallback logic between `packages/client-web` and `packages/ui-react`.                                   | Focused icon helper tests plus client typecheck    |

## Re-verified Candidate

| Candidate           | Current status            | Result                                                                                                                                         |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Pixi typecheck gate | Rechecked on May 11, 2026 | `pnpm typecheck` passes at the repo root and in `packages/client-web`, so no implementation fix is queued unless the failure reproduces again. |

## Fix 1: Hover-Analysis Active-Backend Sync

### Current problem

- `packages/client-web/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
  rebuilds a nearby tiles-and-enemies snapshot for every hover-analysis sync.
- `packages/client-web/src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.ts`
  sends that snapshot into both the local source and the worker-backed source
  even when the worker path is healthy.
- `packages/client-web/src/app/App/world/pixiWorldHoverInteractions.ts` refreshes
  the hover-analysis source eagerly on hover reset and world refresh, so the
  double sync sits on a user-facing path.

### Owned scope

- `packages/client-web/src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.ts`
- `packages/client-web/src/app/App/world/hoverAnalysis/createLocalWorldHoverAnalysisSource.ts`
- `packages/client-web/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
- `packages/client-web/src/app/App/world/pixiWorldHoverInteractions.ts`
- Any focused hover-analysis tests that cover worker fallback behavior

### Planned change

1. Keep the most recent hover-analysis state in the worker source wrapper
   instead of pushing it into both backends every time.
2. Sync only the active backend during normal operation:
   worker when the worker API is healthy, local only when the environment or a
   runtime error forces fallback.
3. On fallback transition, replay the most recent cached hover-analysis state
   into the local source once so local analysis can continue without a stale
   world snapshot.
4. Preserve the current nearby-world payload shape for this pass so the fix
   stays focused on removing duplicated sync work rather than changing the
   analysis model and fallback contract in the same commit.

### Non-regression constraints

- Do not break local fallback when `Worker` is unavailable or the worker throws.
- Do not let hover analysis read a stale state after worker failure.
- Do not change hover result semantics, cache keys, or tooltip behavior in this
  commit.

### Verification

- Add or extend a focused test covering worker failure and fallback replay of
  the latest synced state.
- Keep any hover-analysis unit coverage green for worker and local sources.
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/app/App/world/hoverAnalysis`
- `pnpm --filter @realmfall/client-web typecheck`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/input-and-tooltip-handling/spec.md`
- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/40-pixi-performance.md` if the worker/local-backend expectation
  needs to be called out in the recurring performance guidance

### Commit boundary

- One commit for hover-analysis sync behavior only. Do not mix bundle-boundary
  or icon-helper changes into this commit.

## Fix 2: Shared UI Generated-Icon Export Split

### Current problem

- `packages/ui-react/src/index.ts` re-exports generated-icon asset helpers from the
  shared root barrel.
- Any client code that imports unrelated shared UI helpers from
  `@realmfall/ui-react` causes the barrel module to traverse that generated-icon
  export edge during module linking.
- `packages/client-web/src/ui/generatedIconAssets.ts` currently reaches those asset
  exports through the root barrel, which defeats a clean startup boundary.

### Owned scope

- `packages/ui-react/src/index.ts`
- `packages/ui-react/package.json`
- `packages/client-web/src/ui/generatedIconAssets.ts`
- Any tests that assert the shared UI export surface or generated-icon behavior

### Planned change

1. Add a dedicated package subpath for generated-icon asset helpers in
   `packages/ui-react/package.json`.
2. Move client generated-icon imports to that narrow subpath instead of the
   shared root barrel.
3. Remove generated-icon asset re-exports from `packages/ui-react/src/index.ts` so
   fixed-window, tooltip, and bootstrap-adjacent imports of
   `@realmfall/ui-react` no longer pull the generated-icon asset module by
   default.
4. Keep generated-icon pool id helpers on their existing narrow subpath and do
   not widen the public API beyond what the client already needs.

### Non-regression constraints

- Do not break any runtime generated-icon resolution paths.
- Do not remove the shared generated-icon API that the client already depends
  on; move it behind a narrower import path.
- Do not reintroduce generated-icon asset exports through another umbrella
  module in the same commit.

### Verification

- Keep generated-icon tests green.
- `pnpm --filter @realmfall/ui-react test`
- `pnpm --filter @realmfall/client-web test:node -- packages/client-web/src/ui/generatedIconAssets.test.ts`
- `pnpm --filter @realmfall/client-web build`
- Inspect `packages/client-web/dist/.vite/manifest.json` and confirm the shared UI
  root path no longer drags the generated-icon asset module into startup-adjacent
  chunks.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/rules/50-build-and-bundle.md`

### Commit boundary

- One commit for the shared UI generated-icon export split only. Do not combine
  it with bootstrap-shell config changes.

## Fix 3: Bootstrap-Shell Config Split

### Current problem

- `packages/client-web/src/main.tsx` imports `CLIENT_BOOTSTRAP_SHELL` from
  `packages/client-web/src/client.config.ts`.
- `client.config.ts` also imports the window-registry icon set and other
  app-side constants, which widens the entry graph for a bootstrap spinner that
  only needs a few numeric values.

### Owned scope

- `packages/client-web/src/main.tsx`
- `packages/client-web/src/client.config.ts`
- Any new tiny config module created for bootstrap-only constants
- Bootstrap tests or manifest checks if they need adjustment

### Planned change

1. Extract `CLIENT_BOOTSTRAP_SHELL` into a small bootstrap-only config module
   with no icon imports.
2. Update `main.tsx` to consume that bootstrap-only module.
3. Leave the window registry and app-side config in `client.config.ts`.
4. Recheck the built preload set after the split so the entry path reflects the
   narrower module graph.

### Non-regression constraints

- Do not change bootstrap visuals, timings, or error-screen behavior.
- Do not move unrelated client constants just to chase cleanup.
- Do not reintroduce a transitive import from the bootstrap-only module back
  into `client.config.ts`.

### Verification

- `pnpm --filter @realmfall/client-web build`
- Inspect `packages/client-web/dist/index.html` and
  `packages/client-web/dist/.vite/manifest.json` for the bootstrap preload graph.
- Keep any existing bootstrap tests green.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/specs/reference/technical-solutions/browser-entry-metadata/spec.md`
- `docs/rules/50-build-and-bundle.md`

### Commit boundary

- One commit for the bootstrap-shell config split only. Do not combine it with
  the shared UI barrel split.

## Fix 4: Canonical Item-Icon Helper Path

### Current problem

- `packages/client-web/src/ui/icons.ts` duplicates item-slot fallback, category
  fallback, recipe-page handling, and tint helpers that already exist in
  similar form in `packages/ui-react/src/icons.ts`.
- The duplication keeps two item-icon decision paths aligned by convention
  instead of by one shared implementation surface.

### Owned scope

- `packages/ui-react/src/icons.ts`
- `packages/ui-react/src/index.ts` or a dedicated export subpath if needed
- `packages/client-web/src/ui/icons.ts`
- Any tests covering shared item-icon helper behavior in either package

### Planned change

1. Decide on one shared helper surface for item-icon fallback, border color,
   and tint behavior in `packages/ui-react`.
2. Export that helper through a narrow, intentional path.
3. Refactor `packages/client-web/src/ui/icons.ts` to keep client-only enemy,
   structure, and skill icon concerns local while delegating item-icon fallback
   logic to the shared helper.
4. Remove duplicated constants and fallback branches that become redundant after
   the shared helper takes ownership.

### Non-regression constraints

- Do not change rendered item icons, borders, or tint behavior for existing
  items.
- Do not move client-only enemy or structure icon concerns into the shared UI
  package.
- Keep the resulting API narrow enough that future startup paths can avoid the
  full client icon table when they only need item-icon behavior.

### Verification

- Update or add focused tests for shared item-icon helper behavior.
- Keep client tooltip, item-slot, and recipe-book tests green where they depend
  on icon resolution.
- `pnpm --filter @realmfall/ui-react test`
- `pnpm --filter @realmfall/client-web test:jsdom -- packages/client-web/src/ui/uiTooltipItemContent.test.tsx packages/client-web/src/ui/uiRecipeBook.test.tsx packages/client-web/src/ui/uiWindowStaticMarkup.test.tsx`
- `pnpm --filter @realmfall/client-web typecheck`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/ui-component-library/spec.md`

### Commit boundary

- One commit for the canonical item-icon helper path only. Do not mix it with
  generated-icon barrel or bootstrap-shell work.
