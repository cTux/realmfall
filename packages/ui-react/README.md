# Realmfall UI

`@realmfall/ui-react` is the shared component library for the client package.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Consumer apps must provide the `react` and `react-dom` peer dependencies declared by this package.
- Keep runtime TypeScript imports from `packages/client-web/src` out of this package, except for the explicit Storybook helper bridge already documented by the architecture rules.

## Purpose

- Keep reusable visual primitives in one package.
- Keep shared reusable controls in `packages/ui-react` even when they render gameplay-aware data.
- Keep app orchestration and client-only window shells in `packages/client-web`.
- Provide Storybook stories for all components in this package.
- Build outputs with Vite library mode.
- Keep shared helper modules in `packages/ui-react/src/*` package-owned; do not re-export `packages/client-web/src/ui/*` helpers through this package.
- Keep the root `@realmfall/ui-react` barrel for broad shared access, but add
  narrow package subpaths for startup-adjacent consumers when a single primitive
  or helper would otherwise pull a large shared barrel chunk onto the eager app
  path.

## Add a new component

1. Create a new folder under `src/components`.
2. Export the component from `src/index.ts`.
3. Create a Storybook story file at `Component.stories.tsx`.
4. If the shared component needs existing client-owned i18n or display-only helpers, add a narrow bridge module under `src` instead of pointing stories or components at ad hoc deep relative paths.
5. Keep styles local in the component folder (`.module.scss`) when style modules are used.
6. Keep props narrow and explicit; display-only shared components should accept structural data instead of importing full client registries or client-only types just to render a label or key.
7. Shared item-aware controls should own their structural item or slot view contracts in `packages/ui-react/src/game`, and that subtree should stay UI-owned rather than re-exporting `packages/client-web/src/game/content/*`.
8. `packages/ui-react/src/game/__tests__/boundary.spec.test.ts` enforces the package boundary across `packages/ui-react/src/**`. Keep any client-owned bridge modules explicit and narrowly scoped.
9. Keep shared formatting, tooltip, icon, and icon-resolution helpers local to `packages/ui-react/src/*` when the shared controls depend on them.
10. When a shared Storybook story only needs representative gameplay-shaped items, prefer local fixture objects or existing Storybook fixtures instead of routing through `packages/ui-react/src/game` into client content builders.
11. Keep side effects in small helper functions or hooks near the component folder if behavior grows.
12. Add or update tests if the component has domain behavior (not required for presentational-only components).
13. Run `pnpm --filter @realmfall/ui-react dev:storybook` for visual review.
14. When a consumer only needs one startup-facing primitive or helper, prefer a
    dedicated export such as `@realmfall/ui-react/button`,
    `@realmfall/ui-react/tooltip`, `@realmfall/ui-react/tooltip-placement`, or
    `@realmfall/ui-react/ui-audio` instead of routing that consumer through the
    root barrel.
15. Apply the same narrow-subpath rule to deferred windows and world tooltip
    helpers. Secondary UI code should import targeted entries such as
    `@realmfall/ui-react/action-bar`, `@realmfall/ui-react/context-menu`,
    `@realmfall/ui-react/dock-panel`, `@realmfall/ui-react/item-slot`,
    `@realmfall/ui-react/formatters`, `@realmfall/ui-react/window`, and
    `@realmfall/ui-react/window-label` instead of regrowing the shared root
    barrel chunk through lazy windows.

## Local commands

- `pnpm --filter @realmfall/ui-react typecheck`
- `pnpm --filter @realmfall/ui-react lint`
- `pnpm --filter @realmfall/ui-react build`
- `pnpm --filter @realmfall/ui-react test`
- `pnpm --filter @realmfall/ui-react test:jsdom`
- `pnpm --filter @realmfall/ui-react dev:storybook`
- `pnpm --filter @realmfall/ui-react build:storybook`

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- UI component library spec: [`docs/specs/reference/technical-solutions/ui-component-library/spec.md`](../../docs/specs/reference/technical-solutions/ui-component-library/spec.md)
- Input and tooltip handling spec: [`docs/specs/reference/technical-solutions/input-and-tooltip-handling/spec.md`](../../docs/specs/reference/technical-solutions/input-and-tooltip-handling/spec.md)
- Internationalization spec: [`docs/specs/reference/technical-solutions/internationalization/spec.md`](../../docs/specs/reference/technical-solutions/internationalization/spec.md)
