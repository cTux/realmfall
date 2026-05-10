# Realmfall Common

`@realmfall/common` is the shared workspace package for cross-runtime types, schemas, and utilities that belong to both the client and the server.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Keep modules in this package runtime-safe for both browser and server consumers.
- Add code here only when the same contract or helper is genuinely shared across runtime boundaries.

## Current Modules

- `src/worldTileResolution.ts`: shared request and response contracts for async tile inspection.
- `src/worldMovement.ts`: shared request and response contracts for one-step movement resolution.

## Local Commands

- `pnpm --filter @realmfall/common build`
- `pnpm --filter @realmfall/common typecheck`
- `pnpm --filter @realmfall/common lint`

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Async world tile resolution spec: [`docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md`](../../docs/specs/reference/technical-solutions/async-world-tile-resolution/spec.md)
- Movement cooldown spec: [`docs/specs/reference/technical-solutions/movement-cooldown/spec.md`](../../docs/specs/reference/technical-solutions/movement-cooldown/spec.md)
