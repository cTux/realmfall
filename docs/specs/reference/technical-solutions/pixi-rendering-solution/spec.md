# Pixi Rendering Solution

## Scope

This spec covers the main world-render loop, scene decomposition, and render-performance strategy.

## Current Solution

- Pixi owns the main world redraw loop through the ticker started in `usePixiWorld`.
- React updates feed the renderer through refs and invalidation-sensitive cached inputs rather than by layering a second immediate render effect path.
- The renderer separates static, interaction, and animated work.
- Static layers hold terrain, structures, claims, and stable ground cover.
- Interaction layers hold hover, selection, loot borders, and safe-path overlays.
- Animated layers hold atmosphere, clouds, campfire lighting, and overlay work.
- The renderer reuses graphics and sprites through dedicated pool helpers.
- Cached scene state avoids unnecessary rebuilds when screen size, selected tile, visible tiles, or path highlights have not changed.
- Deterministic ground-cover presentation and cloud inputs are memoized in bounded caches.
- The world renderer includes time-of-day lighting, atmosphere passes, overlay tinting, and optional fish-eye processing.
- Rendering quality and icon sizing derive from screen state and world radius.
- The Pixi canvas uses density-aware sizing so browser zoom and high-DPI displays keep the world viewport fitted to CSS pixels while renderer resolution tracks `window.devicePixelRatio` changes on resize.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/ui/world/renderScene.ts`
- `src/ui/world/renderSceneCache.ts`
- `src/ui/world/renderScenePools.ts`
- `src/ui/world/renderSceneAtmosphere.ts`
