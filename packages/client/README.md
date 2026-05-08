# Realmfall Client

`@realmfall/client-web` is the browser game package. It owns the React app shell, Pixi world rendering, gameplay runtime, persistence, i18n, and build output for the playable client.

## Package Layout

- `src/app`: app orchestration, hydration, persistence wiring, keyboard shortcuts, and top-level hooks.
- `src/game`: gameplay rules, combat, economy, crafting, progression, world generation, and shared game types.
- `src/ui/components`: client-only React windows and presentational UI.
- `src/ui/world`: Pixi world rendering helpers, caches, and related tests.
- `src/persistence`: local save storage helpers.

## Local Commands

- `pnpm --filter @realmfall/client-web dev`
- `pnpm --filter @realmfall/client-web build`
- `pnpm --filter @realmfall/client-web serve`
- `pnpm --filter @realmfall/client-web typecheck`
- `pnpm --filter @realmfall/client-web lint`
- `pnpm --filter @realmfall/client-web test`
- `pnpm --filter @realmfall/client-web test:node`
- `pnpm --filter @realmfall/client-web test:jsdom`
- `pnpm --filter @realmfall/client-web test:all`
- `pnpm --filter @realmfall/client-web dev:storybook`
- `pnpm --filter @realmfall/client-web build:storybook`

`pnpm --filter @realmfall/client-web test` is the stable `node` project path. Use `test:all` when you explicitly want the broader jsdom suite as well.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Versioning spec: [`docs/specs/reference/technical-solutions/version-checking/spec.md`](../../docs/specs/reference/technical-solutions/version-checking/spec.md)
