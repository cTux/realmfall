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
- `packages/client` receives the library through a workspace dependency (`@realmfall/ui`) added in
  `packages/client/package.json`.
- `packages/ui` can bridge to existing client-owned i18n, gameplay, and Storybook fixture helpers through narrow local re-export modules under `packages/ui/src` while the reusable component implementations stay consolidated in the shared package.
- Shared buttons and button-like controls use one Slate Lift surface system, with the canonical palette and shared state selectors defined in `packages/client/src/styles/_ui.scss` and forwarded to the shared package through `packages/ui/src/styles/_ui.scss`.
- The Slate Lift resting fills stay lighter than the shared window title bar background, while selected and opened states reuse a brighter active fill so toggled controls read as elevated from the surrounding shell chrome.
- The shared `Button` primitive exposes the neutral and destructive surface choice through a `tone` prop, while preserving the shared compact-size path used by title-bar controls.
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
