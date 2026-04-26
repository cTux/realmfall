# UI Component Library

## Scope

This spec covers the reusable UI component library in `packages/ui`, its Storybook workflow, and the client-side adoption pattern.

## Current Solution

- `packages/ui` is a dedicated library package containing reusable UI primitives for `packages/client`.
- The package is built through Vite library mode using `packages/ui/vite.config.ts`.
- The package includes Storybook coverage for each exported component in `packages/ui`.
- `packages/client` imports shared components directly from `@realmfall/ui` at their call sites.
- `packages/ui` is the single shared export surface for reusable UI primitives via `packages/ui/src/index.ts`.
- `packages/client` receives the library through a workspace dependency (`@realmfall/ui`) added in
  `packages/client/package.json`.
- New shared component guidance lives in `packages/ui/README.md`:
  - place each component under `src/components`
  - export it from `src/index.ts`
  - add a Storybook story file
  - keep component behavior and styles local

## Files

- `packages/ui/package.json`
- `packages/ui/vite.config.ts`
- `packages/ui/tsconfig.json`
- `packages/ui/tsconfig.build.json`
- `packages/ui/tsconfig.node.json`
- `packages/ui/.storybook/main.ts`
- `packages/ui/.storybook/preview.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/components/LoadingSpinner/*`
- `packages/ui/src/components/Switch/*`
- `packages/ui/src/components/Tabs/*`
- `package.json`
- `packages/client/package.json`
- `packages/client/src/ui/components/LoadingSpinner.tsx`
- `packages/client/src/ui/components/Switch/Switch.tsx`
- `packages/client/src/ui/components/Tabs/Tabs.tsx`
