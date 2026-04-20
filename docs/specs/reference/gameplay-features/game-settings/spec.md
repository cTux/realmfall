# Game Settings

## Scope

This spec covers the desktop-style game settings window, its dock and hotkey access, the persisted graphics and UI-audio controls exposed there, and the current save-data reset flow.

## Current Behavior

- A dedicated game settings window can be toggled from the left dock and with the `M` hotkey.
- The settings dock button is pinned to the bottom of the left dock instead of the main top-aligned button stack.
- Opening the settings window shows a fullscreen black translucent underlay behind the window chrome so it behaves like a modal surface over the viewport.
- The current settings content uses a reusable vertical tab strip and currently exposes `Graphics` and `Audio` tabs.
- The graphics tab uses reusable switch controls to edit persisted Pixi renderer initialization flags.
- The audio tab stores UI-audio preferences for mute state, reduced-motion muting, individual synthesized sound-effect toggles, master volume, the current Tiks theme selection, the selected recorded voice actor, and per-event gameplay voice toggles.
- UI audio waits for a user activation before initializing the audio engine, then applies the saved audio settings to document-wide hover, click, toggle, range, tab, and window interaction sounds.
- Gameplay voice playback waits for a user activation before playing, uses the selected actor and enabled event list, and stops any active voice clip immediately when mute or reduced-motion muting becomes active.
- Settings are stored in a dedicated plain `localStorage` `settings` payload outside the encrypted save payload so startup can read renderer-init flags before game and renderer initialization begins, while the same shared payload also carries audio and world-map settings.
- Graphics settings continue to migrate forward from the legacy `realmfall-graphics-settings` key into the shared `settings` payload on load.
- Graphics settings are normalized on load and save so malformed persisted values fall back to the current defaults instead of reaching Pixi initialization.
- `Save` persists the current settings immediately without reloading.
- `Save & Reload` persists the current settings immediately and then reloads the page so renderer-init changes apply to the live world canvas.
- `Reset Save Data` requires a continuous five-second press-and-hold interaction with a filling progress state before it clears persisted save and UI data and reloads the page.
- The window keeps the shared title-bar close control used by the other desktop windows.
- Reopening the settings window reapplies its persisted width and height immediately instead of briefly rendering at the CSS default size first.

## Verification Path

- Toggle the settings window from both the dock button and the `M` hotkey and confirm persisted visibility still autosaves like other UI-only window state.
- Change one or more renderer flags, use `Save`, reload manually, and confirm the saved flags hydrate back into Pixi initialization.
- Change one or more renderer flags, use `Save & Reload`, and confirm the page reloads and the new flags apply immediately after hydration.
- Change audio toggles, volume, theme, voice actor, and voice event switches, use `Save`, and confirm the document-level UI sounds and gameplay voice playback respect the persisted choices after the next user activation.
- Trigger a gameplay voice line, toggle mute or reduced-motion muting before the clip finishes, and confirm the active line stops immediately.
- Hold `Reset Save Data` for less than five seconds and confirm nothing is deleted, then hold for at least five seconds and confirm saved game and UI state are cleared before reload.
- Run renderer-focused verification on the world map path after changing settings-related code: confirm normal hover interaction still avoids avoidable redraw churn, confirm the world ticker still owns the redraw loop, and confirm startup chunk growth stays within the existing `pnpm build:budget` envelope.

## Main Implementation Areas

- `src/app/App`
- `src/app/audio`
- `src/app/audioSettings.ts`
- `src/app/graphicsSettings.ts`
- `src/app/settingsStorage.ts`
- `src/app/worldMapSettings.ts`
- `src/persistence/storage.ts`
- `src/ui/components/GameSettingsWindow`
- `src/ui/components/Tabs`
- `src/ui/components/Switch`
- `src/ui/components/WindowDock`
