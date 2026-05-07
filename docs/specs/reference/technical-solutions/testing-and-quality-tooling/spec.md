# Testing And Quality Tooling

## Scope

This spec covers the repository quality baseline and current test coverage shape.

## Current Solution

- Client-side `src/*` and `scripts/*` paths below live under `packages/client/` after the monorepo split unless the path explicitly names another package.
- The repository uses TypeScript strict mode, Oxlint, Stylelint, Prettier, Vitest, Husky, Vite, and Storybook.
- Root verification entrypoints cover the shared workspace typecheck, lint, build, and automated test paths across `packages/common`, `packages/server`, `packages/ui`, and `packages/client`, while package-local scripts keep narrower verification available for iteration.
- Client Vitest coverage is split between a DOM-free `node` project for gameplay, persistence, i18n, and script tests and a `jsdom` project for React, Pixi, and other browser-surface tests.
- Dedicated memory-leak scripts run a custom `fuite` dock-window toggle scenario against local HTTPS dev and production builds, writing JSON analysis snapshots into `.tests/memory-leaks/`.
- The browser performance harness activates only when `?perf=1`, `?realmfallPerf=1`, `localStorage["realmfall:perf"] = "1"`, or a test-only forced install is present, exposing `window.__REALMFALL_PERF__` with a `snapshot()` API for startup marks, React commits, Pixi render-pass counters, scenario timings, long tasks, and long animation frames.
- The harness records bootstrap milestones from `src/main.tsx`, the first ready app shell mark, optional React Profiler commits around `App`, and Pixi render counters from the world render facade, so manual browser checks can correlate window toggles, hover paths, and map redraw breadth without enabling collection for normal sessions.
- `pnpm dev` and `pnpm serve` both run on local HTTPS using the shared localhost self-signed certificate helper, and cached certificates are regenerated automatically when they expire so secure-origin local workflows do not get stuck on stale TLS files.
- The repository toolchain is pinned to Node `v25.9.0` through `.nvmrc`, with `package.json` `engines` set to `25.x` and GitHub Actions reading the same version file, keeping local commands, CI, and scheduled automation on the same runtime line.
- Oxlint is the enforced JavaScript and TypeScript lint gate, with its canonical configuration stored in `.oxlintrc.json`.
- Oxlint enforces React hook rules for TypeScript and TSX sources, including `react/rules-of-hooks` and `react/exhaustive-deps` as error-level checks.
- Stylelint stays on the shared repository lint path beside Oxlint, while `pnpm lint:css` remains available for stylesheet-only local checks.
- The Husky pre-commit hook runs the shared commit-version bump before staged quality checks and then runs the repository-wide validation path (`typecheck`, `lint`, `test`, and `build`) so plain `git commit` receives the same patch-version increment and verification scope as the repository commit helper.
- The Husky pre-push hook is intentionally a no-op because the repository-wide validation path runs during pre-commit.
- `pnpm git:deploy` builds the Vite app with the `/realmfall/` GitHub Pages base path, writes `.nojekyll`, publishes the generated `dist/` contents through a temporary `gh-pages` worktree, and pushes with a lease-aware plan when the remote branch already exists.
- Ordinary `pnpm` installs keep dependency advisory output enabled so newly disclosed package issues are visible during routine local and CI dependency refreshes.
- The Oxlint migration covers the prior ESLint rule set as closely as Oxlint currently allows, including nursery parity rules for `getter-return`, `no-undef`, and `no-unreachable`; `no-dupe-args` and `no-octal` remain outside the current Oxlint rule set.
- Storybook is used as a maintained UI fixture surface for window components, shared UI components, and aggregate entity catalogs for items, enemies, and structures.
- Storybook preview bootstraps the `en` i18n bundle before stories run, injects the shared game-tooltip behavior for story args that expose hover callbacks, and keeps the iframe viewport vertically scrollable for tall fixture surfaces such as aggregate catalogs.
- A Storybook parity test guards that each top-level client component directory in `packages/client/src/ui/components` and each top-level standalone PascalCase component file keep a story, while shared component directories migrated into `packages/ui/src/components` can satisfy that parity through the shared package story tree. Helper JSX modules outside that component naming convention are not treated as standalone Storybook surfaces, and the same test also keeps the entity catalog stories connected to the live config-derived fixtures.
- Tests currently cover app bootstrapping, normalization, persistence storage helpers, world math, render behavior, time-of-day behavior, status effects, UI helpers, core state logic, and Storybook coverage expectations.
- Broad gameplay-state coverage is split across focused suites such as `src/game/stateExploration.test.ts`, `src/game/stateSurvival.test.ts`, `src/game/stateCombatEncounters.test.ts`, `src/game/stateCombatCadence.test.ts`, `src/game/stateCombatRecovery.test.ts`, `src/game/stateWorldEvents.test.ts`, `src/game/stateItemsAndProgression.test.ts`, `src/game/stateCraftingRecipes.test.ts`, `src/game/stateCraftingRecipePages.test.ts`, `src/game/stateCraftingRecipeBook.test.ts`, `src/game/stateInventoryActions.test.ts`, `src/game/stateWorldClaims.test.ts`, `src/game/stateWorldGatheringAndHome.test.ts`, `src/game/stateWorldBossAndFactionActions.test.ts`, and `src/game/stateWorldQueries.test.ts` instead of one `state.test.ts` umbrella file.
- Broad UI coverage is split across focused suites such as `src/ui/uiVisualHelpers.test.tsx`, `src/ui/uiTooltipItemContent.test.tsx`, `src/ui/uiTooltipEntityContent.test.tsx`, `src/ui/uiTooltipAbilityContent.test.tsx`, `src/ui/uiWindowStaticMarkup.test.tsx`, `src/ui/uiHexInfoMarkup.test.tsx`, `src/ui/uiHeroAndLog.test.tsx`, `src/ui/uiTooltipBehavior.test.tsx`, `src/ui/uiRecipeBook.test.tsx`, `src/ui/uiRecipeBookWindow.test.tsx`, `src/ui/uiWindowInteractions.test.tsx`, `src/ui/uiWindowResizing.test.tsx`, and `src/ui/uiWindowShells.test.tsx` instead of one umbrella component test file.
- UI, renderer, Storybook, and helper tests that only need builders, selectors, or shared types now import `src/game/stateFactory.ts`, `src/game/stateSelectors.ts`, or `src/game/stateTypes.ts` instead of the mutation-heavy `src/game/state.ts`, which keeps `vitest related` on gameplay mutation files scoped to the tests that actually exercise those entrypoints.
- Tests that exercise typed gameplay helpers use complete domain fixtures or builder-backed objects instead of partial literals, so `pnpm typecheck` catches real integration drift rather than test-only shape shortcuts.
- `scripts/tests/app-ui-state-boundaries.test.ts` guards that non-test modules under `src/app` and `src/ui` do not drift back to broad `src/game/state.ts` imports now that the remaining world-clock and movement entrypoints live in focused gameplay modules.
- World-render coverage is split across focused suites such as `src/ui/world/renderSceneCache.test.ts`, `src/ui/world/renderSceneEnemyMarkers.test.ts`, `src/ui/world/renderSceneClaimMarkers.test.ts`, `src/ui/world/renderSceneWorldBossMarkers.test.ts`, `src/ui/world/renderSceneInteractions.test.ts`, `src/ui/world/renderSceneAtmosphere.test.ts`, `src/ui/world/renderSceneReuse.test.ts`, `src/ui/world/renderSceneCacheInvalidation.test.ts`, `src/ui/world/renderSceneMarkerAnimations.test.ts`, and `src/ui/world/renderScenePools.test.ts` instead of one renderer umbrella file.
- The codebase favors deterministic tests for gameplay and rendering calculations.
- Shared browser-test helpers such as `src/ui/uiTestHelpers.tsx`, `src/ui/uiRecipeBookTestHelpers.tsx`, `src/ui/uiTooltipContentTestHelpers.ts`, and `src/ui/uiWindowMarkupTestHelpers.tsx` keep jsdom host setup and fixture wiring out of the split suites, while gameplay helpers such as `src/game/stateCombatTestHelpers.ts`, `src/game/stateCraftingTestHelpers.ts`, and `src/game/stateWorldActionsTestHelpers.ts` keep repeated seed setup out of the smaller `node` suites.
- The pull-request and master-branch validation workflows run `pnpm build` in a dedicated production-build job after the typecheck/lint and node-test jobs, keeping build failures isolated from the rest of the validation matrix.
- `vite.config.ts` stays as the top-level assembly file, while chunk routing, localhost HTTPS certificate management, plugin wiring, and Vitest project definitions live in focused `vite/chunks.ts`, `vite/https.ts`, `vite/plugins.ts`, and `vite/testProjects.ts` helpers.
- React Compiler is enabled from `vite/plugins.ts` through `@vitejs/plugin-react`'s `reactCompilerPreset()` helper and `@rolldown/plugin-babel`, matching the installed Vite React plugin's React Compiler integration path for React 19 builds.
- `scripts/tests/vite-plugins.test.ts` guards that React Compiler remains wired into the Vite plugin chain when the helper setup changes.
- `vite/chunks.ts` routes Vite build runtime helpers into a small `build-runtime` chunk, routes direct `howler` imports into the `background-audio` lazy chunk, and filters Pixi plus background-audio chunks out of modulepreload dependency hints so those domain runtimes load from the feature path that uses them.
- The shared Vite build runner filters the known Rolldown plugin-timing warnings for `vite:asset`, the explicit duplicate-deps audit plugin, and the explicit visualizer audit plugin so routine builds stay focused on actionable failures while unexpected plugin timing warnings remain visible.
- JSON assets that participate in bootstrap loading, including the bootstrap locale bundle, are committed with LF line endings so emitted asset sizes remain stable across platforms.
- Production builds minify emitted JSON assets such as the bootstrap locale bundle, preserving readable source files while keeping shipped JSON payloads compact.
- Vite keeps the gameplay runtime under an explicit `state` manual chunk, including directly imported gameplay mutation helpers, so the bootstrap graph does not drift when Rolldown would otherwise place those modules in the app shell chunk or rename the shared chunk based on a smaller helper module.
- The Vite config raises the generic chunk-size warning limit above the repository's intentional `state` and `pixi` shared chunks so routine production builds stay focused on actionable warnings rather than a lower default threshold.
- Non-blocking startup chrome such as the version-status overlay stays deferred behind a lazy chunk so polling and refresh affordances do not enlarge the first-interaction bootstrap graph.
- Repeated localized content families, such as expansion recipe descriptions that vary only by item slot, keep concise shared phrasing so locale growth does not add duplication unnecessarily.
- The pull-request and master-branch validation workflows declare explicit read-only `contents: read` permissions, keep checkout credentials disabled, skip documentation-only diffs where applicable, run `pnpm test` in the `validate-node-test-suite` job for the server package plus the client `node` project, and keep `validate-typecheck-and-lint`, `validate-node-test-suite`, and `validate-production-build` as independent jobs.
- Dependency refresh automation uses the dedicated `Dependency Update Workflow` path, where the mutating scripts rewrite dependency ranges, refresh the lockfile, and run the full repository sanity command set before any commit or PR publication step.
- No committed GitHub Actions workflow currently publishes dependency-refresh pull requests; any future automation should continue to reuse the local dependency update scripts rather than introducing a separate mutation path.
- Slow app integration tests that rely on lazy chunks, timer advancement, or full render cycles set explicit file-level or per-test timeouts so hook and CI runs do not fail on default five-second limits under heavier suite load.
- Shared Vitest setup lives in `src/test/setup.shared.ts`, while `src/test/setup.node.ts` keeps the DOM-free project on the shared storage, fetch, and i18n bootstrap path and `src/test/setup.ts` adds the jsdom-only canvas stub for Pixi- and canvas-adjacent tests.
- The memory-leak runner uses the same `pnpm` entrypoint path instead of shelling through `cmd.exe`, keeping its browser-test arguments out of Windows shell parsing.
- Async script runners that wrap `vite`, `serve`, `pnpm`, or other nested Node processes go through a shared managed-child helper that tears down the full child process tree when the parent exits or is interrupted, preventing orphaned Windows `node.exe` processes from lingering after wrapper scripts stop.
- The duplicate-deps audit runner uses that same pnpm invocation helper on Windows instead of routing `pnpm build` through `cmd.exe`.
- Contributor command selection and hook-usage policy stay canonical in `docs/WORKFLOW.md` and `docs/rules/60-testing.md`; this spec keeps the shipped tooling architecture and coverage shape only.

