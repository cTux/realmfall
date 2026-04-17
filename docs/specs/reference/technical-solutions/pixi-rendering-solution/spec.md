# Pixi Rendering Solution

## Scope

This spec covers the main world-render loop, scene decomposition, and render-performance strategy.

## Current Solution

- Pixi owns the main world redraw loop through the ticker started in `usePixiWorld`.
- React updates feed the renderer through refs and invalidation-sensitive cached inputs rather than by layering a second immediate render effect path.
- The renderer separates static, interaction, and animated work.
- Static layers hold terrain, structures, claims, and stable ground cover.
- Interaction layers hold hover, selection, loot borders, and safe-path overlays.
- Animated layers hold atmosphere, clouds, hot-structure lighting such as campfires and furnaces, and overlay work.
- The renderer reuses graphics and sprites through dedicated pool helpers.
- Cached scene state avoids unnecessary rebuilds when screen size, derived static-world render inputs, selected tile, or path highlights have not changed.
- Static and interaction redraw invalidation derives from render-specific version keys rather than whole `GameState` identity, so log-only or other non-world state clones do not rebuild unchanged Pixi layers.
- `usePixiWorld` reuses the previous `visibleTiles` array when unrelated state clones leave the visible tile set untouched, and render-version caching keys off those stable world-facing inputs plus the specific enemy and world flags that actually affect Pixi output.
- `usePixiWorld` updates the cached visible-tile list only when world-facing inputs such as player position, world radius, seed, or tile data change, instead of recomputing visible tiles on every unrelated root-state clone.
- Once static layers are cached, animation-only frames reuse cached hot-structure light points for campfires and furnaces and skip the full visible-tile traversal instead of repeating enemy lookup and marker preparation work on every ticker tick.
- Deterministic ground-cover presentation and cloud inputs are memoized in bounded caches.
- The world renderer includes time-of-day lighting, atmosphere passes, overlay tinting, and optional fish-eye processing.
- Rendering quality and icon sizing derive from screen state and world radius.
- Pixi v8 initialization happens through the async `Application.init()` path rather than constructor options.
- The world bootstrap loads Pixi through a dedicated `pixiRuntime` module and passes `manageImports: false`, so every Pixi feature used on the world path must be imported there explicitly. The current manual runtime setup includes the app, graphics, text, and filter extensions because the scene cache still constructs a custom world-map `Filter`.
- The custom world-map fisheye shader follows Pixi v8 filter shader semantics on both stages: the vertex shader emits `vTextureCoord`, and the fragment shader consumes `in vec2 vTextureCoord` and samples `uTexture` so the filter can compile cleanly when the fisheye path is enabled again.
- World SVG icon URLs are preloaded into `ImageSource`-backed textures before the Pixi app starts, because Pixi v8 string texture creation expects already-loaded sources and otherwise falls back to asset-cache warnings instead of rendering markers reliably.
- World icon preloading now prioritizes the icons visible on the current viewport plus the always-on atmospheric icons before first render, then warms the remaining icon catalog asynchronously after the canvas is live.
- The Pixi canvas uses density-aware sizing so browser zoom and high-DPI displays keep the world viewport fitted to CSS pixels while renderer resolution tracks `window.devicePixelRatio` changes on resize.
- Persisted settings now hydrate Pixi renderer initialization flags such as antialiasing, auto density, buffer preservation, and alpha handling through a dedicated plain `localStorage` `settings` payload that is read before the initial game and Pixi setup; those init-time flags still require a reload before they affect an already-running canvas.
- Hover-analysis caching now invalidates from gameplay-state versions that materially affect interaction resolution rather than from every broad `tiles` or `enemies` container identity change.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/ui/world/pixiRuntime.ts`
- `src/ui/world/renderScene.ts`
- `src/ui/world/renderSceneCache.ts`
- `src/ui/world/renderScenePools.ts`
- `src/ui/world/renderSceneAtmosphere.ts`
