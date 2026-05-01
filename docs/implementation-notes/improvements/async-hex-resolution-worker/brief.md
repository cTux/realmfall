# Async Hex Resolution Worker

This note captures the approved transient design for moving visible-world hex
resolution off the main thread while keeping gameplay authoritative on resolved
tiles only.

## Goal

Reduce movement lag caused by synchronous hex generation and content assembly.
Movement should remain immediate from the player's perspective, unresolved
visible frontier hexes should appear as unknown placeholders, and the client
should use a request/response boundary that can later swap from worker-backed
resolution to server-backed resolution.

## Approved Decisions

- Keep `GameState.tiles` resolved-only and authoritative.
- Allow movement only onto resolved adjacent hexes.
- Treat unresolved visible frontier hexes as view-only unknown hexes.
- Use `easy-web-worker` for the worker transport.
- Use `easy-cancelable-promise` to cancel stale frontier requests.
- Add a shared tile resolution request/response contract in
  `packages/common/src`.
- Add `worldClock.moveHexDurationMs` to `packages/client/game.config.ts` with
  the approved value `1000ms`.
- Apply that `1000ms` cost as in-game `worldTimeMs`, not as a blocking real-time
  delay.

## Architecture

- `GameState.tiles` remains the canonical resolved tile store used by gameplay,
  persistence, and mutations.
- Add a client-only visible resolution overlay keyed by hex coord with states
  such as `resolved` and `pending`.
- Add a shared `TileResolutionSource` boundary in the client so the visible-ring
  requester does not care whether the data comes from a worker or a future
  server adapter.
- Implement the first `TileResolutionSource` with a web worker that resolves
  deterministic tile payload batches for requested coords.
- Move deterministic tile generation and tile-payload assembly into pure helpers
  that can be reused by the worker, tests, and any later server endpoint.

## Data Flow

- On bootstrap and after each successful move, the client recomputes the
  visible ring around the player.
- Visible coords missing from `GameState.tiles` and not already in flight are
  marked `pending` in the client-only overlay and requested as one batch.
- Each request carries a request id and cancelable promise wrapper so obsolete
  frontier requests can be canceled when the player moves again.
- Late or stale responses are ignored by request id even if a worker posts them
  after cancellation.
- Resolved payloads merge into authoritative caches:
  - tile payloads enter `game.tiles`
  - generated enemies are inserted only when that enemy id is not already
    present in `game.enemies`
- The visible overlay clears `pending` state as each coord resolves.

## Unknown Hex Behavior

- Unknown hexes render with no terrain background image.
- Unknown hexes render the
  `packages/client/src/assets/game-icons/delapouite/perspective-dice-six-faces-random.svg`
  icon.
- Unknown hexes do not expose actionable hover tooltips, safe-path traversal,
  or click-to-move targets.
- When a hex resolves, terrain background fades in smoothly.
- When a hex resolves with visible content, the unknown icon crossfades to the
  resolved marker.
- When a hex resolves without visible content, the unknown icon fades out.

## Gameplay Rules

- Pathfinding excludes unresolved coords completely.
- Adjacent unresolved hexes cannot be stepped onto.
- Multi-step safe paths can traverse only resolved passable coords and resolved
  non-blocking intermediate tiles.
- Movement remains immediate in control flow: a successful move applies at once
  rather than waiting for a real-time delay.
- Each successful single-hex movement step increases `worldTimeMs` by
  `GAME_CONFIG.worldClock.moveHexDurationMs`.
- Safe-path travel pays that movement-time cost once per resolved step.
- Movement-time updates must keep `game.worldTimeMs` and the live
  `worldTimeMsRef` synchronized so logs, world clock UI, day or night
  transitions, status processing, and combat timing do not drift.

## Rendering And Interaction Changes

- World rendering, hover, click navigation, and hex-info reads must stop using
  synchronous `buildTile(...)` fallback generation for unresolved frontier
  coords.
- Claim-border checks, world-boss footprint checks, hover tooltips, and visible
  marker derivation should read resolved data plus the overlay state only.
- The render token and visible-tile reuse logic should treat `pending` as part
  of the visible presentation state so unknown-to-resolved transitions redraw
  correctly.
- The initial visible viewport should request and render unknown hexes first,
  then reveal resolved backgrounds and markers without blocking player input.

## Failure Handling

- Worker bootstrap is an optimization, not a hard dependency.
- If the worker fails to start or a resolution batch errors, the client falls
  back behind the same `TileResolutionSource` interface to a local synchronous
  resolver so the game remains playable.
- Unknown state is never persisted in saves.
- On load, the client reconstructs pending visible frontier requests from the
  current player position and resolved save data.

## Verification Direction

- Add gameplay tests that prove unresolved hexes block pathfinding and direct
  movement.
- Add gameplay tests that prove the movement-time config advances
  `worldTimeMs` by `1000ms` per successful step.
- Add worker or coordinator tests for batch construction, cancellation,
  stale-response rejection, and merge behavior.
- Add render tests that prove unknown hexes show no terrain background, show the
  approved random-dice icon, and transition to resolved visuals correctly.
- Re-run typecheck, lint, test, and strict build-budget validation after the
  implementation work because the change affects gameplay, world rendering, and
  bundle shape.

## Canonical References

- `packages/client/src/game/world.ts`
- `packages/client/src/game/stateWorldQueries.ts`
- `packages/client/src/game/stateMovement.ts`
- `packages/client/src/game/statePathfinding.ts`
- `packages/client/src/ui/world/`
- `packages/client/src/app/App/world/`
- `packages/client/src/app/App/usePixiWorld.ts`
- `packages/client/src/app/App/hooks/useAppWorldClock.ts`
- `packages/common/src/`
- `docs/rules/10-architecture.md`
- `docs/rules/40-pixi-performance.md`
- `docs/rules/50-build-and-bundle.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
