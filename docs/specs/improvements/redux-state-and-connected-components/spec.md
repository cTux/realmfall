# Feature Specification: Redux State And Connected Components

**Feature Branch**: `master`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: User description: "Move all the state to redux; decrease amount of passing props to the component by creating `{ComponentName}.connect.ts(x)` files; evaluate optional `useGameState()`."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Centralize Shared Application State (Priority: P1)

As a maintainer, I want shared gameplay and persisted UI state centralized in Redux so the app no longer depends on a large `App`-level local-state graph.

**Why this priority**: This is the core architectural change requested by the feature.

**Independent Test**: Boot the application, hydrate a saved game, and verify gameplay and window state still initialize correctly when Redux is the source of truth.

**Acceptance Scenarios**:

1. **Given** the app boots from a fresh session, **When** initialization completes, **Then** gameplay state and shared UI state are available from the Redux store.
2. **Given** a persisted save exists, **When** the app hydrates, **Then** normalized game state and persisted UI state populate Redux without breaking save compatibility.

---

### User Story 2 - Reduce Prop Drilling Through Connected Entry Points (Priority: P1)

As a maintainer, I want store-connected component entry points so parent components stop forwarding large prop sets through the window tree.

**Why this priority**: The user specifically requested `{ComponentName}.connect.ts(x)` files and reduced prop passing.

**Independent Test**: Inspect window entry points and verify consumers import connected components from component-root `index.ts` files while presentational components keep smaller prop surfaces.

**Acceptance Scenarios**:

1. **Given** a UI component folder that consumes shared store data, **When** its root export is used, **Then** the root `index.ts` exports `ComponentNameConnected as ComponentName` from `./{ComponentName}.connect.ts(x)`.
2. **Given** a connected window component, **When** it renders, **Then** it reads required store state locally instead of depending on broad prop chains from `AppWindows`.

---

### User Story 3 - Preserve Performance-Sensitive Interaction Paths (Priority: P1)

As a maintainer, I want the Redux migration to avoid moving hot-path transient refs into the store so world rendering and hover performance do not regress.

**Why this priority**: The repository rules explicitly protect high-frequency interaction paths from broad shared state updates.

**Independent Test**: Review migrated state ownership and confirm Pixi refs, DOM refs, timers, and per-frame hover bookkeeping remain outside Redux.

**Acceptance Scenarios**:

1. **Given** world rendering and hover interaction are active, **When** the app updates per-frame state, **Then** Pixi refs, DOM refs, and pointer-hot-path transient values remain outside Redux.
2. **Given** Redux owns shared gameplay and UI state, **When** the world path renders, **Then** the migration does not introduce store writes for per-pointer-move or per-frame ref data that only the renderer needs.

---

### User Story 4 - Provide A Clear Selector Hook Strategy (Priority: P2)

As a maintainer, I want clear guidance for when to use connected components versus a `useGameState()` hook so the new architecture stays consistent.

**Why this priority**: Without explicit rules, the codebase can drift into a mix of overly broad hooks and ad hoc direct store access.

**Independent Test**: Review the resulting architecture guidance and confirm a contributor can choose between a connected component and a hook using documented criteria.

**Acceptance Scenarios**:

1. **Given** a component root that primarily binds store data to a presentational component, **When** a contributor extends it, **Then** the documented default is a connected entry-point file.
2. **Given** a feature hook that needs a cohesive, narrow bundle of selectors and actions, **When** a contributor implements it, **Then** `useGameState()` or a similar domain-scoped selector hook is allowed and documented.

---

### Edge Cases

