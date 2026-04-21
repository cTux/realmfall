# Vitest Cache Plugin Note

Implemented: 2026-04-13

- `pnpm test` uses `vite-plugin-vitest-cache` with repository-local cache data in
  `.tests/vitest-cache`.
- The pull-request workflow restores and saves that cache before the Vitest step.
- Contributors can force a cold run by deleting `.tests/vitest-cache`.
- Canonical behavior and maintenance guidance now live in:
  - `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`
  - `docs/WORKFLOW.md`
