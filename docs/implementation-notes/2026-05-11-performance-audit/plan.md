# Client Performance Audit Implementation Plan

> **For agentic workers:** delegate implementation one task at a time with a tight handoff. Do not plan, document, or commit in the worker. Main thread owns review, docs, verification, and commits.

**Goal:** fix the incorrect world-render reuse paths and remove avoidable client bundle fan-in from opt-in diagnostics and the shared UI root barrel.

**Architecture:** treat world invalidation and bundle shape as separate concerns. First fix correctness in the visible-tile and render-token caches so render reuse remains safe. Then reduce eager client imports by introducing narrow UI subpath exports and a tiny runtime-safe performance bridge that preserves the current opt-in harness behavior without pulling the full harness into normal runtime chunks.

**Tech Stack:** TypeScript, React 19, Vite 8, Vitest 4, Pixi.js 8, pnpm workspaces

---

### Task 1: Fix visible-tile reuse when tile item payload changes

**Files:**

- Modify: `packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts`
- Modify: `packages/client/src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts`

- [ ] **Step 1: Add a failing regression test for same-length item changes**

Add a test that keeps the same tile coord, terrain, structure, and item count, but swaps either the item id or quantity so the selector must return `nextVisibleTiles` instead of reusing `previousVisibleTiles`.

- [ ] **Step 2: Add a failing regression test for changed item quantity with stable array length**

Keep the tile item array length at `1`, change only the quantity, and assert that the selector returns the new array.

- [ ] **Step 3: Expand the visible-tile reuse key to cover item payload**

Update `getVisibleWorldTileRenderKey` so it includes a stable item payload segment instead of only `tile.items.length`.

Implementation direction:

```ts
const itemKey = tile.items
  .map((item) => [item.id, item.itemKey ?? item.name, item.quantity].join(':'))
  .join(',');
```

Then include `itemKey` in the returned array before `.join('|')`.

- [ ] **Step 4: Run the narrow regression suite**

Run:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project node src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts
```

Expected: the new regression cases pass and the existing reuse tests stay green.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/app/App/selectors/reuseVisibleTilesIfUnchanged.ts packages/client/src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts
git commit -m "fix: invalidate reused visible tiles on item changes"
```

### Task 2: Refresh cached world render inputs when blood-moon state changes

**Files:**

- Modify: `packages/client/src/ui/world/renderSceneTokens.ts`
- Modify: `packages/client/src/ui/world/renderSceneReuse.test.ts` or `packages/client/src/ui/world/renderSceneCacheInvalidation.test.ts`

- [ ] **Step 1: Add a failing regression test for unresolved-enemy render inputs across a blood-moon toggle**

Build one scene cache, reuse the same `visibleTiles` reference, toggle `bloodMoonActive`, and assert that the recalculated visible-tile render inputs change instead of reusing the previous cached inputs.

- [ ] **Step 2: Extend the render-input cache invalidation condition**

Update `renderInputsChanged` so it also invalidates when `scene.derivedRenderBloodMoonActive !== state.bloodMoonActive`.

Implementation shape:

```ts
const renderInputsChanged =
  scene.derivedRenderVisibleTilesSource !== visibleTiles ||
  scene.derivedRenderEnemiesSource !== state.enemies ||
  scene.derivedRenderVisibleTileInputs === null ||
  scene.derivedRenderBloodMoonActive !== state.bloodMoonActive;
```

- [ ] **Step 3: Keep the existing derived token flow intact**

Do not change the token algorithm beyond the invalidation boundary. The point is to recompute `visibleTileRenderInputs` when the moon-state dependency changes, not to redesign the token format.

- [ ] **Step 4: Run the focused renderer test file**

Run:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project node src/ui/world/renderSceneReuse.test.ts
```

If the new case lands in a different file, run that specific file instead.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/ui/world/renderSceneTokens.ts packages/client/src/ui/world/renderSceneReuse.test.ts
git commit -m "fix: refresh cached world render inputs on moon-state changes"
```

### Task 3: Keep performance instrumentation fully opt-in on the normal runtime path

**Files:**

