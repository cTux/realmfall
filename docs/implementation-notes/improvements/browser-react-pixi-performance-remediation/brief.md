# Browser, React, And Pixi Performance Remediation

This workspace tracks the follow-up to the May 2026 browser, React, and Pixi
performance audit for the client app.

Active fixes in this workspace:

- `P1` Keep bootstrap i18n imports off the broad `@realmfall/ui-react` barrel so
  the deferred `App` entry does not preload the large shared state chunk.
- `P1` Reduce React rerender breadth through `AppShell` and `AppWindows` by
  removing whole-`GameState` shell props and preserving memo boundaries.
- `P1` Replace whole-`GameState` Pixi frame bailouts with a narrower render
  snapshot keyed to world-facing inputs.
- `P2` Move gameplay icon definitions to stable ids so workers and gameplay
  state do not import raw SVG asset URLs.
- `P2` Narrow hover-analysis worker sync payloads so hover pathfinding does not
  clone broad gameplay state into the worker on every relevant world update.
- `P3` Restore the lazy debug split by removing static `stateDebug` coupling
  from the core state barrel and non-lazy UI paths.

Canonical references to update with the shipped behavior:

- [Internationalization Spec](../../../specs/reference/technical-solutions/internationalization/spec.md)
- [React App Orchestration Spec](../../../specs/reference/technical-solutions/react-app-orchestration/spec.md)
- [Pixi Rendering Solution Spec](../../../specs/reference/technical-solutions/pixi-rendering-solution/spec.md)
- [Content Ids And Tags Spec](../../../specs/reference/technical-solutions/content-ids-and-tags/spec.md)
- [Build And Bundle Rules](../../../rules/50-build-and-bundle.md)
- [React UI Rules](../../../rules/30-react-ui.md)
- [Pixi Rules](../../../rules/40-pixi-performance.md)

The detailed execution plan lives in [plan.md](./plan.md).
