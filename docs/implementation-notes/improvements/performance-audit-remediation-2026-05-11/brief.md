# Performance Audit Remediation

This workspace tracks the follow-up to the May 11, 2026 performance review for
the client app.

Active fixes in this workspace:

- `P1` Stop mirroring hover-analysis state into both the worker path and the
  local fallback on every refresh.
- `P1` Remove generated-icon asset exports from the shared UI root barrel so
  fixed-window and bootstrap-adjacent imports do not eagerly load that asset
  graph.
- `P2` Move bootstrap-shell constants out of the icon-heavy
  `packages/client/src/client.config.ts` entry so `main.tsx` does not widen the
  startup preload set.
- `P3` Consolidate duplicate item-icon lookup logic between the client and the
  shared UI package into one canonical helper path.

Re-verified candidate from the review:

- `pnpm typecheck` is green at both the repo root and `packages/client` on
  May 11, 2026, so the earlier Pixi import-resolution failure is not queued as
  an implementation fix in this workspace.

Canonical references expected to move with the shipped behavior:

- [Pixi Rendering Solution Spec](../../../specs/reference/technical-solutions/pixi-rendering-solution/spec.md)
- [Input And Tooltip Handling Spec](../../../specs/reference/technical-solutions/input-and-tooltip-handling/spec.md)
- [React App Orchestration Spec](../../../specs/reference/technical-solutions/react-app-orchestration/spec.md)
- [Browser Entry Metadata Spec](../../../specs/reference/technical-solutions/browser-entry-metadata/spec.md)
- [UI Component Library Spec](../../../specs/reference/technical-solutions/ui-component-library/spec.md)
- [Build And Bundle Rules](../../../rules/50-build-and-bundle.md)
- [Pixi Rules](../../../rules/40-pixi-performance.md)

The detailed execution plan lives in [plan.md](./plan.md).
