# UI Component Library

## Scope

This spec covers the reusable UI component library in `packages/ui-react`, its Storybook workflow, and the client-side adoption pattern.

## Current Solution

- `packages/ui-react` is a dedicated library package containing reusable UI primitives for `packages/client-web`.
- The package is built through Vite library mode using `packages/ui-react/vite.config.ts`.
- The package includes Storybook coverage for each exported component in `packages/ui-react`.
- `packages/client-web` imports shared components directly from `@realmfall/ui-react` at their call sites.
- `packages/ui-react` exposes reusable UI primitives through `packages/ui-react/src/index.ts`
  and keeps heavier helper families such as bootstrap i18n and generated-icon
  assets on narrow package subpaths instead of the root barrel.
- Shared gameplay-aware controls such as `ActionBar`, `ActionBarSlot`, `Tooltip`, `ContextMenu`, `ItemSlot`, and `DockPanel` live in `packages/ui-react`, and their stories live there as well.
- Legacy client-local copies of shared controls such as `ActionBar`, `Tooltip`, `ContextMenu`, and `ItemSlot` have been removed; client coverage now asserts the shared exports directly instead of comparing parallel implementations.
- `packages/client-web` receives the library through a workspace dependency (`@realmfall/ui-react`) added in
  `packages/client-web/package.json`.
- `packages/ui-react` owns its runtime i18n contract locally, while `packages/client-web/src/i18n/index.ts` loads locale assets and seeds that shared translation state for the app at runtime.
- The only retained TypeScript bridge from `packages/ui-react` back into `packages/client-web/src` is the Storybook fixture helper under `packages/ui-react/src/components/storybook/storybookHelpers.tsx`, while `packages/ui-react/src/styles/_ui.scss` remains the isolated shared surface-token forward.
- Shared package-owned UI helpers such as `packages/ui-react/src/icons.ts`, `packages/ui-react/src/iconAssets.ts`, `packages/ui-react/src/itemMetadata.ts`, `packages/ui-react/src/formatters.ts`, `packages/ui-react/src/tooltips.ts`, and `packages/ui-react/src/tooltipPlacement.ts` resolve shared display concerns locally instead of re-exporting `packages/client-web/src/ui/*`.
- Generated-equipment asset resolution stays on the dedicated
  `@realmfall/ui-react/generatedIconAssets` subpath, so consumers importing
  shared window, dock, tooltip, or button primitives from the root barrel do
  not link that asset module by default.
- Shared gameplay-aware controls inside `packages/ui-react` own narrow structural view contracts and helper logic under `packages/ui-react/src/game` for item-centric display and interaction state instead of importing broad client gameplay state types directly.
- `packages/ui-react/src/game` is a UI-owned contract layer. Its content ids, tags, and item classification helpers do not re-export `packages/client-web/src/game/content/*`.
- Shared item presentation metadata in `packages/ui-react` is the single source for canonical item-category fallback rules: shared tag constants and slot-to-category mapping are resolved there and then reused by client configuration helpers.
- Shared item visual metadata is intentionally consumed through materialized item fields first (including optional `tint`), so item visuals align between shared and client surfaces without direct configuration lookups during rendering.
- `packages/client-web/src/ui/icons.ts` keeps enemy, structure, skill, and sparse
  client-side item appearance enrichment local, then delegates shared item
  icon, border, and tint behavior to the narrow
  `@realmfall/ui-react/itemIcons` helper path instead of reimplementing those
  fallback rules in the client.
- `packages/ui-react/src/game/__tests__/boundary.spec.test.ts` enforces the broader shared-package boundary across `packages/ui-react/src/**`, allowing only the explicit Storybook helper bridge in TypeScript while the SCSS surface forward remains documented separately.
- Shared controls that only need gameplay-derived scalar values, such as corruption break chance text, receive those values from the client caller through props instead of importing client gameplay config into the shared package.
- Shared display-only chrome such as `WindowLabel` and `WindowDock` now render from structural props owned in `packages/ui-react` instead of importing client window registries or client-only label types just to render text.
- Shared `packages/ui-react` stories that only need representative gameplay-shaped items use local fixture objects or existing Storybook fixtures instead of routing through `packages/ui-react/src/game` into client gameplay builders.
- Shared buttons and button-like controls use one Slate Lift surface system, with the canonical palette and shared state selectors defined in `packages/client-web/src/styles/_ui.scss` and forwarded to the shared package through `packages/ui-react/src/styles/_ui.scss`.
- The Slate Lift resting fills stay lighter than the shared window title bar background, while selected and opened states reuse a brighter active fill so toggled controls read as elevated from the surrounding shell chrome.
- The shared `Button` primitive exposes the neutral and destructive surface choice through a `tone` prop, while preserving the shared compact-size path used by title-bar controls.
- The compact title-bar contract uses one shared minimum height across text actions and the icon-only close control, so content-window actions such as `Home` and the close button stay aligned without per-shell size overrides.
- Title-bar buttons, tabs, dock buttons, and chip-like controls all reuse the same surface palette through the `window-header-button`, `tab-surface`, `dock-button-surface`, and `chip-surface` SCSS mixins instead of defining separate control palettes.
- Shared window shells render the close control as an ordinary shared `Button` with inline icon content from `WindowFrame` rather than exporting a dedicated close-button component.
- Shared Storybook fixtures keep the surface-system states visible at the component-library layer: `Button` covers neutral, destructive, compact, and icon-only usage; `Tabs` covers the selected state; and `WindowDock` covers opened and attention states.
- New shared component guidance lives in `packages/ui-react/README.md`:
  - place each component under `src/components`
  - export it from `src/index.ts`
  - add a Storybook story file
  - keep component behavior and styles local

## Files

- `packages/ui-react/package.json`
- `packages/ui-react/vite.config.ts`
- `packages/ui-react/tsconfig.json`
- `packages/ui-react/tsconfig.build.json`
- `packages/ui-react/tsconfig.node.json`
- `packages/ui-react/.storybook/main.ts`
- `packages/ui-react/.storybook/preview.ts`
- `packages/ui-react/src/index.ts`
- `packages/ui-react/src/game/*`
- `packages/ui-react/src/icons.ts`
- `packages/ui-react/src/iconAssets.ts`
- `packages/ui-react/src/generatedIconAssets.ts`
- `packages/ui-react/src/itemMetadata.ts`
- `packages/ui-react/src/formatters.ts`
- `packages/ui-react/src/tooltips.ts`
- `packages/ui-react/src/tooltipPlacement.ts`
- `packages/ui-react/src/components/LoadingSpinner/*`
- `packages/ui-react/src/components/ActionBar/*`
- `packages/ui-react/src/components/Button/*`
- `packages/ui-react/src/components/ContextMenu/*`
- `packages/ui-react/src/components/DockPanel/*`
- `packages/ui-react/src/components/ItemSlot/*`
- `packages/ui-react/src/components/Switch/*`
- `packages/ui-react/src/components/Tabs/*`
- `packages/ui-react/src/components/Tooltip/*`
- `packages/ui-react/src/components/Window/*`
- `packages/ui-react/src/styles/_ui.scss`
- `package.json`
- `packages/client-web/package.json`
- `packages/client-web/src/styles/_ui.scss`
- `packages/client-web/src/ui/components/LoadingSpinner.tsx`
- `packages/client-web/src/ui/components/Switch/Switch.tsx`
- `packages/client-web/src/ui/components/Tabs/Tabs.tsx`