- How should the migration handle existing helpers that rely on `worldTimeMsRef.current` before a state transition?
- Which current tooltip and context-menu states are durable enough to justify Redux ownership, and which should stay local or external-store based?
- How should lazy-loaded windows access the store without reintroducing broad selector objects that trigger unnecessary rerenders?
- How should the migration preserve Storybook usability for presentational components once connected entry points become the default exports?
- How should persistence avoid rewriting identical payloads after state ownership moves from `useState` hooks to Redux slices?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST introduce a Redux store as the source of truth for shared gameplay state.
- **FR-002**: The system MUST move persisted shared UI state, including window positions, window visibility, and log filters, into Redux-managed state.
- **FR-003**: The system MUST preserve the existing normalize-before-hydrate save loading behavior when hydrating Redux state.
- **FR-004**: The system MUST keep gameplay and simulation rules in `src/game` rather than moving those rules into React components or UI-specific reducers.
- **FR-005**: The system MUST provide connected component entry points named `{ComponentName}.connect.ts` or `{ComponentName}.connect.tsx` for components that consume store state directly.
- **FR-006**: The root `index.ts` in a connected component folder MUST export `{ ComponentNameConnected as ComponentName }` from `./{ComponentName}.connect`.
- **FR-007**: The system MUST reduce broad prop chains from `App` and `AppWindows` by having connected components select their own required store data.
- **FR-008**: The system MUST preserve lazy loading for secondary windows and must not collapse those windows back onto the initial bundle path just because they gain store access.
- **FR-009**: The system MUST keep ephemeral non-serializable runtime objects out of Redux, including DOM refs, Pixi application instances, timers, animation frame handles, and equivalent per-frame bookkeeping.
- **FR-010**: The system MUST avoid routing high-frequency pointer or hover bookkeeping through Redux when refs or narrower local mechanisms are sufficient.
- **FR-011**: The system MUST define a selector strategy that prefers narrow subscriptions over broad "everything" selectors.
- **FR-012**: The system MUST document when a `useGameState()` hook is appropriate and when direct connected components or narrower selector hooks are preferred.
- **FR-013**: The system MUST keep current production buildability and quality commands working after the migration.
- **FR-014**: The system MUST preserve or improve Storybook support for presentational window/content components after connected entry points are introduced.

### Key Entities _(include if feature involves data)_

- **Redux Store**: The top-level application store that owns shared gameplay state and persisted shared UI state.
- **Game Slice**: The Redux-managed state domain that wraps the existing pure gameplay transitions from `src/game/state.ts`.
- **UI Slice**: The Redux-managed state domain for persisted UI concerns such as window positions, window visibility, and log filters.
- **Connected Component Entry Point**: A `{ComponentName}.connect.ts(x)` file that selects store data and dispatches actions for a presentational component.
- **Selector Hook**: A narrow custom hook, optionally including `useGameState()`, that composes a cohesive subset of selectors and actions for a specific feature boundary.
- **Transient Runtime State**: Non-serializable or high-frequency values such as refs, timers, Pixi instances, pointer-hot-path hover data, and similar runtime-only objects that remain outside Redux.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `App.tsx` no longer owns the main gameplay state through `useState`, and shared gameplay state comes from Redux.
- **SC-002**: `AppWindows` has a materially smaller prop surface because connected windows read shared store data directly.
- **SC-003**: Secondary windows continue to load lazily after becoming connected components.
- **SC-004**: Hydration and autosave continue to work with normalized save data and without duplicate writes for unchanged persisted snapshots.
- **SC-005**: The documented architecture clearly distinguishes Redux-owned shared state from ref-owned transient runtime state.
- **SC-006**: Contributors can determine from the spec and plan when to use a connected component versus `useGameState()` without relying on tribal knowledge.

## Assumptions

- The project will adopt Redux Toolkit and React Redux rather than hand-rolled Redux wiring.
- Existing pure transition helpers in `src/game/state.ts` are stable enough to serve as reducer building blocks.
- The migration should be incremental, not a single all-at-once rewrite.
- Presentational components should remain testable in isolation even when folder root exports become connected by default.
- The request to "move all the state to redux" is interpreted as "move shared durable app state," not "move every ref, timer, and runtime handle into the store."
