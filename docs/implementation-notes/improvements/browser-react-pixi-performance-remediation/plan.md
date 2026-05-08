# Browser, React, And Pixi Performance Remediation Plan

## Execution Order

| Order | Priority | Fix | Goal | Primary verification |
| --- | --- | --- | --- | --- |
| 1 | `P1` | Bootstrap i18n import boundary | Keep startup locale loading off the broad UI barrel and preserve the deferred `App` entry. | Client build plus manifest check for bootstrap imports |
| 2 | `P1` | App shell rerender narrowing | Stop unrelated gameplay clones from rerendering the shell and window composition path. | Focused jsdom tests plus client typecheck |
| 3 | `P1` | Pixi render snapshot narrowing | Stop non-render gameplay clones from forcing `renderScene` on the world ticker path. | Focused node tests for `pixiWorldRenderLoop` |
| 4 | `P2` | Gameplay icon id boundary | Remove raw SVG URLs from gameplay-facing modules and resolve assets only at the UI edge. | Focused node tests plus client build artifact check |
| 5 | `P2` | Hover-analysis worker payload narrowing | Stop broad gameplay clones from syncing full tiles, enemies, and world state into the hover-analysis worker when only nearby hover inputs changed. | Focused node tests plus client typecheck |
| 6 | `P3` | Debug split repair | Make the existing lazy debug import effective again by removing static `stateDebug` coupling from eager paths. | Focused node and jsdom tests plus client build warning check |

## Fix 1: Bootstrap I18n Import Boundary

### Current problem

- `packages/client/src/i18n/index.ts` imports `getCurrentLanguage`,
  `setLocaleTranslations`, and `t` from the root `@realmfall/ui-react` barrel.
- `packages/ui/src/index.ts` re-exports a broad surface, which pulls the shared
  package entry into the bootstrap path.
- The current production manifest shows `index.html` preloading the large
  `state` chunk before the deferred `App` entry finishes loading.

### Owned scope

- `packages/client/src/i18n/index.ts`
- `packages/ui/package.json`
- `packages/ui/src/i18n/index.ts`
- Any new focused UI export needed for i18n-only bootstrap access

### Planned change

1. Add a narrow `@realmfall/ui-react/i18n` export that exposes only the
   translation helpers needed by bootstrap.
2. Switch client bootstrap i18n code to that narrow export instead of the UI
   package root.
3. Keep `src/main.tsx` dependencies limited to locale asset loading, shell
   startup helpers, and settings hydration.
4. Preserve the current bootstrap ordering guarantee: locale data must load
   before importing `App`.

### Non-regression constraints

- Do not change translation behavior or supported locale loading semantics.
- Do not move locale bytes back into eager JS.
- Do not break the existing cold-start guarantee covered by the i18n bootstrap
  order test.

### Verification

- `pnpm --filter @realmfall/ui-react test -- --runInBand`
- `pnpm --filter @realmfall/client-web test:node -- packages/client/src/game/content/i18nBootstrapOrder.test.ts`
- `pnpm --filter @realmfall/client-web build`
- Inspect `packages/client/dist/.vite/manifest.json` and confirm the bootstrap
  entry no longer imports the large shared `state` chunk ahead of the deferred
  `App` chunk.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/internationalization/spec.md`
- `docs/rules/50-build-and-bundle.md`

## Fix 2: App Shell Rerender Narrowing

### Current problem

- `useAppBootstrapState` stores one top-level `game` state object.
- `AppShell` receives the full `GameState` even though it reads only a narrow
  set of slices.
- `AppWindows` is not memoized, so whole-shell rerenders keep re-entering the
  dock and deferred window composition path.

### Owned scope

- `packages/client/src/app/App/components/AppShell.tsx`
- `packages/client/src/app/App/AppWindows.tsx`
- `packages/client/src/app/App/hooks/useAppRuntime.ts`
- Any adjacent shell/view types required to narrow props cleanly
- Focused tests around shell and window composition

### Planned change

1. Replace the broad `game` shell prop with a narrow shell view contract that
   contains only the slices `AppShell` consumes directly.
2. Keep the voice playback bridge on the already memoized playback slice rather
   than the full `GameState`.
3. Pass only the world-facing fields needed by `HomeIndicator`.
4. Wrap `AppWindows` in `memo` and keep its props stable when unrelated shell
   state changes.
5. Avoid regrowing a broad adapter object in `useAppRuntime`; use a focused
   shell payload instead.

### Non-regression constraints

- Preserve shell loading, pause overlay, audio bridge activation, and home
  indicator behavior.
- Do not hide the shell during hydration or Pixi bootstrap.
- Do not widen `AppShell` back to a whole-state dependency in a different prop
  object.

### Verification

- `pnpm --filter @realmfall/client-web test:jsdom -- packages/client/src/app/App/components/AppShell.test.tsx`
- `pnpm --filter @realmfall/client-web test:jsdom -- packages/client/src/app/App/hooks/useAppWindowRuntime.test.tsx`
- Add or update a focused test for `AppWindows` memo or prop stability if the
  current suites do not already cover the narrowed contract.
- `pnpm --filter @realmfall/client-web typecheck`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/rules/30-react-ui.md`

