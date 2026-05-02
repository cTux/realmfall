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
- Pixi renders a yellow cooldown indicator under the player icon from wall-clock time.

## Main Implementation Areas

- `packages/common/src/worldMovement.ts`
- `packages/client/src/app/App/world/movement/*`
- `packages/client/src/app/App/usePixiWorld.ts`
- `packages/client/src/app/App/world/pixiWorldRenderLoop.ts`
- `packages/client/src/ui/world/renderScene.ts`
