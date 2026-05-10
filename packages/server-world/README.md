# Realmfall World Server

`@realmfall/server-world` is the Node service package for server-side Realmfall behavior. It starts as a thin Fastify app so future gameplay logic can move behind HTTP endpoints without replacing the package shape again.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Root `pnpm dev` and `pnpm serve` already include this package alongside the client package.

## Environment

- `HOST`
- `PORT`

## Current API

- `GET /api/version`: returns `{ "version": "<root package version with git short SHA when available>" }`

## Local Commands

- `pnpm --filter @realmfall/server-world dev`
- `pnpm --filter @realmfall/server-world build`
- `pnpm --filter @realmfall/server-world serve`
- `pnpm --filter @realmfall/server-world start`
- `pnpm --filter @realmfall/server-world typecheck`
- `pnpm --filter @realmfall/server-world lint`
- `pnpm --filter @realmfall/server-world test`

## Notes

- The endpoint reads the canonical game version from the root `package.json`.
- Build metadata appends the current git short SHA when the repository is available, matching the client build-version format.
- `pnpm --filter @realmfall/server-world dev` runs the source server entry on `https://localhost:3001` with the shared localhost certificate helper.
- `pnpm --filter @realmfall/server-world serve` runs the built server entry on the same HTTPS origin so release-like local checks use matching TLS behavior.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Versioning spec: [`docs/specs/reference/technical-solutions/version-checking/spec.md`](../../docs/specs/reference/technical-solutions/version-checking/spec.md)
