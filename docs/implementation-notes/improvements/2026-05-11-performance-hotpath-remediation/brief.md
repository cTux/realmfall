# Performance Hotpath Remediation Brief

## Scope

- Repo: `realmfall`
- Audit date: `2026-05-11`
- Focus: Pixi-adjacent worker payloads, hover invalidation, and render-lifecycle state retention on the client hot path
- Evidence: source review against `useWorldTileResolutionLifecycle`, hover-analysis worker orchestration, pending-combat lifecycle wiring, and the current scoped rules plus technical specs

## Selected Fixes

1. `packages/client/src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.ts`
   currently forwards the full `game.tiles` map as `resolvedTiles` even though
   the async tile-resolution spec describes a visible-frontier payload. This
   widens worker sync cloning on every frontier refresh.

2. `packages/client/src/app/App/world/pixiWorldHoverInteractions.ts`
   refreshes active hover analysis whenever the broad hover inputs change by
   container identity, even when the nearby tile and enemy slice that the hover
   worker consumes is unchanged. That clears hover cache state and repeats
   worker sync work on a user-facing path.

3. `packages/client/src/app/App/usePixiWorld.ts` and
   `packages/client/src/app/App/world/usePixiWorldPendingCombatLifecycle.ts`
   retain the full previous `GameState` only to read the previous player coord
   and the previous combat engagement auto-step guard fields. That keeps broad
   state reachable on a render-adjacent lifecycle path for no runtime benefit.

## Deferred For A Later Pass

- Shared UI barrel and startup-chunk fan-in are already documented in other
  active performance workspaces and are intentionally not mixed into this
  hotpath-focused remediation pass.
- Minor lazy-ref cleanup such as `useRef(createBackgroundMusicCycleState())`
  remains low leverage compared to the three worker and render-path fixes above.
