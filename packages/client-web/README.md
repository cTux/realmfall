# Realmfall Client

`@realmfall/client-web` is the browser game package. It owns the React app shell, Pixi world rendering, persistence, i18n, and build output for the playable client, while the canonical gameplay runtime lives in `@realmfall/core`.

Phase-one desktop support reuses this package as-is through `@realmfall/client-electron`, so Electron-specific runtime behavior should stay in the desktop shell instead of branching the web renderer.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- This package depends on `@realmfall/common`, `@realmfall/core`, and `@realmfall/ui-react` through workspace links.
- `pnpm --filter @realmfall/client-web dev` starts only the client. Use root `pnpm dev` when the local session should include `@realmfall/server-world` as well.

## Package Layout

- `src/client.config.ts`: shared client layout, sizing, transparency, and viewport config.
- `src/theme.config.ts`: shared client color and visual theme values for TS and TSX modules.
- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, and top-level hooks.
- `src/game`: compatibility facades and client-owned gameplay test helpers that forward canonical runtime imports to `@realmfall/core`.
- `src/ui/components`: client-only React windows and presentational UI.
- `src/ui/world`: Pixi world rendering helpers, caches, and related tests.
- `src/persistence`: local save storage helpers.

## Local Commands

- `pnpm --filter @realmfall/client-web dev`
- `pnpm --filter @realmfall/client-web build`
- `pnpm --filter @realmfall/client-web build:client:assets`
- `pnpm --filter @realmfall/client-web serve`
- `pnpm --filter @realmfall/client-web typecheck`
- `pnpm --filter @realmfall/client-web lint`
- `pnpm --filter @realmfall/client-web test`
- `pnpm --filter @realmfall/client-web test:node`
- `pnpm --filter @realmfall/client-web test:jsdom`
- `pnpm --filter @realmfall/client-web dev:storybook`
- `pnpm --filter @realmfall/client-web build:storybook`

`pnpm --filter @realmfall/client-web test` runs both the `jsdom` and `node` Vitest projects. Use the filtered `test:jsdom` or `test:node` commands when you want a narrower loop.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Gameplay specs index: [`docs/specs/reference/gameplay-features/README.md`](../../docs/specs/reference/gameplay-features/README.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- React app orchestration spec: [`docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`](../../docs/specs/reference/technical-solutions/react-app-orchestration/spec.md)
- Pixi rendering spec: [`docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`](../../docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md)
- Persistence spec: [`docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md`](../../docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md)
- Versioning spec: [`docs/specs/reference/technical-solutions/version-checking/spec.md`](../../docs/specs/reference/technical-solutions/version-checking/spec.md)
