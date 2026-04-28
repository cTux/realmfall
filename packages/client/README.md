# Realmfall Client

`@realmfall/client` is the browser game package. It owns the React app shell, Pixi world rendering, gameplay runtime, persistence, i18n, and build output for the playable client.

## Package Layout

- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, and top-level hooks.
- `src/game`: gameplay rules, combat, economy, crafting, progression, world generation, and shared game types.
- `src/ui/components`: client-only React windows and presentational UI.
- `src/ui/world`: Pixi world rendering helpers, caches, and related tests.
- `src/persistence`: local save storage helpers.

## Local Commands

- `pnpm --filter @realmfall/client dev`
- `pnpm --filter @realmfall/client build`
- `pnpm --filter @realmfall/client typecheck`
- `pnpm --filter @realmfall/client lint`
- `pnpm --filter @realmfall/client test`
- `pnpm --filter @realmfall/client test:node`
- `pnpm --filter @realmfall/client test:jsdom`
- `pnpm --filter @realmfall/client test:all`
- `pnpm --filter @realmfall/client dev:storybook`
- `pnpm --filter @realmfall/client build:storybook`

`pnpm --filter @realmfall/client test` is the stable `node` project path. Use `test:all` when you explicitly want the broader jsdom suite as well.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Versioning spec: [`docs/specs/reference/technical-solutions/version-checking/spec.md`](../../docs/specs/reference/technical-solutions/version-checking/spec.md)
