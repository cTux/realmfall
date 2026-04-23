# Input And Tooltip Handling

## Scope

This spec covers canvas-pointer world interaction and the shared tooltip system.

## Current Solution

- Pointer interactions are handled directly on the Pixi canvas.
- Pointer-to-hex translation uses render math plus optional fish-eye coordinate remapping.
- Hover state is cached to avoid unnecessary tooltip and highlight churn.
- Native canvas `pointermove` events only hand off the latest pointer position, and hover analysis runs on `requestAnimationFrame` so pointer storms do not force synchronous pathfinding and tooltip work multiple times in the same frame.
- Same-hex pointermove events reuse the cached hover snapshot instead of re-running hover selectors, tooltip builders, or pathfinding.
- Safe-path lookup and world tooltip derivation run only for actionable hovered hexes; non-actionable tiles clear hover affordances without the heavier recomputation path.
- Unrevealed distant world-map targets are rejected before tile generation or safe-path lookup on both hover and click, so exploratory pointer sweeps do not build off-map terrain.
- Pixi world input wiring is split into focused helpers under `src/app/App/world/`: hover analysis, click navigation, drag-pan state, zoom filtering, and shared pointer matching live in neighboring modules while `pixiWorldInteractions.ts` only attaches listeners and composes those helpers.
- Tooltips are managed through the shared app tooltip store.
- Tooltip builders use locale keys and shared label helpers for their visible copy instead of hardcoded English fragments.
- Tooltip assembly is split by domain under `src/ui/tooltips/`, with `itemTooltips.ts`, `abilityTooltips.ts`, and `entityTooltips.ts` owning the gameplay-specific line builders while `src/ui/tooltips.ts` remains the shared import surface for UI consumers.
- Enemy and structure tooltip content is assembled through shared builders used by both the window helper surface and the world-hover helper surface, while each surface keeps only its line-shape and presentation-specific wrapping.
- Follow-cursor world tooltips receive their position updates from the same Pixi hover pipeline that derives the tooltip content, instead of registering a second global pointer listener for DOM syncing.
- The world path and window UI both use the custom tooltip system instead of native browser titles.
- Skill and profession tooltip titles use the localized in-game label casing rather than forcing all-caps formatting.
- Element-anchored tooltips prefer the right side of the hovered target and automatically flip to the left when the right side would overflow the viewport.
- Window title-bar action buttons and other UI affordances that use the shared tooltip system avoid native `title` attributes and render through the same custom tooltip surface.
- Window close buttons and title-bar actions are routed through shared window-shell primitives so tooltip behavior stays consistent across every window.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/app/App/world/pixiWorldInteractions.ts`
- `src/app/App/world/pixiWorldHoverInteractions.ts`
- `src/app/App/world/pixiWorldClickNavigation.ts`
- `src/app/App/world/pixiWorldMapDrag.ts`
- `src/app/App/world/pixiWorldMapZoom.ts`
- `src/app/App/world/pixiWorldInteractionShared.ts`
- `src/app/App/tooltipStore.ts`
- `src/ui/tooltips.ts`
- `src/ui/tooltips/itemTooltips.ts`
- `src/ui/tooltips/abilityTooltips.ts`
- `src/ui/tooltips/entityTooltips.ts`
- `src/ui/tooltips/shared.ts`
- `src/ui/tooltipContent.ts`
- `src/ui/components/GameTooltip/GameTooltip.tsx`
- `src/ui/tooltipPlacement.ts`
