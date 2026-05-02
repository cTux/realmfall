# Movement Cooldown Design

## Summary

Rework per-hex movement from an in-world time cost into a real-time cooldown controlled by a single-step move request boundary. A move request either approves immediate arrival on one adjacent resolved hex or denies the request with the remaining cooldown. Multi-step travel continues automatically by requesting one adjacent step after each cooldown expires. Cooldown state stays client-side and is rendered as a yellow indicator under the player icon.

## Goals

- Rename `worldClock.moveHexDurationMs` to `worldClock.moveHexCooldownMs`.
- Make one passed hex consume real wall-clock cooldown instead of advancing `worldTimeMs`.
- Stop the player on every hex during multi-step travel and wait the configured cooldown before the next step.
- Prepare a client boundary that matches a future server request/response flow for movement.
- Show movement cooldown on the Pixi canvas under the player icon.

## Non-Goals

- Do not make movement cooldown part of persisted `GameState`.
- Do not make movement cooldown advance `worldTimeMs`.
- Do not allow unresolved hexes to become walkable.
- Do not add travel interpolation between hex centers in this change.

## Current Problem

`moveToTile` currently applies one approved step and also advances `worldTimeMs`. `moveAlongSafePath` synchronously loops through every step in a safe path, so a distant click resolves the full path inside one transition. That shape cannot express a real-time wait per hex or a future server response that may reject the next step because cooldown remains active.

## Recommended Approach

Introduce a client-side movement session controller above deterministic gameplay state.

- `GameState` remains authoritative for resolved world state and arrived player position only.
- A `WorldMoveSource` interface handles one adjacent move request at a time.
- The local implementation enforces cooldown in the same request/response shape a future server will use.
- `moveToTile` becomes the deterministic application of an already-approved adjacent step.
- Multi-step click navigation becomes a queued sequence of adjacent requests separated by cooldown expiry.

This keeps the existing world rules in `src/game` and moves real-time session behavior into `src/app/App/world`.

## Architecture

### Config

- Rename `worldClock.moveHexDurationMs` to `worldClock.moveHexCooldownMs`.
- Keep the default at `1000`.
- Update config schema and exported constant names to match the new meaning.

### Shared Contract

Add a movement protocol in `packages/common` that is separate from tile resolution.

Suggested shape:

```ts
type WorldMoveRequest = {
  requestId: string;
  target: HexCoord;
};

type WorldMoveResponse =
  | {
      ok: true;
      cooldownMs: number;
    }
  | {
      ok: false;
      remainingCooldownMs: number;
    };
```

The contract is intentionally single-step. Pathfinding remains a client concern for now.

### Deterministic Gameplay Boundary

`moveToTile` stays in `packages/client/src/game/stateMovement.ts`, but its role changes:

- keep adjacency validation
- keep resolved-tile and passability validation
- keep combat, ambush, survival, respawn, and log side effects
- remove movement-driven `worldTimeMs` advancement

`moveAlongSafePath` no longer owns step execution. Safe-path traversal moves to the client movement session controller.

### Client Movement Session

Add a movement controller in the App world layer, owned by the Pixi world runtime rather than `GameState`.

It owns:

- the queued adjacent steps for the current destination
- the selected destination for auto-continue
- the current cooldown deadline
- the single scheduled retry for the next request

It does not own gameplay mutations. It asks `WorldMoveSource` for permission to move, then applies approved steps through `setGame(...moveToTile...)`.
There must be only one active cooldown deadline and one scheduled retry at a time. Any denied response replaces the deadline with the returned remaining cooldown instead of stacking timers.

### Rendering

Expose a small render input for movement cooldown progress derived from wall-clock time:

- `cooldownEndAtMs`
- `cooldownRemainingMs`
- `cooldownProgress`

Pixi renders a visible yellow indicator under the player icon while cooldown remains active. The indicator is presentational only and disappears automatically at zero.

## Behavior And Data Flow

### Single-Step Click

1. User clicks an adjacent resolved hex.
2. Client sends one `WorldMoveRequest`.
3. If the response is `ok`, the client applies `moveToTile` immediately.
4. The client starts a cooldown ending at `now + cooldownMs`.
5. The yellow indicator renders until the cooldown expires.

### Multi-Step Click

1. User clicks a farther resolved target inside the reveal radius.
2. Client computes a safe path over resolved passable hexes only.
3. The path is stored as queued adjacent steps.
4. If no cooldown is active, the first queued step is requested immediately.
5. After each approved step, the player stops on that hex, cooldown starts, and the next step is requested only after cooldown expiry.
6. Auto-continue repeats until the queue is empty or a stop condition occurs.

### Replacing Destination During Cooldown

- A new click during cooldown replaces the queued future steps.
- The active cooldown does not reset or cancel.
- When cooldown ends, the next request uses the latest queued path from the current arrived hex.

### Denied Request

- If the response is `ok: false`, the player does not move.
- The queue is preserved.
- The local cooldown deadline is set from `remainingCooldownMs`.
- The same next step is retried when the cooldown expires.

This mirrors how a future server can reject premature move attempts without changing the client flow.

## Stop Conditions

Queued travel stops cleanly when:

- the queue becomes empty
- the next step is no longer safe or resolved
- combat starts
- the player position changes externally
- the queued path is explicitly cleared
- a transport or adapter error occurs

Errors do not consume queued steps and do not move the player.

## Persistence

- Persist only the arrived player position and normal resolved world state.
- Do not persist cooldown deadline, queued path, or retry timers.
- On load, movement session state starts empty.

## Rendering Notes

- The cooldown indicator should be drawn on canvas under the player icon.
- It should use a clearly readable yellow treatment that fits the existing token style.
- The indicator uses wall-clock time from the render loop, not `worldTimeMs`.
- Unknown hex rendering remains unchanged and unresolved hexes remain blocked for movement and pathfinding.

## Testing

Add or update tests for:

- config rename and default cooldown value
- approved single-step movement moving immediately without changing `worldTimeMs`
- multi-step movement advancing exactly one hex per cooldown window
- destination replacement during cooldown updating queued continuation
- denied move responses preserving player position and retrying after the reported remaining cooldown
- cooldown indicator visibility and expiry behavior in Pixi render inputs or scene rendering tests
- unresolved hexes remaining excluded from safe-path traversal

## File Targets

Likely touch points:

- `packages/common/src/*` for the move request/response contract
- `packages/client/game.config.ts`
- `packages/client/src/game/gameConfigSchema.ts`
- `packages/client/src/game/config.ts`
- `packages/client/src/game/stateMovement.ts`
- `packages/client/src/app/App/usePixiWorld.ts`
- `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
- App world render-loop or interaction helpers that feed render-time cooldown state
- world rendering helpers for the yellow indicator

## Open Decisions Resolved In This Spec

- Movement cooldown is real-time, not `worldTimeMs`.
- Auto-continue is enabled for distant resolved-target clicks.
- Clicking a new destination during cooldown replaces the queued path.
- The player cannot step onto unresolved hexes.
