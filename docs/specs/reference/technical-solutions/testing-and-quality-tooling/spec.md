# Testing And Quality Tooling

## Scope

This spec covers the repository quality baseline and current test coverage shape.

## Current Solution

- The repository uses TypeScript strict mode, ESLint, Prettier, Vitest, Husky, and Vite.
- CI and local quality expectations center on `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Tests currently cover app bootstrapping, normalization, persistence storage helpers, world math, render behavior, time-of-day behavior, status effects, UI helpers, and core state logic.
- The codebase favors deterministic tests for gameplay and rendering calculations.

## Main Implementation Areas

- `package.json`
- `eslint.config.js`
- `prettier.config.cjs`
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
