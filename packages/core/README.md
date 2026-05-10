# Realmfall Core

`@realmfall/core` contains the game runtime and shared world model used by client and server entrypoints.

## Scope

- Functional gameplay systems copied from `@realmfall/client` (pure logic only).
- Pure translation and lookup helpers for runtime systems.
- Minimal OOP facade for event-driven orchestration (`RealmfallWorld`, entities, and shared value wrappers).

## Scripts

- `pnpm --filter @realmfall/core typecheck`
- `pnpm --filter @realmfall/core build`
- `pnpm --filter @realmfall/core test`
- `pnpm --filter @realmfall/core lint`

## Usage

The package is isomorphic and does not depend on React, Pixi, or browser-only I/O helpers. It is safe for use in server-side workflows.
