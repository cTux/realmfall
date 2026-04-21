# Testing And Quality Tooling

## Scope

This spec covers the repository quality baseline and current test coverage shape.

## Current Solution

- The repository uses TypeScript strict mode, Oxlint, Prettier, Vitest, Husky, Vite, and Storybook.
- `pnpm test` runs Vitest through `@raegen/vite-plugin-vitest-cache`, storing reusable results in the repository-local `.tests/vitest-cache` directory so warm reruns and CI can restore unaffected test files without changing test correctness.
- `pnpm test:memory:leaks` starts the local HTTPS Vite dev server and runs `fuite` against `https://localhost:5173` with a custom dock-window toggle scenario because the app does not expose internal navigation links for the default `fuite` scenario, writing the latest JSON analysis to `.tests/memory-leaks/latest.json` for follow-up review.
- `pnpm test:memory:leaks:prod` builds the app, serves the production bundle over local HTTPS at `https://localhost:4174`, and runs the same `fuite` scenario there, writing the JSON analysis to `.tests/memory-leaks/prod.json` so memory-retention checks can be compared between dev and production behavior.
- Because the current repository is on Vitest 4, the Vite config uses a local compatibility shim for the plugin's runner and setup hooks instead of the package's older custom-pool entrypoint.
- `pnpm dev` and `pnpm serve` both run on local HTTPS using the shared localhost self-signed certificate helper, and cached certificates are regenerated automatically when they expire so secure-origin local workflows do not get stuck on stale TLS files.
- Oxlint is the enforced JavaScript and TypeScript lint gate for contributor workflow and pre-commit automation, with its canonical configuration stored in `.oxlintrc.json`.
- CI and local quality expectations center on `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Ordinary `pnpm` installs keep dependency advisory output enabled so newly disclosed package issues are visible during routine local and CI dependency refreshes.
- Oxlint is the only JavaScript and TypeScript linter shipped in the repository.
- The enforced Oxlint path includes React hook validation on TypeScript and TSX files so invalid hook usage and missing effect dependencies fail local lint and pre-commit checks instead of relying on runtime behavior.
- React 19 `useEffectEvent` callbacks stay out of effect dependency arrays, keeping the enforced hook lint path warning-free while preserving the latest imperative callback body inside long-lived listeners and playback effects.
- The Oxlint migration covers the prior ESLint rule set as closely as Oxlint currently allows, including nursery parity rules for `getter-return`, `no-undef`, and `no-unreachable`; Oxlint still does not implement `no-dupe-args` or `no-octal`.
- Storybook is used as a maintained UI fixture surface for window components, shared UI components, and aggregate entity catalogs for items, enemies, and structures.
- Storybook preview bootstraps the `en` i18n bundle before stories run, injects the shared game-tooltip behavior for story args that expose hover callbacks, and keeps the iframe viewport vertically scrollable for tall fixture surfaces such as aggregate catalogs.
- A Storybook parity test guards that each top-level component directory in `src/ui/components` keeps at least one story and that the entity catalog stories stay connected to the live config-derived fixtures.
- Tests currently cover app bootstrapping, normalization, persistence storage helpers, world math, render behavior, time-of-day behavior, status effects, UI helpers, core state logic, and Storybook coverage expectations.
- The codebase favors deterministic tests for gameplay and rendering calculations.
- Contributor guidance now includes an explicit performance verification checklist for React rerender breadth, Pixi redraw breadth, hover hot paths, and startup chunk growth so optimization work has a repeatable review path beyond functional correctness.
- That guidance also defines lightweight budgets for routine desktop world interaction and the main startup chunks, giving contributors a small regression envelope to compare against during reviews and build checks.
- The pull-request workflow enforces startup delivery budgets through `pnpm build:budget`, which runs a production build, reads the Vite manifest, and fails if the bootstrap graph or its key chunks grow past the current thresholds.
- Vite keeps the gameplay runtime under an explicit `state` manual chunk so the bootstrap graph and budget checks do not drift when Rolldown would otherwise rename that shared chunk based on a smaller helper module.
- Non-blocking startup chrome such as the version-status overlay stays deferred behind a lazy chunk so polling and refresh affordances do not enlarge the first-interaction bootstrap graph.
- Repeated localized content families, such as expansion recipe descriptions that vary only by item slot, keep concise shared phrasing so locale growth does not consume startup budget headroom unnecessarily.
- The current startup bundle thresholds are derived from the live production build graph: `index` `4.743 kB`, `App` `78.900 kB`, `background-audio` `54.420 kB`, `react-core` `8.689 kB` when emitted separately, `react-dom-vendor` `199.966 kB`, `state` `532.132 kB`, `en` `109.450 kB`, `pixi` `549.560 kB`, and `1.510000 MB` for total startup JS.
- The pull-request workflow restores and saves `.tests/vitest-cache` with `actions/cache` before the test step so CI warm runs can reuse valid cached results across workflow executions.
- The pull-request workflow declares explicit read-only `contents: read` permissions and keeps checkout credentials disabled because the job only installs dependencies and runs verification.
- Dependency refresh automation now uses the dedicated `Dependency Update Workflow` path, where the mutating scripts rewrite dependency ranges, refresh the lockfile, and run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before any commit or PR publication step.
- The scheduled dependency-update workflow bootstraps its toolchain with SHA-pinned GitHub Actions and the repo-pinned `pnpm` version, runs `pnpm i --no-frozen-lockfile`, delegates the refresh and sanity-check sequence to `pnpm update:minor -- --no-commit`, audits the refreshed tree with read-only `pnpm audit --json`, and then stages the dependency manifests for PR publication.
- The scheduled dependency-update workflow declares explicit `contents: write` and `pull-requests: write` permissions, keeps checkout credentials disabled, and uses the GitHub CLI to commit, push, and create or update the dependency PR instead of delegating that write path to a third-party action.
- Before the scheduled dependency-update workflow force-pushes the reusable `dependencies-update` branch with `--force-with-lease`, it refreshes `origin/dependencies-update` so the lease compares against current remote state and later runs can update the existing PR branch reliably.
- The pre-commit workflow enforces version progression through `pnpm check:version`, which blocks commits unless `package.json` advances by patch version relative to `HEAD`.
- The pre-commit workflow formats staged Prettier-supported files first, then scopes Oxlint auto-fixes to staged JavaScript and TypeScript files, scopes Stylelint to staged `src` CSS and SCSS files, and scopes Vitest to tests related to staged source files, runtime JSON content, or test files.
- The pre-push workflow now owns the full-project `pnpm typecheck` gate so routine commits stay focused on fast staged checks while pushes validate the whole repository type surface.
- A staged `package.json` diff that changes only the `version` field stays on the scoped pre-commit path, so routine commit-version bumps do not trigger the full test suite by themselves.
- When staged changes touch shared test inputs such as `pnpm-lock.yaml`, `vite.config.ts`, TypeScript config, or `src/test/setup.ts`, or when `package.json` changes beyond the `version` field, the pre-commit workflow stays on staged checks and the pre-push workflow runs the full `pnpm test` suite instead of charging every commit for repository-wide verification.
- The pre-push workflow also runs `pnpm build`, keeping full-repository runtime validation near publication while leaving commit-time hooks focused on staged changes.
- Slow app integration tests that rely on lazy chunks, timer advancement, or full render cycles set explicit per-test timeouts so hook and CI runs do not fail on default five-second limits under heavier suite load.
- Shared Vitest setup stubs `HTMLCanvasElement.getContext('2d')` under jsdom so Pixi- and canvas-adjacent tests run without repeated not-implemented warnings in the test output.
- Contributors can force a cold Vitest run by deleting `.tests/vitest-cache`; when the directory is absent, the next `pnpm test` run recreates it automatically.
- The staged-quality and pre-push runners invoke `git` directly and route `pnpm` through its Node entrypoint when `npm_execpath` is available, while falling back to the bundled `pnpm.cjs` Node entrypoint on Windows when a script runs outside `pnpm run`.
- The memory-leak runner uses the same `pnpm` entrypoint path instead of shelling through `cmd.exe`, keeping its browser-test arguments out of Windows shell parsing.

## Main Implementation Areas

- `package.json`
- `scripts/check-bundle-budget.mjs`
- `scripts/check-bundle-budget.helpers.mjs`
- `scripts/check-package-version.mjs`
- `scripts/dependency-updates.mjs`
- `scripts/dependency-updates.helpers.mjs`
- `scripts/fuite-dock-toggle-scenario.mjs`
- `scripts/pnpm-command.mjs`
- `scripts/run-pre-push-quality.mjs`
- `scripts/run-memory-leak-test.mjs`
- `scripts/run-staged-quality.mjs`
- `.oxlintrc.json`
- `.husky/pre-push`
- `prettier.config.cjs`
- `src/ui/components/**/*.stories.tsx`
- `.storybook/preview.ts`
- `.storybook/preview.scss`
- `src/ui/components/storybook/storybookPreview.tsx`
- `src/ui/components/storybookCoverage.test.ts`
- `src/ui/components/storybook/storybookPreview.test.tsx`
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
- `.github/workflows/pull-request.yml`
- `scripts/vitest-cache/*.mjs`
- `vite.config.ts`