- Add: `packages/client/src/performance/performanceBridge.ts`
- Modify: `packages/client/src/main.tsx`
- Modify: `packages/client/src/app/App/App.tsx`
- Modify: `packages/client/src/app/App/components/AppShell.tsx`
- Modify: `packages/client/src/ui/world/renderScene.ts`
- Modify: `packages/client/src/performance/performanceHarness.test.ts`
- Add or modify: a lightweight source-policy test under `packages/client/scripts/` or `scripts/tests/` that prevents eager `performanceHarness` imports outside `main.tsx`

- [ ] **Step 1: Add a tiny bridge that talks directly to `window.__REALMFALL_PERF__`**

The bridge should expose:

```ts
isPerformanceHarnessActive()
recordStartupMark(name: string)
recordReactCommit(...)
recordPixiRenderCounts(counts)
```

Each function must return immediately when the harness is absent.

- [ ] **Step 2: Move eager runtime imports to the bridge**

Update `App.tsx`, `AppShell.tsx`, and `renderScene.ts` to import from `performanceBridge` instead of `performanceHarness`.

- [ ] **Step 3: Keep `main.tsx` as the only place that runtime-loads the real harness**

Do not change the opt-in query-param and local-storage behavior. `main.tsx` should continue to own `import('./performance/performanceHarness')`.

- [ ] **Step 4: Add a guard test for the import boundary**

Add a source-policy test that fails when any eager runtime file outside `main.tsx` imports `performanceHarness` directly.

- [ ] **Step 5: Run the focused verification**

Run:

```bash
pnpm --filter @realmfall/client-web exec vitest run --project node src/performance/performanceHarness.test.ts
pnpm --filter @realmfall/client-web build
```

Expected: tests pass, build passes, and the manifest no longer shows `App` or `renderScene` importing `performanceHarness`.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/performance/performanceBridge.ts packages/client/src/main.tsx packages/client/src/app/App/App.tsx packages/client/src/app/App/components/AppShell.tsx packages/client/src/ui/world/renderScene.ts packages/client/src/performance/performanceHarness.test.ts
git commit -m "refactor: keep performance instrumentation opt-in"
```

### Task 4: Add narrow UI subpath exports and move eager App-path imports off the root barrel

**Files:**

- Modify: `packages/ui/package.json`
- Add as needed: lightweight re-export files under `packages/ui/src/` for the new subpaths
- Modify: `packages/client/src/app/App/components/AppShell.tsx`
- Modify: `packages/client/src/app/App/usePixiWorldHover.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
- Modify: `packages/client/src/app/App/hooks/useItemTooltipController.ts`
- Modify: any other eager App-path file that still uses `@realmfall/ui-react` at runtime
- Modify: `docs/rules/50-build-and-bundle.md`
- Modify: `packages/ui/README.md`
- Add or modify: a source-policy test that blocks root-barrel runtime imports on the eager App path

- [ ] **Step 1: Introduce narrow UI package exports**

Add subpaths for the primitives and helpers actually used on the eager path, for example:

```json
"./button": "./src/components/Button/Button.tsx",
"./loading-spinner": "./src/components/LoadingSpinner/LoadingSpinner.tsx",
"./tooltip": "./src/components/Tooltip/index.ts",
"./tooltip-placement": "./src/tooltipPlacement.ts"
```

Only add the subpaths needed by the current migration.

- [ ] **Step 2: Migrate eager runtime imports**

Examples:

```ts
import { Button } from '@realmfall/ui-react/button';
import { LoadingSpinner } from '@realmfall/ui-react/loading-spinner';
import {
  syncFollowCursorTooltipPosition,
  type TooltipPosition,
} from '@realmfall/ui-react/tooltip';
import { getTooltipPlacementForRect } from '@realmfall/ui-react/tooltip-placement';
```

- [ ] **Step 3: Add a source-policy guard**

Fail the test when eager App-path runtime files import from `@realmfall/ui-react` instead of the narrow subpaths. Allow `import type` only where the runtime stays clean, or migrate those types too if that is simpler.

- [ ] **Step 4: Update docs for the recurring bundle rule**

Document that bootstrap and eager App-path code must prefer narrow `@realmfall/ui-react/*` subpaths over the root barrel to avoid pulling the shared barrel chunk into startup.

- [ ] **Step 5: Run verification**

Run:

```bash
pnpm --filter @realmfall/ui-react typecheck
pnpm --filter @realmfall/client-web typecheck
pnpm --filter @realmfall/client-web exec vitest run --project node scripts/bootstrap-bundle-policy.test.ts
pnpm --filter @realmfall/client-web build
```