## Fix 3: Pixi Render Snapshot Narrowing

### Current problem

- `createWorldRenderFrame` compares `lastRenderSnapshot.game === currentGame`
  before bailing out.
- Any immutable `GameState` clone, including log-only or inventory-only
  changes, invalidates that comparison and can force `renderScene`.
- The world render snapshot already tracks other stable inputs; the broad game
  object is the remaining coarse invalidation key.

### Owned scope

- `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
- `packages/client/src/app/App/world/worldRenderSnapshot.ts`
- `packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts`
- Any neighboring render token helpers needed to keep the snapshot explicit

### Planned change

1. Replace stored whole-`GameState` snapshot identity with a stable world render
   token or render-slice snapshot.
2. Include only inputs that actually affect visible world rendering, such as
   active world identity, player world position, visible tile state,
   combat/render flags, and movement-transition-sensitive data.
3. Keep the adjacent-move and post-combat transition guards working without
   storing the full previous `GameState`.
4. Preserve icon warming, animation-bucket cadence, and world icon texture
   version invalidation behavior.

### Non-regression constraints

- Do not skip redraws that are required for movement cooldown arcs, combat
  staging, icon texture loads, cloud settings changes, or visible tile changes.
- Do not reintroduce full visible-tile recomputation just to build the render
  token.

### Verification

- Extend `packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts` with a
  case proving unrelated gameplay clones do not trigger `renderScene`.
- Keep or update the existing tests for cloud settings, icon texture version,
  terrain toggles, and movement transitions.
- `pnpm --filter @realmfall/client-web test:node -- packages/client/src/app/App/world/pixiWorldRenderLoop.test.ts`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/40-pixi-performance.md`

## Fix 4: Gameplay Icon Id Boundary

### Current problem

- Gameplay-facing modules such as `packages/client/src/game/content/icons.ts`,
  `packages/client/src/game/content/statusEffects.ts`, and
  `packages/client/src/game/abilities.ts` import raw SVG URLs directly.
- Worker bundles inherit those asset imports, and the current production build
  emits duplicate SVG files for both main-app and worker paths.
- UI resolution already has an asset boundary for generated icons, but not for
  the broader gameplay icon catalog.

### Owned scope

- `packages/client/src/game/content/icons.ts`
- `packages/client/src/game/content/statusEffects.ts`
- `packages/client/src/game/abilities.ts`
- `packages/client/src/ui/iconAssets.ts`
- `packages/client/src/ui/icons.ts`
- Any shared UI resolver modules needed to map stable icon ids to asset URLs
- Focused tests for gameplay icon catalogs and ability or status icon handling

### Planned change

1. Convert gameplay-facing icon definitions from raw asset URLs to stable icon
   ids.
2. Extend the client UI asset resolver so those ids resolve to actual asset URLs
   only at the presentation edge.
3. Preserve the existing generated-icon resolver path and compose the new
   content-icon resolver next to it rather than replacing it.
4. Keep item, enemy, ability, and status-effect presentation behavior unchanged
   from the UI perspective.
5. Confirm worker bundles stop importing the duplicated raw SVG asset graph.

### Non-regression constraints

- Do not change any gameplay ids, item config keys, or tooltip-facing icon
  semantics.
- Do not break current UI icon usage for structures, skill icons, or generated
  equipment icons.
- Keep raw asset imports allowed in UI-only modules such as `ui/icons.ts` and
  world marker assets.

### Verification

- Extend `packages/client/src/game/content/generatedEquipment.test.ts` with
  coverage for the broader gameplay icon boundary, or add a focused sibling test
  if that keeps concerns clearer.
- Keep `packages/client/src/game/abilities.test.ts` and
  `packages/client/src/game/content/statusEffects.test.ts` green if their icon
  assumptions change.
- `pnpm --filter @realmfall/client-web test:node -- packages/client/src/game/content/generatedEquipment.test.ts packages/client/src/game/abilities.test.ts packages/client/src/game/content/statusEffects.test.ts`
- `pnpm --filter @realmfall/client-web build`
- Re-check the production `dist/assets` output and confirm the worker-specific
  duplicate SVG copies are removed or materially reduced.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/content-ids-and-tags/spec.md`
- `docs/rules/50-build-and-bundle.md`

## Fix 5: Hover-Analysis Worker Payload Narrowing

### Current problem

- `packages/client/src/app/App/world/usePixiWorldHoverLifecycle.ts` refreshes
  hover analysis whenever broad gameplay containers such as `tiles`,
  `enemies`, and `combat` change.
- `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
  currently models worker sync state as a broad `PathfindingState`, including
  full `tiles`, `enemies`, and `worlds` containers.
