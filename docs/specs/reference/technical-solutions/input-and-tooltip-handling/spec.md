# Input And Tooltip Handling

## Scope

This spec covers canvas-pointer world interaction and the shared tooltip system.

## Current Solution

- Pointer interactions are handled directly on the Pixi canvas.
- Pointer-to-hex translation uses render math plus optional fish-eye coordinate remapping.
- Hover state is cached to avoid unnecessary tooltip and highlight churn.
- Tooltips are managed through the shared app tooltip store.
- The world path and window UI both use the custom tooltip system instead of native browser titles.
- Element-anchored tooltips prefer the right side of the hovered target and automatically flip to the left when the right side would overflow the viewport.
- Window title-bar action buttons and other UI affordances that use the shared tooltip system avoid native `title` attributes and render through the same custom tooltip surface.
- Window close buttons and title-bar actions are routed through shared window-shell primitives so tooltip behavior stays consistent across every window.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/app/App/tooltipStore.ts`
- `src/ui/tooltips.ts`
- `src/ui/components/GameTooltip/GameTooltip.tsx`
- `src/ui/tooltipPlacement.ts`
