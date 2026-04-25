# Testing Rules

## Testing

- Add or update tests for non-trivial gameplay, rendering math, persistence normalization, and bug-fix changes when practical.
- Every issue fix should be followed by adding or adjusting tests that cover the fixed behavior, unless the repository cannot reasonably test that path yet. In that case, document the gap explicitly.
- When a fix changes expected behavior, also update the corresponding spec requirement in the same task when the repository already documents that area.
- Favor deterministic tests for game-state changes and rendering calculations.
- Place tests in a colocated `tests/` directory for the feature or module they exercise.
- Keep test files under roughly `250` lines when practical. Split larger suites by concern instead of accumulating all coverage in one file.
- Keep DOM-free Vitest coverage on the `node` project and reserve the `jsdom` project for tests that need browser globals, React rendering, Pixi canvas behavior, or other DOM APIs.
- When adding or moving tests, choose the narrowest Vitest project that matches the runtime surface so gameplay-only changes do not pay browser-environment startup cost.
- When UI integration coverage grows beyond one broad `*.test.tsx` file, split it by surface such as recipe flows, window-shell interactions, renderer caches, or tooltip behavior instead of keeping one umbrella component suite.
- When splitting browser-surface suites, move repeated DOM host setup and dynamic-import settling into shared helpers such as `src/ui/uiTestHelpers.tsx` or feature-specific `*TestHelpers.tsx` files so smaller suites do not reintroduce the same boilerplate in parallel.
- Slow browser integration suites that intentionally exercise lazy chunks, timer advancement, or full app render cycles should set an explicit file-level or per-test Vitest timeout based on measured runtime instead of relying on default limits.
- When a suite grows into several unrelated assertions, split it by behavior slice and add a colocated domain helper such as `uiTooltipContentTestHelpers.ts`, `uiWindowMarkupTestHelpers.tsx`, or `state*TestHelpers.ts` so fixtures stay reusable without one giant umbrella file returning.
- Split broad gameplay-state suites by concern such as exploration, survival timing, combat cadence, world events, crafting, inventory actions, world actions, or item and progression flows instead of keeping one `src/game/state.test.ts` umbrella file.
- Split large Pixi renderer suites by concern such as cache invalidation, interaction overlays, marker composition, marker animation, sprite-pool behavior, or atmosphere rendering instead of keeping one `renderScene.test.ts` umbrella file.
- When tests call typed gameplay helpers such as item-action selectors, pass real domain fixtures or builder-backed objects that satisfy the full runtime type instead of partial literals that only cover the asserted field.
- Keep Storybook args, component test fixtures, and renderer mock helpers aligned with required prop and helper types whenever those contracts change so `pnpm typecheck` stays green across app, stories, and tests.
- Keep production buildability in mind, not only local dev behavior.
- When performance-sensitive behavior changes, verify both correctness and the likely rerender or redraw impact.
- When optimization work changes React, Pixi, hover handling, or bundle shape, document a concrete verification path for rerender breadth, redraw breadth, hover hot paths, and startup chunk growth instead of leaving performance validation implicit.
- Keep a coverage test for Storybook parity so component additions or removals in `src/ui/components` fail fast when corresponding stories are missing.
- Keep repository automation scripts shell-safe across platforms. Do not route staged paths, generated file lists, or other user-controlled arguments through `cmd.exe` or other shells when a direct executable or Node entrypoint invocation can run the tool instead.
- When repository automation scripts spawn long-lived or nested child processes, clean up the full child process tree when the parent script exits or is interrupted. On Windows, terminate the tree instead of only the direct child so `pnpm`, `vite`, `serve`, or browser helpers do not remain in memory after the wrapper script stops.
- Keep stylesheet linting on the main repository lint path. `pnpm lint`, CI validation, pre-push checks, and dependency-refresh sanity runs should cover both Oxlint and Stylelint instead of leaving CSS and SCSS validation on a manual side command.
- When a repository automation helper needs `pnpm` outside a `pnpm run` context, prefer the bundled `pnpm.cjs` Node entrypoint on Windows instead of failing or reintroducing shell dispatch through `cmd.exe`.
- Keep dependency refreshes on the shared `pnpm update:check`, `pnpm update:minor`, and `pnpm update:major` scripts. The mutating flows should refresh the lockfile with `pnpm install --no-frozen-lockfile`, run the full sanity command set, and default to the repository `pnpm git:commit` path, while automation can pass `--no-commit` when it needs to stage dependency changes separately.
- Keep automatic `package.json` patch-version bumps on the pre-commit path. A staged `package.json` diff that only updates the `version` field should stay lightweight release metadata rather than a reason to rerun the full Vitest suite inside the staged-only portion of commit validation.
- Keep contributor commit automation aligned with the runtime version strategy. `pnpm git:commit` should run the shared commit-version bump before delegating to `git commit`, `.husky/pre-commit` should cover plain `git commit`, and the helper should mark the commit environment so the hook does not double-bump the version.
- When the workflow intentionally prefers faster pushes, keep the repository-wide TypeScript, test, and build gates on pre-commit and document that commit-latency tradeoff clearly in contributor workflow docs.
- When the workflow intentionally prefers faster pushes, keep the pre-push hook empty so repository-wide validation is paid once per commit rather than once per commit and again per push.
- Keep scheduled dependency automation aligned with the repository toolchain. Use the repo-pinned package-manager version in CI jobs and keep audit steps read-only instead of mutating dependencies inside the workflow.
- Keep GitHub Actions least-privilege by default. Declare explicit workflow permissions, disable persisted checkout credentials unless a job needs them, and prefer reviewed repository logic or the GitHub CLI over third-party PR automation in write-capable jobs.
- Keep pull-request validation split into independent jobs when that meaningfully reduces wall-clock feedback time, and align each job with the narrowest local command set such as `pnpm test:node`, `pnpm test:jsdom`, or `pnpm build:budget:strict`.
- Keep documentation-only pull requests off the runtime CI path when the diff cannot affect shipped code, toolchain behavior, or workflow execution.
- Before a workflow uses `git push --force-with-lease` against a reusable branch, fetch the matching remote branch into a local remote-tracking ref inside the job so the lease checks current remote state instead of stale or missing ref data.
- Non-draft same-repository PRs targeting the repository default branch can auto-resolve package.json version conflicts through the `auto-rebase-package-json` workflow job.
- Pushes to the repository default branch run an automated Pages deployment job that installs dependencies and executes `pnpm git:deploy` for publishing.
