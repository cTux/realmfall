# Implementation Plan: Vitest Cache Plugin Adoption

**Branch**: `001-vitest-cache-plugin` | **Date**: 2026-04-13 | **Brief**: `docs/implementation-notes/improvements/vitest-cache-plugin/brief.md`
**Input**: Feature brief from `docs/implementation-notes/improvements/vitest-cache-plugin/brief.md`

## Summary

Adopt `@raegen/vite-plugin-vitest-cache` in the existing Vite/Vitest configuration so repeated local and CI test runs can reuse unchanged results. The change should stay minimal: add the plugin to the current `vitest/config` setup, persist the cache directory in GitHub Actions, and document cache behavior and reset steps for contributors.

## Technical Context

**Language/Version**: TypeScript 6.0, Node.js 25 locally and in CI via `.nvmrc`  
**Primary Dependencies**: `vite@8`, `vitest@4`, `@vitejs/plugin-react`, `@raegen/vite-plugin-vitest-cache`  
**Storage**: Filesystem cache directory for test artifacts (`.tests/vitest-cache`)  
**Testing**: Vitest via `pnpm test`, plus existing `pnpm typecheck`, `pnpm lint`, and `pnpm build` quality gates  
**Target Platform**: Local Windows/macOS/Linux contributor environments and GitHub Actions on Ubuntu  
**Project Type**: Single-project Vite React web application  
**Performance Goals**: Reduce warm `pnpm test` wall-clock time for unchanged or lightly changed code paths and avoid rerunning unaffected tests in CI  
**Constraints**: Preserve test correctness, keep the change small, keep `pnpm` workflow intact, avoid changes to production runtime or bundle behavior, keep docs accurate  
**Scale/Scope**: One existing Vite config, one pull request workflow, and contributor documentation for the current repository

## Constitution Check

Effective gates derived from `docs/RULES.md` for this feature:

- Use `pnpm` commands and preserve existing quality gates.
- Prefer the smallest correct change and existing project patterns.
- Preserve existing behavior outside the Vitest execution path.
- Keep documentation aligned with actual shipped workflow.
- Keep CI and local testing trustworthy; caching must not weaken correctness.

Gate result before implementation: Pass. The feature is isolated to test tooling, CI caching, and documentation, with no required architecture expansion.

## Project Structure

### Documentation (this feature)

```text
docs/implementation-notes/improvements/vitest-cache-plugin/
├── plan.md
└── spec.md
```

### Source Code (repository root)

```text
vite.config.ts
package.json
.github/workflows/pull-request.yml
README.md
docs/
```

**Structure Decision**: Keep the implementation inside the existing root-level Vite config and GitHub Actions workflow. No new source modules are needed because this is a focused tooling integration.

## Phase 0: Research Decisions

### Decision: Use the plugin in the existing Vite/Vitest plugin array

**Rationale**: `vite.config.ts` already uses `defineConfig` from `vitest/config` and defines a single shared plugin array, so adding the cache plugin there is the smallest integration point.

**Alternatives considered**:

- Separate Vitest config file: rejected because the repo already centralizes test configuration in `vite.config.ts`.
- Custom wrapper scripts around `pnpm test`: rejected because the plugin is designed to work directly in the existing Vitest config.

### Decision: Use an explicit `.tests/vitest-cache` directory instead of the plugin default root

**Rationale**: The repo now has a clearer contributor workflow when Vitest cache artifacts live under a dedicated subdirectory. It stays project-local, easy to ignore, and easy to persist in CI without claiming the whole `.tests` root for a single tool.

**Alternatives considered**:

- Plugin default `.tests`: rejected because a dedicated subdirectory is clearer for contributors and leaves room for future test artifacts under `.tests`.

### Decision: Persist the test cache in GitHub Actions alongside the existing `pnpm test` step

**Rationale**: The current pull request workflow already runs tests in a single job, so restoring `.tests` before the test step and saving it afterward is a direct fit.

**Alternatives considered**:

- Local-only caching: rejected because the plugin is also valuable for repeated CI validation.
- Reworking the workflow into multiple jobs: rejected because it is unrelated to this feature.

## Implementation Design

### Planned Changes

1. Add `@raegen/vite-plugin-vitest-cache` to `devDependencies`.
2. Import the plugin in `vite.config.ts` and add it to the shared plugin array only when Vitest is running so production builds keep the same behavior.
3. Use a local Vitest 4 compatibility shim for the plugin's runner and setup hooks because the package's current custom-pool path still targets the older Vitest pool API.
4. Configure the plugin to use `.tests/vitest-cache`.
5. Update `.github/workflows/pull-request.yml` to restore and persist the plugin cache directory.
6. Document the new workflow in `README.md`, `docs/WORKFLOW.md`, and the matching testing/tooling spec, including cache location and how to clear it for a cold test run.

### Verification Plan

1. Run `pnpm test` from a cold state and confirm cache artifacts are created.
2. Run `pnpm test` again without relevant changes and confirm cache reuse occurs.
3. Modify a small test-relevant file and confirm only affected tests are recomputed.
4. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` to verify no collateral regressions.

### Risks And Mitigations

- **Risk**: Cached results hide incorrect behavior.
  **Mitigation**: Rely on the plugin's source hashing, avoid broad customization initially, and document how to clear the cache for verification.

- **Risk**: CI cache keys are too coarse or too narrow.
  **Mitigation**: Base the cache key on workflow-relevant inputs such as lockfile and config files while keeping restore behavior practical.

- **Risk**: Cache files create contributor confusion or noisy git state.
  **Mitigation**: Ensure the cache directory is ignored appropriately and document its purpose in the testing workflow.

## Complexity Tracking

No constitution violations are expected. This is a small tooling integration using existing config and workflow files.
