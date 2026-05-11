# Browser, React, And Pixi Performance Remediation

This workspace tracks the follow-up to the May 2026 browser, React, and Pixi
performance audit for the client app.

Active fixes in this workspace:

- `P1` Shorten the startup critical path by removing eager translation
  materialization from the `App` import graph where needed and overlapping
  `App` module loading with locale and font readiness.
- `P1` Keep Pixi first paint blocked only on icon textures needed for the first
  visible world frame instead of also preloading the reachable-ring icon set on
  the bootstrap path.
- `P1` Separate animated-world redraw cadence from the selected Pixi ticker FPS
  so stable scenes do not rerender animated layers on every 60 FPS wakeup.
- `P1` Narrow tile-resolution lifecycle sync dependencies so unrelated
  `GameState` clones do not re-run visible-frontier coordinator sync work.

Canonical references to update with the shipped behavior:

- [Internationalization Spec](../../../specs/reference/technical-solutions/internationalization/spec.md)
- [React App Orchestration Spec](../../../specs/reference/technical-solutions/react-app-orchestration/spec.md)
- [Browser Entry Metadata Spec](../../../specs/reference/technical-solutions/browser-entry-metadata/spec.md)
- [Pixi Rendering Solution Spec](../../../specs/reference/technical-solutions/pixi-rendering-solution/spec.md)
- [Async World Tile Resolution Spec](../../../specs/reference/technical-solutions/async-world-tile-resolution/spec.md)
- [Build And Bundle Rules](../../../rules/50-build-and-bundle.md)
- [React UI Rules](../../../rules/30-react-ui.md)
- [Pixi Rules](../../../rules/40-pixi-performance.md)

The detailed execution plan lives in [plan.md](./plan.md).
