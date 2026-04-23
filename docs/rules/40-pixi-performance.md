# Pixi And Performance Rules

## Pixi And Performance

- Protect frame rate on the world map path. Avoid unnecessary rerenders, reallocation-heavy render steps, and asset churn in Pixi code.
- Prefer extending existing render helpers, caches, math utilities, and pools in `src/ui/world` over duplicating render logic.
- Preserve and extend the existing pooling and persistent-stage-layer approach before introducing new world-render allocation paths.
- Smooth visual transitions are preferred for color and position changes when they are part of visible world feedback.
- Consider React rerender cost and Pixi redraw cost together for world-facing changes.
- Prefer a single clear render scheduler for the world path. Avoid duplicate immediate redraw triggers layered on top of the ticker unless there is a measured reason.
- When React-driven world state changes need a redraw, prefer updating refs or lightweight invalidation flags that the ticker consumes instead of adding a second immediate `renderScene` effect path.
- Keep `usePixiWorld` focused on refs, lifecycle effects, and async bootstrap wiring. Move render-loop comparison, camera persistence, and pointer interaction details into neighboring `src/app/App/world` modules once the world hook starts accumulating those responsibilities.
- Keep `src/app/App/usePixiWorld.ts` free of static value imports from Pixi render-loop and world texture modules. Only type imports or small non-Pixi snapshot helpers may cross the startup boundary; load render loops, runtime, scene rendering, and texture modules inside the async Pixi bootstrap.
- Use lazy refs for expensive world hook defaults such as visible tiles, hover caches, and render snapshots. Avoid `useRef(expensiveFactory())` in world hooks because the argument is evaluated on every render.
- Keep `src/ui/world/renderScene.ts` as a thin orchestration facade. Move static-tile drawing, static-marker composition, interaction overlays, claim-border drawing, animated-only redraw work, and shared render helpers into neighboring `renderScene*.ts` modules instead of rebuilding one broad renderer file.
- Key static and interaction Pixi redraw invalidation off stable world-render inputs or explicit render-version tokens instead of whole `GameState` identity when broad state cloning would otherwise thrash cached layers.
- Reuse `visibleTiles` arrays and other world-facing selector outputs across unrelated state clones when the visible tile set and relevant world data did not change, so Pixi invalidation can key off stable inputs instead of broad app state identity.
- Avoid recomputing full visible-tile arrays only to decide whether the previous array could have been reused. Reuse checks should be cheaper than the redraw work they protect.
- Carry shared visible-tile render inputs through token derivation and static marker rendering so tile-level enemy lookups are paid once per static redraw.
- Cache deterministic per-tile or per-scene render inputs instead of recomputing stable randomness and presentation values every frame.
- When a Pixi texture cache lives at module scope, treat destroyed textures or destroyed texture sources as invalid and reload them before reuse so HMR and app remounts do not inherit dead GPU resources.
- Separate static world layers from animated or transient layers when doing so reduces repeated redraw cost without making the renderer harder to reason about.
- Keep world-map terrain geometry, fog, ground cover, and stable structure or enemy markers on cached static Pixi layers. Do not redraw unchanged map geometry on every ticker frame just because time-based animation is advancing.
- Put hover, selection, and other short-lived interaction highlights on their own invalidated layer so pointer-state changes do not force a rebuild of the full world scene.
- Reserve per-frame ticker redraws for genuinely animated layers such as clouds, atmosphere, overlays, firelight, and similar time-driven effects; static layers should refresh only when their actual inputs change.
- Keep `pointermove` handlers focused on pointer-to-world translation, cache lookup, and lightweight state handoff. Expensive hover analysis such as pathfinding, enemy aggregation, or tooltip assembly should be throttled or precomputed when it becomes measurable on that path.
- Split world-map interaction orchestration by responsibility. Keep hover analysis, click navigation, drag-pan state, zoom filtering, and shared pointer helpers in focused modules under `src/app/App/world/`, and keep `pixiWorldInteractions.ts` as the attachment/composition layer instead of letting one listener file own every interaction branch.
- When static redraw invalidation needs enemy or structure presentation data, prefer carrying forward precomputed render inputs instead of repeating tile-level lookup work during both token derivation and render execution.
- On Pixi bootstrap, block only on the world icon textures needed for the initial visible viewport. Warm the rest of the icon catalog in background idle slices so first paint is not tied to offscreen marker assets.
- Keep the generated world terrain atlas in sync with terrain PNG changes by running `pnpm assets:world-atlas`; the generated manifest must cover every runtime terrain in `TERRAINS`.
- Runtime terrain sprites should resolve through generated atlas frame ids. Treat individual terrain PNGs as atlas inputs, not as direct world-render texture imports.
- Disabled renderer experiments such as optional filters must cost zero runtime bootstrap work. Keep the live runtime on a no-op path until the feature flag is enabled instead of importing or constructing disabled filter code during normal startup.
- Use device-aware quality budgets for Pixi rendering. Cap expensive defaults such as full-resolution rendering or unconditional antialiasing when they threaten frame time on weaker or high-DPI devices.
- Treat Pixi renderer creation options as page-lifetime initialization inputs. Keep those settings out of live Pixi bootstrap effect dependencies, and mark their controls as reload-required while routing live redraw toggles through explicit render invalidation.
- Keep lightweight performance budgets documented and visible. Treat roughly `16.7 ms` as the default desktop frame-time budget for normal world interaction, and investigate changes that push the initial startup chunks materially beyond the current envelope of about `80 kB` for `App`, `200 kB` for `react-dom-vendor`, `535 kB` for `state`, `550 kB` for `pixi`, and `1.46 MB` for total startup JS before gzip.
- Prefer small, focused render tests for world math, lighting, filters, caches, and deterministic presentation behavior when changing Pixi logic.
- Do not flag Pixi startup antialiasing or full-DPR defaults as standalone review issues during general best-practice reviews unless the task explicitly targets renderer quality settings or there is measured evidence that those defaults are causing device-specific regressions.
