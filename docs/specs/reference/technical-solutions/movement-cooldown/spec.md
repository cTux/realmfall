# Movement Cooldown

## Scope

This spec covers the client-side movement request boundary, real-time cooldown queueing, and Pixi cooldown rendering.

## Current Solution

- World movement uses a shared one-step request and response contract from `@realmfall/common`.
- The local move source returns either `ok: true` with `cooldownMs` or `ok: false` with `remainingCooldownMs`.
- The App world layer owns queued movement, the cooldown deadline, and retry scheduling outside deterministic `GameState`.
- Approved steps apply immediately through `moveToTile` and do not advance `worldTimeMs`.
- Multi-step travel auto-continues by requesting the next adjacent step after the active cooldown expires.
- Clicking a new destination during cooldown replaces queued continuation without resetting the active cooldown.
- Multi-step queued travel suppresses automatic `hexInfo`, recipe-book, and loot-window opening on intermediate transit hexes.
- Replacing the queued destination during cooldown updates the final eligible destination and does not replay window opens from the abandoned path.
- If a queued hostile destination resolves into staged combat, the remaining queue clears immediately and the handoff moves into the combat-intro sequence instead of continuing travel.
- Hostile-click encounters that auto-step onto their preserved hostile target after victory seed the same normal movement cooldown controller as any other approved one-hex move, and the follow-up transition carries the held combat-lunge offset into the full-duration hex slide.
- Roaming dungeon enemies patrol and chase on the same wall-clock cooldown duration as player movement, and chase contact uses the same staged arrival, lunge, and delayed combat-start sequence as player-triggered hostile clicks.
- Pixi renders a yellow outer cooldown arc from wall-clock time that leans directly on the player MP ring with no gap, and roaming dungeon enemies reuse that same touching outer-ring presentation on revealed tiles during their movement cooldown.

## Main Implementation Areas

- `packages/common/src/worldMovement.ts`
- `packages/client/src/app/App/world/movement/*`
- `packages/client/src/app/App/usePixiWorld.ts`
- `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
- `packages/client/src/ui/world/renderScene.ts`
