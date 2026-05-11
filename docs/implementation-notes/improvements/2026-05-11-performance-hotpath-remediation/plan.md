# Performance Hotpath Remediation Plan

> **For agentic workers:** delegate implementation one task at a time with a tight handoff. Workers own code and tests only. Main thread owns review, docs, verification, and commits.

**Goal:** remove the highest-leverage client hotpath inefficiencies found in the May 11 performance audit without changing gameplay, save behavior, or tooltip semantics.

**Architecture:** keep each fix commit-sized and isolated by surface. First narrow the tile-resolution worker payload to the visible frontier. Next stop hover refresh from invalidating and re-syncing unchanged nearby worker state. Finally replace full previous-game retention on the pending-combat lifecycle with a minimal snapshot that carries only the fields the lifecycle reads.

**Tech Stack:** TypeScript, React 19, Pixi.js 8, Vite, Vitest, pnpm workspaces

---

## Audit Summary

### `P1` Visible-frontier tile-resolution payload

- Problem: `createVisibleWorldResolutionState(...)` forwards `game.tiles` as-is.
- Cost: every tile-resolution sync clones the full active-world tile map through
  the worker boundary even though only the visible frontier is needed to decide
  which coords remain unresolved.
- Primary files:
  - `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.ts`
  - `packages/client-web/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.test.ts`
  - `packages/client-web/src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts`
- Acceptance:
  - `resolvedTiles` in the coordinator sync payload only includes keys from the
    currently visible radius around `playerCoord`.
  - Stable frontier tests keep passing.
  - Existing active-world alias merge behavior remains unchanged.
- Verification:
  - `pnpm --filter @realmfall/client-web exec vitest run --project node src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.test.ts src/app/App/world/tileResolution/worldTileResolutionCoordinator.test.ts`
- Commit:
  - `perf: narrow tile-resolution sync payload to the visible frontier`

### `P1` Nearby-slice hover refresh deduplication

- Problem: hover refresh can clear cache state and resend hover-analysis worker
  state whenever broad hover inputs change, even when the nearby tiles and
  enemies slice consumed by hover analysis is unchanged.
- Cost: redundant worker sync, redundant hover invalidation, and avoidable
  pointer replay on a user-facing path.
- Primary files:
  - `packages/client-web/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.ts`
  - `packages/client-web/src/app/App/world/pixiWorldHoverInteractions.ts`
  - `packages/client-web/src/app/App/world/usePixiWorldHoverLifecycle.ts`
  - `packages/client-web/src/app/App/tests/App.worldInteractionPerformance.test.tsx`
  - `packages/client-web/src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts`
- Acceptance:
  - repeated refreshes with unchanged nearby hover-analysis state do not
    resync the worker and do not clear the hover cache
  - distant world changes outside the nearby slice do not force hover refresh
    recomputation
  - idle-hover refresh behavior and worker fallback semantics remain intact
- Verification:
  - `pnpm --filter @realmfall/client-web exec vitest run --project jsdom src/app/App/tests/App.worldInteractionPerformance.test.tsx src/app/App/world/hoverAnalysis/worldHoverAnalysisTypes.test.ts`
- Commit:
  - `perf: avoid redundant hover-analysis refresh work`

### `P2` Pending-combat previous-state snapshot narrowing

- Problem: the pending-combat seed lifecycle keeps the full previous `GameState`
  alive even though it only reads `player.coord` and `combat.engagement`.
- Cost: unnecessary broad object retention on a render-adjacent lifecycle path
  and weaker guarantees about what actually invalidates the post-combat seed
  logic.
- Primary files:
  - `packages/client-web/src/app/App/usePixiWorld.ts`
  - `packages/client-web/src/app/App/world/usePixiWorldPendingCombatLifecycle.ts`
  - `packages/client-web/src/app/App/world/pixiWorldPendingCombat.ts`
  - `packages/client-web/src/app/App/world/pixiWorldPendingCombat.test.ts`
  - `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md` if wording needs clarification
- Acceptance:
  - the retained previous-state ref carries only the previous player coord and
    the previous auto-step engagement fields needed by
    `getPostCombatAutoStepTransition(...)`
  - post-combat carryover and cooldown seeding behavior remain unchanged
  - no other caller regresses because of the narrower snapshot type
- Verification:
  - `pnpm --filter @realmfall/client-web exec vitest run --project node src/app/App/world/pixiWorldPendingCombat.test.ts`
- Commit:
  - `perf: narrow pending-combat previous-state retention`

## Execution Order

1. Tile-resolution payload narrowing
2. Hover refresh deduplication
3. Pending-combat snapshot narrowing

## Main-Thread Responsibilities

- Review each worker patch for scope drift and regressions.
- Update specs or rules only where shipped behavior or documented technical
  contracts changed.
- Run the focused verification commands after integrating each fix.
- Commit each improvement separately from this branch.
