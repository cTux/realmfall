# Realmfall Electron Client

`@realmfall/client-electron` is the thin desktop shell for Realmfall. It owns the Electron main process, preload boundary, and localhost serving path for the built `@realmfall/client-web` bundle. The renderer UI and gameplay runtime remain in `@realmfall/client-web` and `@realmfall/core`.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Build or run `@realmfall/client-web` through the workspace scripts; this package does not own a separate renderer implementation.

## Local Commands

- `pnpm --filter @realmfall/client-electron dev`
- `pnpm --filter @realmfall/client-electron build`
- `pnpm --filter @realmfall/client-electron build:app`
- `pnpm --filter @realmfall/client-electron dist:win`
- `pnpm --filter @realmfall/client-electron start`
- `pnpm --filter @realmfall/client-electron typecheck`
- `pnpm --filter @realmfall/client-electron lint`
- `pnpm --filter @realmfall/client-electron test`

## Notes

- Phase one is intentionally `client-web` as-is inside Electron.
- The desktop shell serves the built web client over localhost so the renderer keeps its existing HTTP-origin expectations for locale assets and `version.json`.
- `dist:win` builds `@realmfall/client-web`, compiles the Electron shell, stages the renderer bundle into `dist/client-web`, and emits the Windows installer `.exe` into a timestamped subdirectory under `release/`.
- Future local save files and Steam Cloud sync are planned follow-on work, not part of the initial shell.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Desktop shell spec: [`docs/specs/reference/technical-solutions/desktop-client-shell/spec.md`](../../docs/specs/reference/technical-solutions/desktop-client-shell/spec.md)
