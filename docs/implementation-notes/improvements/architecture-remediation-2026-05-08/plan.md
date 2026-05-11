# Architecture Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` principles for task isolation, but keep review and commit orchestration on the main thread. Steps use checkbox syntax for tracking.

**Goal:** Remove high-risk shared-package boundary leaks, collapse duplicated UI helper logic into canonical modules, and split the two largest mixed-responsibility runtime files into focused orchestration helpers without changing shipped behavior.

**Architecture:** The work is divided into commit-sized refactors. First, collapse exact and near-exact duplication around shared UI helpers and item presentation metadata so `packages/ui-react` becomes the canonical owner. Next, eliminate `packages/ui-react` runtime imports from `packages/client-web` except for the explicitly retained Storybook helper bridge and the isolated shared SCSS surface-token forward. Finally, split the large Pixi orchestration files by lifecycle and render-phase responsibility so the public entrypoints stay thin.

**Tech Stack:** TypeScript, React, Vite, Vitest, pnpm workspaces, Pixi.js, Storybook.

---

## File Map

### Shared package boundary and helper ownership

- `packages/ui-react/src/formatters.ts`
- `packages/ui-react/src/tooltipPlacement.ts`
- `packages/ui-react/src/tooltips.ts`
- `packages/ui-react/src/iconAssets.ts`
- `packages/ui-react/src/itemMetadata.ts`
- `packages/ui-react/src/icons.ts`
- `packages/ui-react/src/game/content/items.ts`
- `packages/ui-react/src/game/content/tags.ts`
- `packages/ui-react/src/game/stateTypes.ts`
- `packages/ui-react/src/app/audio/UiAudioContext.tsx`
- `packages/ui-react/src/bridges/generatedIconAssets.ts`
- `packages/ui-react/src/i18n/index.ts`
- `packages/ui-react/src/i18n/labels.ts`
- `packages/ui-react/src/components/storybook/storybookHelpers.tsx`
- `packages/ui-react/src/game/__tests__/boundary.spec.test.ts`
- `packages/ui-react/src/game/__tests__/utils/boundaryScan.ts`

### Client consumers that should stop owning shared logic

- `packages/client-web/src/ui/formatters.ts`
- `packages/client-web/src/ui/tooltipPlacement.ts`
- `packages/client-web/src/ui/tooltips.ts`
- `packages/client-web/src/ui/tooltips/shared.ts`
- `packages/client-web/src/ui/iconAssets.ts`
- `packages/client-web/src/ui/icons.ts`
- `packages/client-web/src/app/audio/UiAudioContext.tsx`
- `packages/client-web/src/app/App/hooks/useItemTooltipController.ts`
- `packages/client-web/src/ui/components/**/*`
- `packages/client-web/src/ui/helpers.test.tsx`
- `packages/client-web/src/ui/uiVisualHelpers.test.tsx`
- `packages/client-web/src/ui/uiTooltipBehavior.test.tsx`

### Pixi orchestration and renderer split

- `packages/client-web/src/app/App/usePixiWorld.ts`
- `packages/client-web/src/app/App/world/*`
- `packages/client-web/src/ui/world/renderScene.ts`
- new focused helpers under `packages/client-web/src/ui/world/`

### Docs that should move with the code

- `docs/specs/reference/technical-solutions/application-architecture/spec.md`
- `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
- `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`
- `docs/specs/reference/technical-solutions/documentation-strategy/spec.md`
- `docs/rules/10-architecture.md`

---

### Task 1: Deduplicate exact shared UI utilities

**Intent:** Remove the exact client/UI duplicates for compact-number formatting, tooltip placement, and shared tooltip line tagging so `packages/ui-react` is the single implementation owner.

**Files:**

- Modify: `packages/ui-react/src/index.ts`
- Modify: `packages/client-web/src/ui/formatters.ts`
- Modify: `packages/client-web/src/ui/tooltipPlacement.ts`
- Modify: `packages/client-web/src/ui/tooltips/shared.ts`
- Modify: `packages/client-web/src/ui/tooltips.ts`
- Modify: `packages/client-web/src/app/App/hooks/useItemTooltipController.ts`
- Modify: `packages/client-web/src/ui/helpers.test.tsx`
- Modify: `packages/client-web/src/ui/uiVisualHelpers.test.tsx`
- Modify: `packages/client-web/src/ui/uiTooltipBehavior.test.tsx`

- [ ] Replace local client helper implementations with thin re-exports or direct imports from `@realmfall/ui-react`.
- [ ] Keep `itemTooltipLines`, `enemyTooltip`, and other client-only tooltip builders in `packages/client-web`, but make their shared `TooltipLine` and `tagTooltipLines` dependency come from the shared package.
- [ ] Update tests to import the canonical helper surface once, not both copies.
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:jsdom -- --run packages/client-web/src/ui/helpers.test.tsx packages/client-web/src/ui/uiVisualHelpers.test.tsx packages/client-web/src/ui/uiTooltipBehavior.test.tsx`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `packages/client-web/src/ui/formatters.ts` and `packages/client-web/src/ui/tooltipPlacement.ts` no longer contain standalone implementations.
- Shared tooltip tag/type definitions come from `packages/ui-react`.
- Targeted UI tests stay green.

