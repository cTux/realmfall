# Feature Brief: Fix Ineffective World Import Warnings

**Feature Branch**: `master`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Planning-only follow-up: revert the attempted `usePixiWorld` implementation change, run `pnpm build`, identify the current warnings, and adjust the docs to reflect the full warning set without making code changes in this session."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preserve the captured warning snapshot (Priority: P1)

As a maintainer, I want the brief to preserve the warning snapshot gathered in the earlier planning session so later work can compare old and new build output without confusing the historical note for the current build state.

**Why this priority**: The earlier planning session was about capturing a specific warning set, and the note should stay explicit about that historical scope.

**Independent Test**: Review the brief and confirm it describes the warning list as a historical snapshot from the planning session rather than as a claim about the current build.

**Acceptance Scenarios**:

1. **Given** the warning inventory was captured in an earlier planning-only session, **When** a contributor reads the brief, **Then** they can see the list is a historical snapshot tied to that session.
2. **Given** future implementation work is deferred, **When** a contributor reads the brief, **Then** they can see that this session only captured warnings and did not change runtime behavior.

---

### User Story 2 - Preserve planning-only scope (Priority: P2)

As a contributor, I want the docs to clearly state that this session reverted the attempted hook change and performed no new implementation work so the branch remains a planning baseline.

**Why this priority**: The user explicitly requested planning only, so the documentation should match that scope.

**Independent Test**: Review the worktree and docs to confirm the code change in `usePixiWorld.ts` was reverted and only documentation changed afterward.

**Acceptance Scenarios**:

1. **Given** the prior `usePixiWorld` import change was reverted, **When** the build is run again, **Then** the warning set reflects the pre-change implementation.
2. **Given** this feature remains in planning, **When** someone reads the plan, **Then** they can distinguish observed warnings from unexecuted implementation ideas.

---

### User Story 3 - Prepare a complete future fix plan (Priority: P3)

As a contributor, I want the feature artifacts to show which warning-producing modules are already on the eager path elsewhere so a later fix can target all ineffective imports together.

**Why this priority**: The warnings are related and come from the same lazy-loading hook, so future implementation should address them as a set.

**Independent Test**: Review the feature artifacts and confirm they identify the warning source, overlapping static import sites, and the expected verification command.

**Acceptance Scenarios**:

1. **Given** a contributor reviews the spec and plan, **When** they check the warning inventory, **Then** they can see that `state.ts`, `tooltips.ts`, `timeOfDay.ts`, and `renderSceneMath.ts` are all part of the same ineffective import pattern.
2. **Given** a future import cleanup is considered, **When** the contributor checks the documented intent, **Then** they can identify which modules should likely become eager and which deferred imports should be re-evaluated separately.

---

### Edge Cases

- What happens when one deferred import in `usePixiWorld` is fixed but the other overlapping eager modules remain lazy-loaded in the same `Promise.all` call?
- How should planning distinguish genuinely deferred world-render code from helper modules already pulled into the initial app path by other features?
- What happens if a future refactor removes one of the overlapping static imports and makes a currently warned module a valid split candidate again?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The planning docs MUST preserve the captured ineffective dynamic-import warning inventory for `src/app/App/usePixiWorld.ts` as a historical planning snapshot.
- **FR-002**: The planning docs MUST identify the warned modules in that snapshot as `src/game/state.ts`, `src/ui/tooltips.ts`, `src/ui/world/timeOfDay.ts`, and `src/ui/world/renderSceneMath.ts`.
- **FR-003**: The planning docs MUST note that this session reverted the attempted `usePixiWorld` implementation change and performed no replacement code changes.
- **FR-004**: The planning docs MUST preserve the distinction between likely eager helper modules and the separately deferred world-render path.
- **FR-005**: The planning docs MUST keep `pnpm build` as the verification command for any future implementation.

### Key Entities _(include if feature involves data)_

- **Ineffective Dynamic Import Warning**: A Vite build warning stating that a module imported with `import()` is already statically imported elsewhere and therefore will not move to another chunk.
- **Warned Module**: One of the four modules currently reported by Vite from the `usePixiWorld` dynamic import group.
- **Planning Baseline**: The current code state after reverting the attempted hook change and re-running `pnpm build`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The docs present the four ineffective dynamic-import warnings as a historical planning snapshot instead of as a claim about the latest `pnpm build` run.
- **SC-002**: The docs clearly state that no new implementation changes were made after the revert.
- **SC-003**: A contributor can use the docs to identify the warning-producing module group and the required verification command for later implementation work.

## Assumptions

- The four reported warnings were the planning scope in the earlier session that created this brief.
- `renderScene.ts` and `worldMapFishEye.ts` may still represent meaningful deferred paths and should be evaluated separately from the warned helper modules.
- Verification through the production build output is sufficient for this planning-only documentation update.
