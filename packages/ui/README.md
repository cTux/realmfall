# Realmfall UI

`@realmfall/ui-react` is the shared component library for the client package.

## Purpose

- Keep reusable visual primitives in one package.
- Keep shared reusable controls in `packages/ui` even when they render gameplay-aware data.
- Keep app orchestration and client-only window shells in `packages/client`.
- Provide Storybook stories for all components in this package.
- Build outputs with Vite library mode.
- Keep shared helper modules in `packages/ui/src/*` package-owned; do not re-export `packages/client/src/ui/*` helpers through this package.

## Add a new component

1. Create a new folder under `src/components`.
2. Export the component from `src/index.ts`.
3. Create a Storybook story file at `Component.stories.tsx`.
4. If the shared component needs existing client-owned i18n or display-only helpers, add a narrow bridge module under `src` instead of pointing stories or components at ad hoc deep relative paths.
5. Keep styles local in the component folder (`.module.scss`) when style modules are used.
6. Keep props narrow and explicit; display-only shared components should accept structural data instead of importing full client registries or client-only types just to render a label or key.
7. Shared item-aware controls should own their structural item or slot view contracts in `packages/ui/src/game`, and that subtree should stay UI-owned rather than re-exporting `packages/client/src/game/content/*`.
8. `packages/ui/src/game/__tests__/boundary.spec.test.ts` enforces the package boundary across `packages/ui/src/**`. Keep any client-owned bridge modules explicit and narrowly scoped.
9. Keep shared formatting, tooltip, icon, and icon-resolution helpers local to `packages/ui/src/*` when the shared controls depend on them.
10. When a shared Storybook story only needs representative gameplay-shaped items, prefer local fixture objects or existing Storybook fixtures instead of routing through `packages/ui/src/game` into client content builders.
11. Keep side effects in small helper functions or hooks near the component folder if behavior grows.
12. Add or update tests if the component has domain behavior (not required for presentational-only components).
13. Run `pnpm --filter @realmfall/ui-react dev:storybook` for visual review.

## Local commands

- `pnpm --filter @realmfall/ui-react typecheck`
- `pnpm --filter @realmfall/ui-react lint`
- `pnpm --filter @realmfall/ui-react build`
- `pnpm --filter @realmfall/ui-react test`
- `pnpm --filter @realmfall/ui-react test:jsdom`
- `pnpm --filter @realmfall/ui-react dev:storybook`
- `pnpm --filter @realmfall/ui-react build:storybook`