**Commit message:** `refactor: dedupe shared ui helpers`

---

### Task 2: Canonicalize item presentation metadata in `packages/ui-react`

**Intent:** Make `packages/ui-react` the single owner of gameplay-shaped item display rules used by both the shared package and the client package.

**Files:**

- Modify: `packages/ui-react/src/itemMetadata.ts`
- Modify: `packages/ui-react/src/icons.ts`
- Modify: `packages/ui-react/src/game/content/items.ts`
- Modify: `packages/ui-react/src/game/content/tags.ts`
- Modify: `packages/client-web/src/ui/icons.ts`
- Modify: `packages/client-web/src/game/content/items/itemClassification.ts`
- Add or modify tests under:
  - `packages/ui-react/src/game/__tests__/`
  - `packages/client-web/src/ui/`
  - `packages/client-web/src/game/`
- Modify docs:
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`

- [ ] Extract canonical item-category fallback rules, tag constants required by shared display logic, and item icon/tint lookup tables into the shared package.
- [ ] Slim `packages/client-web/src/ui/icons.ts` so it owns only client-only concerns such as enemy, structure, and skill icon resolution plus any wrappers needed around shared item presentation helpers.
- [ ] Remove known drift points found in review, including the mismatched armor icon mapping, the extra `beet-tonic` entry that only exists in one package, and the differing set tint values.
- [ ] Add focused tests that compare shared item presentation results for representative items instead of allowing the two packages to drift silently.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react test:jsdom`
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:node -- --run packages/client-web/src/game/*.test.ts packages/client-web/src/ui/worldIcons.test.ts`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- Shared item display decisions are defined once.
- Client item presentation delegates to the shared package for canonical item behavior.
- The documented drift points are removed by testable assertions.

**Commit message:** `refactor: canonicalize shared item presentation metadata`

---

### Task 3: Move shared UI audio ownership into `packages/ui-react`

**Intent:** Remove the shared package runtime import from `packages/client-web/src/app/audio/UiAudioContext.tsx` by making the shared package own the contract directly.

**Files:**

- Modify: `packages/ui-react/src/app/audio/UiAudioContext.tsx`
- Modify: `packages/ui-react/src/index.ts` if export surface changes
- Modify: `packages/client-web/src/app/audio/UiAudioContext.tsx`
- Modify any client or UI imports that still point at the client-local path
- Modify docs:
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`

- [ ] Copy the canonical `UiAudioController` contract and provider implementation into `packages/ui-react`.
- [ ] Convert the client-local file into a thin compatibility re-export from `@realmfall/ui-react` or remove it if no longer needed.
- [ ] Tighten the shared-package boundary test so this file is no longer an allowed bridge exception.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react test:jsdom`
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:jsdom -- --run packages/client-web/src/app/audio/*.test.tsx`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `packages/ui-react/src/app/audio/UiAudioContext.tsx` is self-owned.
- `packages/ui-react` no longer imports the shared audio context from `packages/client-web`.
- Boundary enforcement is updated to match.

**Commit message:** `refactor: move shared ui audio context into ui package`

---

### Task 4: Move generated icon asset ownership into the shared package

**Intent:** Remove the `packages/ui-react` bridge to client generated-icon runtime data and make the shared package own the generated icon registry it consumes.

**Files:**

- Modify or replace: `packages/ui-react/src/bridges/generatedIconAssets.ts`
- Modify: `packages/ui-react/src/iconAssets.ts`
- Modify: `packages/client-web/src/ui/generatedIconAssets.ts`
- Modify: `packages/client-web/src/ui/iconAssets.ts`
- Modify docs:
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`

- [ ] Move the canonical generated icon asset pool export into `packages/ui-react`.
- [ ] Keep the client file as a compatibility re-export only if client call sites still need the old path.
- [ ] Remove `packages/ui-react/src/bridges/generatedIconAssets.ts` as a client bridge or reduce it to a local shared-package module with no client import.
- [ ] Tighten the boundary test to drop this bridge exception.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react build`
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:node -- --run packages/client-web/src/ui/generatedIconAssets.test.ts packages/client-web/src/ui/tooltips/moduleSplit.test.ts`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- Shared generated icon resolution reads only shared-package data.
- The client package no longer owns the data that `packages/ui-react` depends on.

**Commit message:** `refactor: move generated icon assets into ui package`

---

### Task 5: Remove shared-package runtime asset imports from `packages/client-web`

**Intent:** Stop `packages/ui-react/src/icons.ts` from importing SVG assets through `../../client-web/src/...` paths.

**Files:**

- Modify: `packages/ui-react/src/icons.ts`
- Add: vendored shared UI asset paths under `packages/ui-react/src/` as needed
- Update any Vite or Storybook references if required by the new asset location
- Modify docs:
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`

- [ ] Move the shared icon assets used by `packages/ui-react` into the shared package or a neutral shared asset path that does not live under `packages/client-web/src`.
- [ ] Update imports in `packages/ui-react/src/icons.ts` to point only at shared-package-owned asset files.
- [ ] Leave client-only world and gameplay icon assets in `packages/client-web` if they are not used by the shared package.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react build`
- [ ] Verify with: `pnpm --filter @realmfall/ui-react test:jsdom`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `packages/ui-react/src/icons.ts` has no runtime imports from `packages/client-web/src`.
- Shared package builds with its own vendored icon assets.

**Commit message:** `refactor: vendor shared ui icon assets in ui package`

---

### Task 6: Replace the shared-package runtime i18n bridge

**Intent:** Remove the last runtime dependency from `packages/ui-react` to `packages/client-web` by replacing the current re-export bridge with a shared translation contract.

**Files:**

- Modify: `packages/ui-react/src/i18n/index.ts`
- Modify: `packages/ui-react/src/i18n/labels.ts`
- Add helpers or context under `packages/ui-react/src/i18n/`
- Modify affected shared components and tests across `packages/ui-react/src/components/**`
- Modify client integration points that currently rely on the old re-export behavior
- Modify docs:
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`
  - `docs/specs/reference/technical-solutions/documentation-strategy/spec.md`

- [ ] Introduce a shared-package i18n contract that can be provided by the client at runtime instead of re-exporting client translation modules.
- [ ] Keep existing translated copy unchanged by wiring the client’s translation implementation into the new contract.
- [ ] Update shared tests and Storybook fixtures to provide deterministic translation stubs locally.
- [ ] Tighten the boundary test so runtime i18n bridging from client is no longer allowed.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react test:jsdom`
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:jsdom`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `packages/ui-react` owns its translation contract.
- Runtime shared components no longer import translations through `packages/client-web/src`.
- Storybook and tests provide local translation adapters.

**Commit message:** `refactor: replace shared ui i18n bridge`

---

### Task 6a: Stabilize recipe-book content tests after the boundary move

**Intent:** Keep the architecture-remediation commit flow reliable by removing unrelated lazy-window timing from content-level recipe-book tests and making virtualization assertions deterministic.

**Files:**

- Modify: `packages/client-web/src/ui/uiRecipeBookTestHelpers.tsx`
- Modify: `packages/client-web/src/ui/uiRecipeBookWindow.test.tsx`

- [ ] Mount `RecipeBookWindowContent` directly in the recipe-book content test helper instead of routing content assertions through the deferred `RecipeBookWindow` shell.
- [ ] Keep the shell-focused `RecipeBookWindow` coverage in `packages/client-web/src/ui/uiWindowShells.test.tsx` as the wrapper-level check.
- [ ] Add an explicit UI settle step after virtualized recipe-list scrolling before asserting on the later rows.
- [ ] Verify with: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/ui/uiRecipeBookWindow.test.tsx`
- [ ] Verify with: `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/ui/uiWindowShells.test.tsx`
- [ ] Commit only this fix.

**Acceptance criteria:**

- Recipe-book content tests no longer depend on deferred window loading behavior.
- The large-list virtualization assertion is deterministic under full-suite load.

**Commit message:** `test(client): stabilize recipe book content suite`

---

### Task 7: Split `usePixiWorld` by lifecycle responsibility

**Intent:** Turn `packages/client-web/src/app/App/usePixiWorld.ts` into a thin public facade by moving grouped lifecycle logic into focused neighboring hooks.

**Files:**

- Modify: `packages/client-web/src/app/App/usePixiWorld.ts`
- Add or modify:
  - `packages/client-web/src/app/App/world/usePixiWorldRenderSettingsSync.ts`
  - `packages/client-web/src/app/App/world/usePixiWorldPendingCombatLifecycle.ts`
  - `packages/client-web/src/app/App/world/usePixiWorldHoverLifecycle.ts`
  - `packages/client-web/src/app/App/world/usePixiWorldQueuedTravelSuppression.ts`
- Update related tests under `packages/client-web/src/app/App/world/**` and `packages/client-web/src/app/App/tests/**`
- Modify docs:
  - `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
  - `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`

- [ ] Extract render-settings ref synchronization into a dedicated hook.
- [ ] Extract pending-combat intro timing and post-combat carryover seeding into a dedicated hook.
- [ ] Extract hover reset and refresh behavior into a dedicated hook.
- [ ] Extract queued-travel suppression release behavior into a dedicated hook.
- [ ] Keep `usePixiWorld` responsible only for ref setup, lifecycle composition, tile-resolution hookup, bootstrap invocation, and the returned canvas state.
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:jsdom -- --run packages/client-web/src/app/App/world/**/*.test.ts packages/client-web/src/app/App/tests/App.canvas.test.tsx`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `usePixiWorld.ts` loses the inline blocks for settings, hover, combat-intro timing, and suppression release.
- New helpers have focused responsibilities and existing tests pass.

**Commit message:** `refactor: split pixi world lifecycle hooks`

---

### Task 8: Thin `renderScene.ts` into orchestration only

**Intent:** Keep `renderScene.ts` focused on public orchestration by moving frame-state preparation and render-phase decisions into helpers.

**Files:**

- Modify: `packages/client-web/src/ui/world/renderScene.ts`
- Add focused helpers under `packages/client-web/src/ui/world/`, for example:
  - `renderSceneFrameState.ts`
  - `renderScenePhasePlan.ts`
  - `renderSceneMovementTokens.ts`
  - choose names that fit the repo pattern
- Update matching tests under `packages/client-web/src/ui/world/**`
- Modify docs:
  - `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`

- [ ] Move movement token helpers and frame-state assembly out of `renderScene.ts`.
- [ ] Move the decision logic for static, interaction, and animated passes into a helper that returns a declarative phase plan.
- [ ] Keep the public `renderScene` function as the thin shell that reads the phase plan and executes pass helpers.
- [ ] Preserve current render invalidation behavior and render-counter recording.
- [ ] Verify with: `pnpm --filter @realmfall/client-web test:node -- --run packages/client-web/src/ui/world/*.test.ts`
- [ ] Verify with: `pnpm --filter @realmfall/client-web typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- `renderScene.ts` no longer owns every token builder and phase decision inline.
- Render behavior and test coverage stay unchanged.

**Commit message:** `refactor: split world render scene orchestration`

---

### Task 9: Tighten boundary enforcement and final docs sync

**Intent:** Make the stricter shared-package boundary durable and align recurring guidance with the new architecture.

**Files:**

- Modify: `packages/ui-react/src/game/__tests__/boundary.spec.test.ts`
- Modify: `packages/ui-react/src/game/__tests__/utils/boundaryScan.ts`
- Modify: `docs/rules/10-architecture.md`
- Modify:
  - `docs/specs/reference/technical-solutions/application-architecture/spec.md`
  - `docs/specs/reference/technical-solutions/ui-component-library/spec.md`
  - `docs/specs/reference/technical-solutions/documentation-strategy/spec.md`

- [ ] Keep the allowed TypeScript boundary exceptions limited to the Storybook helper bridge and document the separate shared SCSS surface-token forward explicitly.
- [ ] Update the architecture rule text so future tasks do not reintroduce client-owned runtime helpers into `packages/ui-react`.
- [ ] Align the technical-solution specs with the shipped post-refactor boundary, helper ownership, and remaining exception policy.
- [ ] Verify with: `pnpm --filter @realmfall/ui-react test:jsdom -- --run packages/ui-react/src/game/__tests__/boundary.spec.test.ts`
- [ ] Verify with: `pnpm typecheck`
- [ ] Commit only this fix.

**Acceptance criteria:**

- Shared-package boundary policy is enforced by tests and documented in recurring rules.
- Specs describe the shipped architecture directly.

**Commit message:** `docs: tighten shared package boundary guidance`

---

## Execution Notes

- Use one implementation sub-agent per task.
- Keep each task on its own commit boundary.
- Main-thread review should happen after each delegated implementation before the commit is accepted as done.
- If a task uncovers unexpected shared-behavior changes outside its file map, stop that task and either tighten the scope or split a follow-up task before continuing.

## Self-Review

- Coverage check: the original findings are mapped to tasks for utility duplication, item-presentation duplication, shared-package client imports, large Pixi orchestration, large render orchestration, and rule/spec drift.
- Placeholder scan: no `TODO`, `TBD`, or “handle appropriately” placeholders remain.
- Scope check: the plan is intentionally split into commit-sized refactors instead of one umbrella boundary rewrite.
