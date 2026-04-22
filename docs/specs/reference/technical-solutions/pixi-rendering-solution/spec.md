# Pixi Rendering Solution

## Scope

This spec covers the main world-render loop, scene decomposition, and render-performance strategy.

## Current Solution

- Pixi owns the main world redraw loop through the ticker started in `usePixiWorld`.
- Idle world frames now coalesce inside a lower animation cadence bucket, so unchanged state does not rerun the full world render path on every Pixi ticker tick.
- React updates feed the renderer through refs and invalidation-sensitive cached inputs rather than by layering a second immediate render effect path.
- The renderer separates static, interaction, and animated work.
- Static layers hold terrain, structures, claims, and stable ground cover.
- Interaction layers hold hover, selection, loot borders, and safe-path overlays.
- Animated layers hold atmosphere, clouds, hot-structure lighting such as campfires and furnaces, and overlay work.
- The renderer reuses graphics and sprites through dedicated pool helpers.
- Cached scene state avoids unnecessary rebuilds when screen size, derived static-world render inputs, selected tile, or path highlights have not changed.
- Static and interaction redraw invalidation derives from render-specific version keys rather than whole `GameState` identity, so log-only or other non-world state clones do not rebuild unchanged Pixi layers.
- Static invalidation now ignores offscreen enemy container churn by comparing only the enemy presentation inputs that belong to visible tiles before rebuilding cached layers.
- When offscreen enemy-only clones leave the visible-enemy token unchanged, the scene cache advances its stored `enemies` source reference so later animation ticks do not keep recomputing the visible-enemy token against the same unchanged state.
- `usePixiWorld` reuses the previous `visibleTiles` array when unrelated state clones leave the visible tile set untouched, and render-version caching keys off those stable world-facing inputs plus the specific enemy and world flags that actually affect Pixi output.
- `usePixiWorld` updates the cached visible-tile list only when world-facing inputs such as player position, world radius, seed, or visible tile data change, instead of recomputing visible tiles on every unrelated root-state clone.
- Visible-tile reuse metadata is attached to whichever array `usePixiWorld` keeps, including caller-seeded reused arrays, so later unchanged updates can hit the no-recompute fast path instead of paying for another full visibility rebuild.
- Once static layers are cached, animation-only frames reuse cached hot-structure light points for campfires and furnaces and skip the full visible-tile traversal instead of repeating enemy lookup and marker preparation work on every ticker tick.
- Cached world-marker wrappers now keep deterministic per-hex animation metadata, so animation-only frames can pulse or bob hostile markers by mutating live sprite transforms instead of rebuilding static marker pools.
- Settlement, claim, and utility structure markers now route through the same cached-wrapper animation path, with night-aware tint pulses applied directly to live marker sprites instead of triggering a static-layer refresh.
- Gathering-site markers now reuse the cached wrapper animator with deterministic shimmer phases, so ore, herb, timber, and water icons can glint intermittently without adding a second marker traversal to animation-only frames.
- Animated sky, atmosphere, cloud, overlay, and firelight layers use their own lower-cadence token, so hover or selection redraws inside the same animation bucket do not reset those animated stage layers again.
- Deterministic ground-cover presentation and cloud inputs are memoized in bounded caches.
- The world renderer includes time-of-day lighting, atmosphere passes, overlay tinting, and optional fish-eye processing.
- Rendering quality and icon sizing derive from screen state and world radius.
- Pixi v8 initialization happens through the async `Application.init()` path rather than constructor options.
- The world bootstrap loads Pixi through a dedicated `pixiRuntime` module and passes `manageImports: false`, so every Pixi feature used on the world path must be imported there explicitly. The current manual runtime setup includes the app, graphics, text, and filter extensions because the scene cache constructs a custom world-map `Filter`.
- The custom world-map fisheye shader follows Pixi v8 filter shader semantics on both stages: the vertex shader emits `vTextureCoord`, and the fragment shader consumes `in vec2 vTextureCoord` and samples `uTexture` so the filter can compile cleanly when the fisheye path is enabled again.
- World SVG icon URLs are promoted into `ImageSource`-backed textures before sprite creation, so Pixi marker sprites do not depend on string-based asset lookup in the browser runtime.
- The world bootstrap keeps world-only icon preloading, scene-cache setup, and world-hover tooltip helpers behind the same async world bootstrap boundary as Pixi and scene rendering, so the initial `App` chunk does not absorb renderer-only code before the world canvas mounts.
- `usePixiWorld` now delegates render-loop comparison, pointer interaction wiring, and camera persistence to neighboring `src/app/App/world` modules so the hook stays centered on refs, invalidation state, and async world bootstrap.
- While the fisheye feature flag is off, the live world runtime imports a no-op fisheye adapter instead of the shader implementation, so normal Pixi bootstrap does not load or construct the disabled filter.
- The world bootstrap blocks only on the icon textures needed for the initial visible viewport, while the remaining icon catalog warms in background idle slices after the first canvas paint.
- Shared world-icon texture caches discard destroyed textures before reuse, so Pixi app remounts such as HMR do not hand the next world scene a texture whose source has already been destroyed.
- If a newly needed icon texture has not finished loading when a sprite pool requests it, the pool uses a transparent placeholder texture for that frame and rerenders when the real texture arrives.
- Terrain background redraw invalidation also keys off the shared world-icon texture version, so newly loaded terrain art repaints the cached static layer without waiting for unrelated hover or gameplay changes.
- Terrain background PNG assets ship as transparent pointy-top hex cutouts, so the static world layer can draw them through the regular sprite pool without a runtime mask path.
- Terrain background visibility is driven by a persisted graphics toggle that invalidates the cached static layer and rerenders the world map without recreating the Pixi app.
- The Pixi canvas uses density-aware sizing so browser zoom and high-DPI displays keep the world viewport fitted to CSS pixels while renderer resolution tracks `window.devicePixelRatio` changes on resize within the current graphics preset cap.
- Persisted settings now hydrate both Pixi renderer initialization flags and a preset-derived renderer density cap through a dedicated plain `localStorage` `settings` payload that is read before the initial game and Pixi setup; those init-time flags require a reload before they affect an already-running canvas.
- Hover-analysis caching now invalidates from gameplay-state versions that materially affect interaction resolution rather than from every broad `tiles` or `enemies` container identity change.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/app/App/world/pixiWorldRenderLoop.ts`
- `src/app/App/world/pixiWorldCamera.ts`
- `src/app/App/world/pixiWorldInteractions.ts`
- `src/ui/world/pixiRuntime.ts`
- `src/ui/world/renderScene.ts`
- `src/ui/world/renderSceneCache.ts`
- `src/ui/world/renderScenePools.ts`
- `src/ui/world/renderSceneAtmosphere.ts`
