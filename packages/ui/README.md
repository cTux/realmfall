# Realmfall UI

`@realmfall/ui` is the shared component library for the client package.

## Purpose

- Keep reusable visual primitives in one package.
- Keep app-specific and gameplay-specific components in `packages/client`.
- Provide Storybook stories for all components in this package.
- Build outputs with Vite library mode.

## Add a new component

1. Create a new folder under `src/components`.
2. Export the component from `src/index.ts`.
3. Create a Storybook story file at `Component.stories.tsx`.
4. Keep styles local in the component folder (`.module.scss`) when style modules are used.
5. Keep props narrow and explicit; avoid implicit `any` by typing handlers and option objects.
6. Keep side effects in small helper functions or hooks near the component folder if behavior grows.
7. Add or update tests if the component has domain behavior (not required for presentational-only components).
8. Run `pnpm --filter @realmfall/ui dev:storybook` for visual review.

## Local commands

- `pnpm --filter @realmfall/ui typecheck`
- `pnpm --filter @realmfall/ui build`
- `pnpm --filter @realmfall/ui dev:storybook`
- `pnpm --filter @realmfall/ui build:storybook`
