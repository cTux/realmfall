# Input And Tooltip Handling

## Scope

This spec covers canvas-pointer world interaction and the shared tooltip system.

## Current Solution

- Pointer interactions are handled directly on the Pixi canvas.
- Pointer-to-hex translation uses render math plus optional fish-eye coordinate remapping.
- Hover state is cached to avoid unnecessary tooltip and highlight churn.
- Tooltips are managed through the shared app tooltip store.
- The world path and window UI both use the custom tooltip system instead of native browser titles.

## Main Implementation Areas

- `src/app/App/usePixiWorld.ts`
- `src/app/App/tooltipStore.ts`
- `src/ui/tooltips.ts`
- `src/ui/components/GameTooltip/GameTooltip.tsx`
