# Realmfall Core

`@realmfall/core` contains the canonical game runtime and shared world model used by client, server, and gameplay-focused tests.

## Scope

- Canonical gameplay systems, world state helpers, and pure runtime rules consumed directly from `@realmfall/core/game/*`.
- Pure translation and lookup helpers for runtime systems.
- Minimal OOP facade for event-driven orchestration (`RealmfallWorld`, entities, and shared value wrappers).

## Scripts

- `pnpm --filter @realmfall/core typecheck`
- `pnpm --filter @realmfall/core build`
- `pnpm --filter @realmfall/core test`
- `pnpm --filter @realmfall/core lint`

## Usage

The package is isomorphic and does not depend on React, Pixi, or browser-only I/O helpers. It is safe for use in server-side workflows, and non-game client modules should import gameplay helpers from `@realmfall/core/game/*` instead of reaching into `packages/client/src/game`.
