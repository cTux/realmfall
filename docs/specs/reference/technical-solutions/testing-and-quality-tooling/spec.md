# Testing And Quality Tooling

## Scope

This spec covers the repository quality baseline and current test coverage shape.

## Current Solution

- The repository uses TypeScript strict mode, ESLint, Prettier, Vitest, Husky, Vite, and Storybook.
- CI and local quality expectations center on `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Storybook is used as a maintained UI fixture surface for window components, shared UI components, and aggregate entity catalogs for items, enemies, and structures.
- A Storybook parity test guards that each top-level component directory in `src/ui/components` keeps at least one story and that the entity catalog stories stay connected to the live config-derived fixtures.
- Tests currently cover app bootstrapping, normalization, persistence storage helpers, world math, render behavior, time-of-day behavior, status effects, UI helpers, core state logic, and Storybook coverage expectations.
- The codebase favors deterministic tests for gameplay and rendering calculations.

## Main Implementation Areas

- `package.json`
- `eslint.config.js`
- `prettier.config.cjs`
- `src/ui/components/**/*.stories.tsx`
- `src/ui/components/storybookCoverage.test.ts`
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
