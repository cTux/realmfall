# Realmfall Common

`@realmfall/common` is the shared workspace package for cross-runtime types, schemas, and utilities that belong to both the client and the server.

## Current State

- The package currently holds the shared world tile-resolution and movement request and response contracts.
- Keep modules in this package runtime-safe for both browser and server consumers.
- Add code here only when the same module is genuinely needed on both sides.

## Local Commands

- `pnpm --filter @realmfall/common build`
- `pnpm --filter @realmfall/common typecheck`
- `pnpm --filter @realmfall/common lint`
