# 2026-05-11 Performance Audit Brief

## Scope

- Repo: `realmfall`
- Audit focus: production bundle shape, Pixi world render invalidation, shared UI import boundaries, and opt-in diagnostics on the client path
- Evidence gathered from source review plus a fresh `pnpm --filter @realmfall/client-web build`

## Current Build Snapshot

- `assets/js/pixi-DXyMWTIn.js`: `514.32 kB`
- `assets/js/state-BTb75btc.js`: `391.46 kB`
- `assets/js/gameplayIconAssets-CzJkRgpN.js`: `170.11 kB`
- `assets/js/App-BHxRAorD.js`: `112.96 kB`
- `assets/js/src-B90VH21a.js`: `65.83 kB`
- `assets/js/renderScene-DUF92y9R.js`: `40.41 kB`
- `assets/js/performanceHarness-DPeeMHph.js`: `2.95 kB`

## Findings

1. `packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts` reuses the previous visible-tile array when item payload changes but item count does not. That keeps stale tile objects alive and can suppress the render invalidation that should follow a resolved tile update.

2. `packages/client/src/ui/world/renderSceneTokens.ts` only refreshes cached `visibleTileRenderInputs` when `visibleTiles` or `state.enemies` change by reference. The helper behind those inputs also depends on `bloodMoonActive`, so moon-state transitions can reuse stale unresolved-enemy render data.

3. `packages/client/src/app/App/App.tsx`, `packages/client/src/app/App/components/AppShell.tsx`, and `packages/client/src/ui/world/renderScene.ts` import `performanceHarness` eagerly even though `packages/client/src/main.tsx` already treats the harness as opt-in. The current boundary is therefore not actually zero-cost on the normal path.

4. Eager client files import simple primitives and tooltip helpers from the root `@realmfall/ui-react` barrel. The current bundle shows that this pulls in the large shared `src-B90VH21a.js` chunk and even `generatedIconAssets` through the barrel, which is unnecessary for the initial App path.

5. Deferred windows and world tooltip code continue to use the same root barrel, so the shared UI chunk fan-in remains wider than it needs to be even after the eager-path migration.

## Non-Goal For This Pass

- The `state` chunk is large, but the audit did not find a single low-risk split that can shrink it without a broader gameplay-loading redesign. Keep that as a later architecture project rather than mixing it into the targeted fixes below.
