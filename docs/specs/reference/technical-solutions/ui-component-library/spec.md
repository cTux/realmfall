# UI Component Library

## Scope

This spec covers the reusable UI component library in `packages/ui`, its Storybook workflow, and the client-side adoption pattern.

## Current Solution

- `packages/ui` is a dedicated library package containing reusable UI primitives for `packages/client`.
- The package is built through Vite library mode using `packages/ui/vite.config.ts`.
- The package includes Storybook coverage for each exported component in `packages/ui`.
- `packages/client` imports shared components directly from `@realmfall/ui` at their call sites.
- `packages/ui` is the single shared export surface for reusable UI primitives via `packages/ui/src/index.ts`.
- Shared gameplay-aware controls such as `ActionBar`, `ActionBarSlot`, `Tooltip`, `ContextMenu`, `ItemSlot`, and `DockPanel` live in `packages/ui`, and their stories live there as well.
- Legacy client-local copies of shared controls such as `ActionBar`, `Tooltip`, `ContextMenu`, and `ItemSlot` have been removed; client coverage now asserts the shared exports directly instead of comparing parallel implementations.
- `packages/client` receives the library through a workspace dependency (`@realmfall/ui`) added in
  `packages/client/package.json`.
- `packages/ui` owns its runtime i18n contract locally, while `packages/client/src/i18n/index.ts` loads locale assets and seeds that shared translation state for the app at runtime.
- The only retained TypeScript bridge from `packages/ui` back into `packages/client/src` is the Storybook fixture helper under `packages/ui/src/components/storybook/storybookHelpers.tsx`, while `packages/ui/src/styles/_ui.scss` remains the isolated shared surface-token forward.
- Shared package-owned UI helpers such as `packages/ui/src/icons.ts`, `packages/ui/src/iconAssets.ts`, `packages/ui/src/itemMetadata.ts`, `packages/ui/src/formatters.ts`, `packages/ui/src/tooltips.ts`, and `packages/ui/src/tooltipPlacement.ts` resolve shared display concerns locally instead of re-exporting `packages/client/src/ui/*`.
- Shared gameplay-aware controls inside `packages/ui` own narrow structural view contracts and helper logic under `packages/ui/src/game` for item-centric display and interaction state instead of importing broad client gameplay state types directly.
- `packages/ui/src/game` is a UI-owned contract layer. Its content ids, tags, and item classification helpers do not re-export `packages/client/src/game/content/*`.
- Shared item presentation metadata in `packages/ui` is the single source for canonical item-category fallback rules: shared tag constants and slot-to-category mapping are resolved there and then reused by client configuration helpers.
- Shared item visual metadata is intentionally consumed through materialized item fields first (including optional `tint`), so item visuals align between shared and client surfaces without direct configuration lookups during rendering.
- `packages/client/src/ui/icons.ts` keeps enemy, structure, skill, and local configured item behavior and then delegates shared item icon/tint behavior to `@realmfall/ui`.
- `packages/ui/src/game/__tests__/boundary.spec.test.ts` enforces the broader shared-package boundary across `packages/ui/src/**`, allowing only the explicit Storybook helper bridge in TypeScript while the SCSS surface forward remains documented separately.
- Shared controls that only need gameplay-derived scalar values, such as corruption break chance text, receive those values from the client caller through props instead of importing client gameplay config into the shared package.
- Shared display-only chrome such as `WindowLabel` and `WindowDock` now render from structural props owned in `packages/ui` instead of importing client window registries or client-only label types just to render text.
- Shared `packages/ui` stories that only need representative gameplay-shaped items use local fixture objects or existing Storybook fixtures instead of routing through `packages/ui/src/game` into client gameplay builders.
- Shared buttons and button-like controls use one Slate Lift surface system, with the canonical palette and shared state selectors defined in `packages/client/src/styles/_ui.scss` and forwarded to the shared package through `packages/ui/src/styles/_ui.scss`.
- The Slate Lift resting fills stay lighter than the shared window title bar background, while selected and opened states reuse a brighter active fill so toggled controls read as elevated from the surrounding shell chrome.
- The shared `Button` primitive exposes the neutral and destructive surface choice through a `tone` prop, while preserving the shared compact-size path used by title-bar controls.
- The compact title-bar contract uses one shared minimum height across text actions and the icon-only close control, so content-window actions such as `Home` and the close button stay aligned without per-shell size overrides.
- Title-bar buttons, tabs, dock buttons, and chip-like controls all reuse the same surface palette through the `window-header-button`, `tab-surface`, `dock-button-surface`, and `chip-surface` SCSS mixins instead of defining separate control palettes.
- Shared window shells render the close control as an ordinary shared `Button` with inline icon content from `WindowFrame` rather than exporting a dedicated close-button component.
- Shared Storybook fixtures keep the surface-system states visible at the component-library layer: `Button` covers neutral, destructive, compact, and icon-only usage; `Tabs` covers the selected state; and `WindowDock` covers opened and attention states.
- New shared component guidance lives in `packages/ui/README.md`:
  - place each component under `src/components`
  - export it from `src/index.ts`
  - add a Storybook story file
  - keep component behavior and styles local

## Files

- `packages/ui/package.json`
- `packages/ui/vite.config.ts`
- `packages/ui/tsconfig.json`
- `packages/ui/tsconfig.build.json`
- `packages/ui/tsconfig.node.json`
- `packages/ui/.storybook/main.ts`
- `packages/ui/.storybook/preview.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/game/*`
- `packages/ui/src/icons.ts`
- `packages/ui/src/iconAssets.ts`
- `packages/ui/src/itemMetadata.ts`
- `packages/ui/src/formatters.ts`
- `packages/ui/src/tooltips.ts`
- `packages/ui/src/tooltipPlacement.ts`
- `packages/ui/src/components/LoadingSpinner/*`
- `packages/ui/src/components/ActionBar/*`
- `packages/ui/src/components/Button/*`
- `packages/ui/src/components/ContextMenu/*`
- `packages/ui/src/components/DockPanel/*`
- `packages/ui/src/components/ItemSlot/*`
- `packages/ui/src/components/Switch/*`
- `packages/ui/src/components/Tabs/*`
- `packages/ui/src/components/Tooltip/*`
- `packages/ui/src/components/Window/*`
- `packages/ui/src/styles/_ui.scss`
- `package.json`
- `packages/client/package.json`
- `packages/client/src/styles/_ui.scss`
- `packages/client/src/ui/components/LoadingSpinner.tsx`
- `packages/client/src/ui/components/Switch/Switch.tsx`
- `packages/client/src/ui/components/Tabs/Tabs.tsx`
