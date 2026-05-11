# Realmfall Core

`@realmfall/core` contains the canonical game runtime and shared world model used by client, server, and gameplay-focused tests.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Keep this package isomorphic. Do not introduce React, Pixi, Vite asset-loader, or browser-only I/O dependencies here.
- Import canonical gameplay helpers from `@realmfall/core/game/*`. Keep compatibility facades and client-only gameplay test helpers in `packages/client-web/src/game`.

## Scope

- Canonical gameplay systems, world state helpers, and pure runtime rules consumed directly from `@realmfall/core/game/*`.
- Pure translation and lookup helpers for runtime systems.
- Minimal OOP facade for event-driven orchestration (`RealmfallWorld`, entities, and shared value wrappers).

## Package Layout

- `src/core.config.ts`: canonical balance and world-tuning config for the shared runtime.
- `src/core`: runtime-agnostic shared helpers and low-level support modules.
- `src/game`: canonical gameplay systems, state transitions, world generation, content registries, and testkits.
- `src/i18n`: shared translation-facing runtime helpers and contracts.

## Scripts

- `pnpm --filter @realmfall/core typecheck`
- `pnpm --filter @realmfall/core build`
- `pnpm --filter @realmfall/core test`
- `pnpm --filter @realmfall/core lint`

## Usage

The package is isomorphic and does not depend on React, Pixi, or browser-only I/O helpers. It is safe for use in server-side workflows, and non-game client modules should import gameplay helpers from `@realmfall/core/game/*` instead of reaching into `packages/client-web/src/game`.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Gameplay specs index: [`docs/specs/reference/gameplay-features/README.md`](../../docs/specs/reference/gameplay-features/README.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Combat system implementation spec: [`docs/specs/reference/technical-solutions/combat-system-implementation/spec.md`](../../docs/specs/reference/technical-solutions/combat-system-implementation/spec.md)
- Content ids and tags spec: [`docs/specs/reference/technical-solutions/content-ids-and-tags/spec.md`](../../docs/specs/reference/technical-solutions/content-ids-and-tags/spec.md)
- Internationalization spec: [`docs/specs/reference/technical-solutions/internationalization/spec.md`](../../docs/specs/reference/technical-solutions/internationalization/spec.md)