- Every hover-analysis sync clones more gameplay state into the worker than the
  hover path needs to answer actionable-tile and safe-path questions.

### Owned scope

- `packages/client/src/app/App/world/usePixiWorldHoverLifecycle.ts`
- `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
- `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
- `packages/client/src/app/App/world/hoverAnalysis/worldHoverAnalysisRuntime.ts`
- Any focused hover-analysis tests needed to prove payload narrowing

### Planned change

1. Replace the broad hover worker sync state with a hover-specific contract
   that carries only the active-world fields needed for reveal-radius checks,
   passability, and safe-path analysis.
2. Limit synced tile and enemy payloads to the nearby world slice that the
   hover path can actually traverse or inspect.
3. Remove `worlds` and other non-hover containers from the worker payload if a
   smaller active-world token or world-kind field can answer the same logic.
4. Keep the local fallback source and worker source on the same narrow hover
   analysis contract.
5. Preserve hover cache invalidation and tooltip correctness when relevant
   nearby world data changes.

### Non-regression constraints

- Do not break reveal-radius rules, hostile adjacency checks, or dungeon versus
  surface hover behavior.
- Do not fall back to broad whole-state sync through an adapter layer that
  recreates the original clone cost.
- Do not change tooltip content or actionability outcomes for reachable,
  unreachable, or blocked tiles.

### Verification

- Add focused tests for the hover-analysis state builder proving it excludes
  unrelated world data while preserving the nearby slice needed for pathfinding.
- Add or extend hover-analysis runtime or worker-source tests for safe-path and
  actionability correctness on the narrowed state shape.
- `pnpm --filter @realmfall/client-web test:node -- src/app/App/world/hoverAnalysis/createWorkerWorldHoverAnalysisSource.test.ts`
- Run the focused hover-analysis test files added in this change.
- `pnpm --filter @realmfall/client-web typecheck`

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/rules/40-pixi-performance.md`

## Fix 6: Debug Split Repair

### Current problem

- `descriptorHandlers.ts` dynamically imports `stateDebug`, but
  `packages/client/src/game/state.ts` also re-exports debug helpers and
  `DebugWindowContent.tsx` statically imports debug constants.
- That static coupling makes the current dynamic debug import ineffective in the
  production build.

### Owned scope

- `packages/client/src/game/state.ts`
- `packages/client/src/game/stateDebug.ts`
- `packages/client/src/ui/components/DebugWindow/DebugWindowContent.tsx`
- `packages/client/src/ui/components/DebugWindow/types.ts`
- `packages/client/src/app/App/hooks/gameActionHandlers/descriptorHandlers.ts`
- Related tests for debug helpers and the debug window

### Planned change

1. Move debug-window-only constants and types into a focused module that can be
   imported eagerly without pulling the full debug transition implementation
   into startup or shared state barrels.
2. Remove `stateDebug` re-exports from the broad `game/state.ts` barrel if they
   are only needed by the debug path.
3. Keep `descriptorHandlers.ts` on the lazy `import('../../../../game/stateDebug')`
   path for the actual state mutations.
4. Preserve debug-window behavior, labels, and command handling.

### Non-regression constraints

- Do not change debug command semantics.
- Do not break tests that intentionally import the debug helpers directly.
- Do not move non-debug gameplay helpers behind the lazy debug module.

### Verification

- `pnpm --filter @realmfall/client-web test:node -- packages/client/src/game/stateDebug.test.ts packages/client/src/app/App/hooks/gameActionHandlers/descriptorHandlers.test.ts`
- `pnpm --filter @realmfall/client-web test:jsdom -- packages/client/src/app/App/tests/App.debugWindow.test.tsx`
- `pnpm --filter @realmfall/client-web build`
- Confirm the build no longer reports the ineffective dynamic import warning for
  `stateDebug`.

### Durable docs to update with this fix

- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/rules/50-build-and-bundle.md`

## Delegation Rules For This Workspace

- The main thread owns planning, code review, verification, docs, and git
  decisions.
- Only the implementation work for the six fixes is delegated.
- Each worker handoff must include the owned files, preserved behaviors, target
  tests, and an escalation path to return `NEEDS_CONTEXT` instead of guessing
  across broader shared behavior.
- Each fix lands in its own commit after main-thread review and verification.