Expected: build passes, and `assets/js/App-*.js` no longer imports `src-B90VH21a.js`.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/package.json packages/ui/src packages/client/src/app/App/components/AppShell.tsx packages/client/src/app/App/usePixiWorldHover.ts packages/client/src/app/App/world/pixiWorldHoverInteractions.ts packages/client/src/app/App/hooks/useItemTooltipController.ts docs/rules/50-build-and-bundle.md packages/ui/README.md
git commit -m "refactor: narrow eager ui imports on the app path"
```

### Task 5: Finish the shared UI import migration for deferred windows and world tooltips

**Files:**

- Modify: `packages/client/src/app/App/components/AppFixedWindows.tsx`
- Modify: `packages/client/src/ui/components/WindowShell.tsx`
- Modify: `packages/client/src/ui/components/WindowLoadingState.tsx`
- Modify: `packages/client/src/ui/components/WindowHeaderActionButton.tsx`
- Modify: `packages/client/src/ui/components/InventoryWindow/InventoryWindowContent.tsx`
- Modify: `packages/client/src/ui/components/HexInfoWindow/HexInfoWindowContent.tsx`
- Modify: `packages/client/src/ui/components/EquipmentWindow/EquipmentWindowContent.tsx`
- Modify: `packages/client/src/ui/components/RecipeBookWindow/RecipeBookWindowContent.tsx`
- Modify: `packages/client/src/ui/components/RecipeBookWindow/RecipeBookVirtualRow.tsx`
- Modify: `packages/client/src/ui/components/GameSettingsWindow/*`
- Modify: `packages/client/src/ui/components/EntityStatusPanel/EntityStatusPanel.tsx`
- Modify: `packages/client/src/ui/world/worldTooltips.ts`
- Modify: `packages/ui/package.json` again only if Task 4 did not add every required subpath yet
- Extend: the source-policy test from Task 4

- [ ] **Step 1: Add any missing subpaths for deferred-window primitives**

Likely additions:

```json
"./action-bar": "./src/components/ActionBar/index.ts",
"./context-menu": "./src/components/ContextMenu/index.ts",
"./dock-panel": "./src/components/DockPanel/index.ts",
"./item-slot": "./src/components/ItemSlot/index.ts",
"./window-label": "./src/components/WindowLabel/index.ts",
"./formatters": "./src/formatters.ts",
"./tooltips": "./src/tooltips.ts"
```

- [ ] **Step 2: Migrate deferred window and tooltip files**

Replace root-barrel runtime imports with the new subpaths, keeping behavior identical.

- [ ] **Step 3: Extend the policy test to cover the deferred runtime surface**

Include `packages/client/src/ui/components` and `packages/client/src/ui/world/worldTooltips.ts`, excluding Storybook-only files if needed.

- [ ] **Step 4: Run verification**

Run:

```bash
pnpm --filter @realmfall/client-web typecheck
pnpm --filter @realmfall/client-web exec vitest run --project node scripts/bootstrap-bundle-policy.test.ts
pnpm --filter @realmfall/client-web build
```

Expected: build passes and the shared UI barrel chunk shrinks or disappears from deferred chunks that no longer need it.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/package.json packages/client/src/app/App/components/AppFixedWindows.tsx packages/client/src/ui/components packages/client/src/ui/world/worldTooltips.ts
git commit -m "refactor: narrow deferred ui imports across client windows"
```

## Verification Checklist

- `pnpm --filter @realmfall/client-web exec vitest run --project node src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts`
- `pnpm --filter @realmfall/client-web exec vitest run --project node src/ui/world/renderSceneReuse.test.ts`
- `pnpm --filter @realmfall/client-web exec vitest run --project node src/performance/performanceHarness.test.ts`
- `pnpm --filter @realmfall/client-web typecheck`
- `pnpm --filter @realmfall/ui-react typecheck`
- `pnpm --filter @realmfall/client-web build`

## Commit Order

1. `fix: invalidate reused visible tiles on item changes`
2. `fix: refresh cached world render inputs on moon-state changes`
3. `refactor: keep performance instrumentation opt-in`
4. `refactor: narrow eager ui imports on the app path`
5. `refactor: narrow deferred ui imports across client windows`