## Main Implementation Areas

- `package.json`
- `scripts/build-version.helpers.ts`
- `scripts/dependency-updates.mjs`
- `scripts/dependency-updates.helpers.mjs`
- `scripts/fuite-dock-toggle-scenario.mjs`
- `scripts/managed-child-process.mjs`
- `scripts/pnpm-command.mjs`
- `scripts/run-pre-push-quality.mjs`
- `scripts/run-vite-build.helpers.mjs`
- `scripts/run-vite-build.mjs`
- `scripts/git-deploy.helpers.mjs`
- `scripts/git-deploy.mjs`
- `scripts/run-memory-leak-test.mjs`
- `scripts/run-duplicate-deps-audit.mjs`
- `scripts/run-bundle-visualizer.mjs`
- `src/performance/performanceHarness.ts`
- `scripts/run-staged-quality.mjs`
- `scripts/git-commit.mjs`
- `scripts/commit-version-bump.mjs`
- `.oxlintrc.json`
- `.husky/pre-commit`
- `.husky/pre-push`
- `prettier.config.cjs`
- `src/ui/components/**/*.stories.tsx`
- `packages/ui/src/components/**/*.stories.tsx`
- `.storybook/preview.ts`
- `.storybook/preview.scss`
- `src/ui/components/storybook/storybookPreview.tsx`
- `src/ui/components/storybookCoverage.test.ts`
- `src/ui/components/storybook/storybookPreview.test.tsx`
- `src/**/*.test.ts`
- `src/**/*.test.tsx`
- `src/test/setup.node.ts`
- `src/test/setup.shared.ts`
- `.github/workflows/pull-request-validation.yml`
- `.github/workflows/master-branch-validation.yml`
- `vite.config.ts`
- `vite/chunks.ts`
- `vite/https.ts`
- `vite/plugins.ts`
- `vite/testProjects.ts`
