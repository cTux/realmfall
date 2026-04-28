# Realmfall Server

`@realmfall/server` is the Node service package for server-side Realmfall behavior. It starts as a thin Fastify app so future gameplay logic can move behind HTTP endpoints without replacing the package shape again.

## Current API

- `GET /api/version`: returns `{ "version": "<root package version with git short SHA when available>" }`

## Local Commands

- `pnpm --filter @realmfall/server dev`
- `pnpm --filter @realmfall/server build`
- `pnpm --filter @realmfall/server start`
- `pnpm --filter @realmfall/server typecheck`
- `pnpm --filter @realmfall/server lint`
- `pnpm --filter @realmfall/server test`

## Notes

- The endpoint reads the canonical game version from the root `package.json`.
- Build metadata appends the current git short SHA when the repository is available, matching the client build-version format.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Versioning spec: [`docs/specs/reference/technical-solutions/version-checking/spec.md`](../../docs/specs/reference/technical-solutions/version-checking/spec.md)
