# Implementation Plan: Fix Ineffective World Import Warnings

**Branch**: `master` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `docs/implementation-notes/issues/fix-vite-state-import-warning/spec.md`

## Summary

This session is planning-only. The attempted `usePixiWorld` change was reverted, `pnpm build` was rerun, and the plan now captures the full current warning set: ineffective dynamic imports for `src/game/state.ts`, `src/ui/tooltips.ts`, `src/ui/world/timeOfDay.ts`, and `src/ui/world/renderSceneMath.ts`.

## Technical Context

**Language/Version**: TypeScript 5.8.x  
**Primary Dependencies**: React 18, Vite 6, Pixi.js 7  
**Storage**: N/A  
**Testing**: `pnpm build`  
**Target Platform**: Browser client  
**Project Type**: Web application  
**Performance Goals**: Keep the initial path intentional without introducing fake code-splitting boundaries  
**Constraints**: Planning-only session; no code changes beyond reverting the prior attempt; preserve the current runtime behavior  
**Scale/Scope**: One world hook, four production build warnings, no gameplay-system redesign in this session

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- `docs/RULES.md` General: prefer the smallest correct change and preserve shipped behavior.
- `docs/RULES.md` React UI: keep heavy app coordination in existing hooks and preserve current containment patterns.
- `docs/RULES.md` Build And Bundle: keep the production bundle intentional and avoid fake split points on the initial app path.
- `docs/RULES.md` Testing: verify production buildability after bundle-path changes.

Gate result: Pass for planning work. A later implementation pass should stay limited to bundle-intent cleanup in the existing hook unless broader chunking changes are explicitly requested.

## Project Structure

### Documentation (this feature)

```text
docs/implementation-notes/issues/fix-vite-state-import-warning/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/app/App/usePixiWorld.ts      # World hook with lazy world bundle setup
src/app/App/useAppControllers.ts # Existing eager tooltip usage on main app path
src/app/App/useWorldClockFps.ts  # Existing eager time formatting usage on main app path
src/app/App/App.tsx              # Existing eager world math usage on main app path
src/ui/world/renderScene.ts      # Deferred world-render entry point that should remain lazy
```

**Structure Decision**: Keep the future fix isolated to `src/app/App/usePixiWorld.ts` unless the later implementation shows one of the warnings actually requires broader initial-path rework.

## Observed Warnings

1. `src/game/state.ts`
   Statically imported by multiple app and UI entry points, including `App.tsx`, `AppWindows.tsx`, focused app hooks and utils under `src/app/App`, `useAppPersistence.ts`, `useCombatAutomation.ts`, `normalize.ts`, `EquipmentWindow.tsx`, `ui/icons.ts`, `ui/tooltips.ts`, and `ui/world/renderScene.ts`.
2. `src/ui/tooltips.ts`
   Statically imported by `src/app/App/useAppControllers.ts`.
3. `src/ui/world/timeOfDay.ts`
   Statically imported by `src/app/App/useWorldClockFps.ts`, `src/ui/world/renderScene.ts`, `src/ui/world/renderSceneAtmosphere.ts`, and `src/ui/world/renderSceneEnvironment.ts`.
4. `src/ui/world/renderSceneMath.ts`
   Statically imported by `src/app/App/App.tsx`, `src/ui/world/renderScene.ts`, `src/ui/world/renderSceneAtmosphere.ts`, `src/ui/world/renderSceneEnvironment.ts`, and `src/ui/world/worldMapFishEye.ts`.

## Phase 0: Research Decisions

See [research.md](./research.md).

## Phase 1: Design

1. Audit the current `Promise.all` imports in `usePixiWorld` against the observed static import graph.
2. Group the four warned modules into likely eager helper imports versus still-meaningful deferred world-render imports.
3. Decide whether the future implementation should convert all four warned modules to eager imports in one pass.
4. Verify a later implementation with `pnpm build` and check that only meaningful lazy boundaries remain.

## Verification Plan

1. Run `pnpm build`.
2. Confirm the current warning inventory still matches the four warnings listed above before implementation begins.
3. After a future implementation, confirm the ineffective dynamic-import warnings are gone and that any intentionally deferred world-render chunks still exist.

## Risks And Mitigations

- **Risk**: Treating all warned modules the same could accidentally collapse a deferred path that still has value.
  **Mitigation**: Re-check whether `renderScene` and fish-eye-related imports remain meaningful lazy boundaries before implementation.

- **Risk**: Future implementation could fix only one warning and leave the rest, causing repeated partial work.
  **Mitigation**: Plan the implementation around the full four-warning group emitted by the current build.

## Complexity Tracking

No constitution violations are expected. The later implementation should remain a focused bundle-intent cleanup within the existing hook.
