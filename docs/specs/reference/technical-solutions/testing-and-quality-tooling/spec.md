# Testing And Quality Tooling

## Scope

This spec covers the repository quality baseline and current test coverage shape.

## Current Solution

- The repository uses TypeScript strict mode, Oxlint, Prettier, Vitest, Husky, Vite, and Storybook.
- Oxlint is the enforced JavaScript and TypeScript lint gate for contributor workflow and pre-commit automation, with its canonical configuration stored in `.oxlintrc.json`.
- The repository still keeps ESLint and Biome available outside the default Oxlint gate, with Biome owning the migrated ESLint-compatible arrow-return, React Hooks, and React Fast Refresh checks while ESLint remains a baseline comparison tool.
- CI and local quality expectations center on `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- A dedicated `pnpm lint:bench` command runs ESLint, Oxlint, and Biome against the same shared target set and reports repeated wall-clock timings for direct comparison.
- The Oxlint migration covers the prior ESLint rule set as closely as Oxlint currently allows, including nursery parity rules for `getter-return`, `no-undef`, and `no-unreachable`; Oxlint still does not implement `no-dupe-args` or `no-octal`.
- Storybook is used as a maintained UI fixture surface for window components, shared UI components, and aggregate entity catalogs for items, enemies, and structures.
- Storybook preview bootstraps the `en` i18n bundle before stories run, injects the shared game-tooltip behavior for story args that expose hover callbacks, and keeps the iframe viewport vertically scrollable for tall fixture surfaces such as aggregate catalogs.
- A Storybook parity test guards that each top-level component directory in `src/ui/components` keeps at least one story and that the entity catalog stories stay connected to the live config-derived fixtures.
- Tests currently cover app bootstrapping, normalization, persistence storage helpers, world math, render behavior, time-of-day behavior, status effects, UI helpers, core state logic, and Storybook coverage expectations.
- The codebase favors deterministic tests for gameplay and rendering calculations.
- Contributor guidance now includes an explicit performance verification checklist for React rerender breadth, Pixi redraw breadth, hover hot paths, and startup chunk growth so optimization work has a repeatable review path beyond functional correctness.
- That guidance also defines lightweight budgets for routine desktop world interaction and the main startup chunks, giving contributors a small regression envelope to compare against during reviews and build checks.
- The pull-request workflow enforces those startup chunk budgets through `pnpm build:budget`, which runs a production build and fails if the `index`, `react-vendor`, or `pixi` chunks grow past the current thresholds.
- The scheduled dependency-update workflow bootstraps its toolchain with `pnpm i --no-frozen-lockfile` before rewriting dependency specifiers and the lockfile, then validates the refreshed dependency set with lint, test, and build steps.
- The pre-commit workflow also enforces version progression through `pnpm check:version`, which blocks commits unless `package.json` advances by patch version relative to `HEAD`.
- The pre-commit workflow keeps full-project typecheck global but scopes Oxlint auto-fixes to staged JavaScript and TypeScript files, scopes Stylelint to staged `src` CSS and SCSS files, and scopes Vitest to tests related to staged source files, runtime JSON content, or test files.
- When staged changes touch shared test inputs such as `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, TypeScript config, or `src/test/setup.ts`, the pre-commit workflow falls back to the full `pnpm test` suite instead of a related-only run.

## Main Implementation Areas

- `package.json`
- `scripts/check-bundle-budget.mjs`
- `scripts/check-package-version.mjs`
- `scripts/run-staged-quality.mjs`
- `scripts/benchmark-linters.mjs`
- `.oxlintrc.json`
- `eslint.config.js`
- `biome.json`
- `prettier.config.cjs`
- `src/ui/components/**/*.stories.tsx`
- `.storybook/preview.ts`
- `.storybook/preview.scss`
- `src/ui/components/storybook/storybookPreview.tsx`
- `src/ui/components/storybookCoverage.test.ts`
- `src/ui/components/storybook/storybookPreview.test.tsx`
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
