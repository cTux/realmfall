# Pixi And Performance Rules

## Pixi And Performance

- Protect frame rate on the world map path. Avoid unnecessary rerenders, reallocation-heavy render steps, and asset churn in Pixi code.
- Prefer extending existing render helpers, caches, math utilities, and pools in `src/ui/world` over duplicating render logic.
- Preserve and extend the existing pooling and persistent-stage-layer approach before introducing new world-render allocation paths.
- Smooth visual transitions are preferred for color and position changes when they are part of visible world feedback.
- Consider React rerender cost and Pixi redraw cost together for world-facing changes.
- Prefer a single clear render scheduler for the world path. Avoid duplicate immediate redraw triggers layered on top of the ticker unless there is a measured reason.
- When React-driven world state changes need a redraw, prefer updating refs or lightweight invalidation flags that the ticker consumes instead of adding a second immediate `renderScene` effect path.
- Key static and interaction Pixi redraw invalidation off stable world-render inputs or explicit render-version tokens instead of whole `GameState` identity when broad state cloning would otherwise thrash cached layers.
- Reuse `visibleTiles` arrays and other world-facing selector outputs across unrelated state clones when the visible tile set and relevant world data did not change, so Pixi invalidation can key off stable inputs instead of broad app state identity.
- Avoid recomputing full visible-tile arrays only to decide whether the previous array could have been reused. Reuse checks should be cheaper than the redraw work they protect.
- Cache deterministic per-tile or per-scene render inputs instead of recomputing stable randomness and presentation values every frame.
- Separate static world layers from animated or transient layers when doing so reduces repeated redraw cost without making the renderer harder to reason about.
- Keep world-map terrain geometry, fog, ground cover, and stable structure or enemy markers on cached static Pixi layers. Do not redraw unchanged map geometry on every ticker frame just because time-based animation is advancing.
- Put hover, selection, and other short-lived interaction highlights on their own invalidated layer so pointer-state changes do not force a rebuild of the full world scene.
- Reserve per-frame ticker redraws for genuinely animated layers such as clouds, atmosphere, overlays, firelight, and similar time-driven effects; static layers should refresh only when their actual inputs change.
- Keep `pointermove` handlers focused on pointer-to-world translation, cache lookup, and lightweight state handoff. Expensive hover analysis such as pathfinding, enemy aggregation, or tooltip assembly should be throttled or precomputed when it becomes measurable on that path.
- When static redraw invalidation needs enemy or structure presentation data, prefer carrying forward precomputed render inputs instead of repeating tile-level lookup work during both token derivation and render execution.
- Use device-aware quality budgets for Pixi rendering. Cap expensive defaults such as full-resolution rendering or unconditional antialiasing when they threaten frame time on weaker or high-DPI devices.
- Keep lightweight performance budgets documented and visible. Treat roughly `16.7 ms` as the default desktop frame-time budget for normal world interaction, and investigate changes that push the initial startup chunks materially beyond the current envelope of about `80 kB` for `App`, `200 kB` for `react-dom-vendor`, `535 kB` for `state`, `550 kB` for `pixi`, and `1.45 MB` for total startup JS before gzip.
- Prefer small, focused render tests for world math, lighting, filters, caches, and deterministic presentation behavior when changing Pixi logic.
- Do not flag Pixi startup antialiasing or full-DPR defaults as standalone review issues during general best-practice reviews unless the task explicitly targets renderer quality settings or there is measured evidence that those defaults are causing device-specific regressions.
