# Game Settings

## Scope

This spec covers the desktop-style game settings window, its dock and hotkey access, and the current renderer/save-data actions exposed there.

## Current Behavior

- A dedicated game settings window can be toggled from the left dock and with the `M` hotkey.
- The settings dock button is pinned to the bottom of the left dock instead of the main top-aligned button stack.
- Opening the settings window shows a fullscreen black translucent underlay behind the window chrome so it behaves like a modal surface over the viewport.
- The current settings content uses a reusable tab strip and currently exposes a `Graphic settings` tab.
- The graphic settings tab uses reusable switch controls to edit persisted Pixi renderer initialization flags.
- `Save` persists the current settings immediately without reloading.
- `Save & Reload` persists the current settings immediately and then reloads the page so renderer-init changes apply to the live world canvas.
- `Reset Save Data` requires a continuous five-second press-and-hold interaction with a filling progress state before it clears persisted save and UI data and reloads the page.
- The window keeps the shared title-bar close control used by the other desktop windows.

## Verification Path

- Toggle the settings window from both the dock button and the `M` hotkey and confirm persisted visibility still autosaves like other UI-only window state.
- Change one or more renderer flags, use `Save`, reload manually, and confirm the saved flags hydrate back into Pixi initialization.
- Change one or more renderer flags, use `Save & Reload`, and confirm the page reloads and the new flags apply immediately after hydration.
- Hold `Reset Save Data` for less than five seconds and confirm nothing is deleted, then hold for at least five seconds and confirm saved game and UI state are cleared before reload.
- Run renderer-focused verification on the world map path after changing settings-related code: confirm normal hover interaction still avoids avoidable redraw churn, confirm the world ticker still owns the redraw loop, and confirm startup chunk growth stays within the existing `pnpm build:budget` envelope.

## Main Implementation Areas

- `src/app/App`
- `src/app/graphicsSettings.ts`
- `src/persistence/storage.ts`
- `src/ui/components/GameSettingsWindow`
- `src/ui/components/Tabs`
- `src/ui/components/Switch`
- `src/ui/components/WindowDock`
