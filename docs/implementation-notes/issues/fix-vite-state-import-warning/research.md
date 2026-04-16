# Research: Fix Ineffective World Import Warnings

## Observation 1: The issue is broader than `state.ts`

- **Finding**: The current build reports four ineffective dynamic-import warnings from `usePixiWorld`, not just `src/game/state.ts`.
- **Rationale**: `pnpm build` also reports overlapping static imports for `src/ui/tooltips.ts`, `src/ui/world/timeOfDay.ts`, and `src/ui/world/renderSceneMath.ts`.
- **Planning implication**: Future implementation should likely address the full warning group in one pass.

## Observation 2: The warned modules are helper-level imports

- **Finding**: The four warned modules are support modules already pulled into the app through other static imports, while `renderScene` and `worldMapFishEye` are not part of the warning set.
- **Rationale**: The build output suggests the fake split points are helper imports, not necessarily the entire deferred world renderer.
- **Planning implication**: Future implementation should separately evaluate helper eagerness and renderer deferral.

## Observation 3: This session should stop at documentation

- **Finding**: The user requested no new code changes in this session beyond reverting the attempted hook change.
- **Rationale**: That makes `pnpm build` the source for warning inventory, but not a trigger for implementation work yet.
- **Planning implication**: The output of this session should be an updated warning inventory and implementation plan only.
