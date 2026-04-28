# Realmfall UI

`@realmfall/ui` is the shared component library for the client package.

## Purpose

- Keep reusable visual primitives in one package.
- Keep shared reusable controls in `packages/ui` even when they render gameplay-aware data.
- Keep app orchestration and client-only window shells in `packages/client`.
- Provide Storybook stories for all components in this package.
- Build outputs with Vite library mode.

## Add a new component

1. Create a new folder under `src/components`.
2. Export the component from `src/index.ts`.
3. Create a Storybook story file at `Component.stories.tsx`.
4. If the shared component needs existing client-owned i18n, gameplay, or fixture helpers, add a narrow bridge module under `src` instead of pointing stories or components at ad hoc deep relative paths.
5. Keep styles local in the component folder (`.module.scss`) when style modules are used.
6. Keep props narrow and explicit; avoid implicit `any` by typing handlers and option objects.
7. Keep side effects in small helper functions or hooks near the component folder if behavior grows.
8. Add or update tests if the component has domain behavior (not required for presentational-only components).
9. Run `pnpm --filter @realmfall/ui dev:storybook` for visual review.

## Local commands

- `pnpm --filter @realmfall/ui typecheck`
- `pnpm --filter @realmfall/ui lint`
- `pnpm --filter @realmfall/ui build`
- `pnpm --filter @realmfall/ui dev:storybook`
- `pnpm --filter @realmfall/ui build:storybook`
