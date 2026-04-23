# Game Settings

## Scope

This spec covers the desktop-style game settings window, its dock and hotkey access, the persisted graphics and shared audio controls exposed there, and the current save-area reset flow.

## Current Behavior

- A dedicated game settings window can be toggled from the left dock and with the `M` hotkey.
- The settings dock button is pinned to the bottom of the left dock instead of the main top-aligned button stack.
- Opening the settings window shows a fullscreen black translucent underlay behind the window chrome so it behaves like a modal surface over the viewport.
- The current settings content uses a reusable vertical tab strip and exposes `Graphics`, `Audio`, and `Saves` tabs.
- The settings window keeps the tab-specific control markup in neighboring graphics, audio, and saves panel components so the lazy-loaded content shell only owns draft state, tab switching, and save or reset actions.
- The graphics tab exposes preset-based renderer profiles for `Quality`, `Balanced`, and `Performance`, with `Balanced` as the current default profile and a `Custom` state when individual renderer flags diverge from a preset.
- The graphics tab keeps reusable switch controls for the persisted Pixi renderer initialization flags so advanced overrides can stay independent from the higher-level preset.
- The graphics tab also exposes a `Terrain backgrounds` switch that shows or hides biome art on revealed hexes, and this specific toggle applies on `Save` without a page reload.
- The audio tab stores shared audio preferences for mute state, music-only mute state, reduced-motion muting, individual synthesized sound-effect toggles, master volume, the current Tiks theme selection, the selected recorded voice actor, and per-event gameplay voice toggles.
- The mute toggle and master volume apply to background music, synthesized UI audio, and gameplay voice playback, the music-only mute toggle affects only background music, and the sound-effect toggles and Tiks theme remain scoped to synthesized interface sounds.
- UI audio waits for a user activation before initializing the audio engine, then applies the saved audio settings to document-wide hover, click, toggle, range, tab, and window interaction sounds.
- Gameplay voice playback waits for a user activation before playing, uses the selected actor and enabled event list, and stops any active voice clip immediately when mute or reduced-motion muting becomes active, including OS or browser reduced-motion preference changes that occur mid-playback.
- Graphics, audio, and world-map settings each persist in their own dedicated plain `localStorage` area outside the encrypted save areas, and the three settings modules reuse one shared browser-storage helper so startup can read renderer-init flags before game and renderer initialization begins.
- Graphics settings are normalized on load and save so malformed persisted values fall back to the current defaults instead of reaching Pixi initialization.
- `Save` persists the current settings immediately without reloading.
- `Save & Reload` persists the current settings immediately and then reloads the page so renderer-init changes apply to the live world canvas.
- The `Saves` tab surfaces separate reset actions for `Adventure`, `Window layout`, `Audio settings`, `Graphics settings`, and `World map`.
- Clicking a reset action opens a confirmation prompt before the app clears only that save area and reloads the page.
- The settings window does not expose a global reset-all-data action.
- The window keeps the shared title-bar close control used by the other desktop windows.
- Reopening the settings window reapplies its persisted width and height immediately instead of briefly rendering at the CSS default size first.

## Verification Path

- Toggle the settings window from both the dock button and the `M` hotkey and confirm persisted visibility autosaves like other UI-only window state.
- Change the renderer preset or one or more renderer flags, use `Save`, reload manually, and confirm the saved preset and flags hydrate back into Pixi initialization.
- Change the renderer preset or one or more renderer flags, use `Save & Reload`, and confirm the page reloads and the new renderer settings apply immediately after hydration.
- Toggle `Terrain backgrounds`, use `Save`, and confirm revealed world hexes hide or show their biome art immediately without reloading.
- Change audio toggles, volume, theme, voice actor, and voice event switches, use `Save`, and confirm the document-level UI sounds, background music, and gameplay voice playback respect the persisted choices after the next user activation.
- Trigger a gameplay voice line, toggle mute or reduced-motion muting before the clip finishes, and confirm the active line stops immediately.
- Trigger a gameplay voice line, enable reduced motion in the OS or browser while the clip is playing, and confirm the active line stops immediately without requiring another in-game state update.
- Open the `Saves` tab, cancel a reset prompt, and confirm the selected save area is unchanged.
- Reset `Adventure` or `Window layout`, confirm the page reloads, and confirm only that saved area falls back to defaults on the next hydration.
- Reset `Audio settings`, `Graphics settings`, or `World map`, confirm the page reloads, and confirm the targeted settings area returns to defaults without clearing the others.
- Run renderer-focused verification on the world map path after changing settings-related code: confirm normal hover interaction avoids avoidable redraw churn, confirm the world ticker owns the redraw loop, and confirm startup chunk growth stays within the existing `pnpm build:budget` envelope.

## Main Implementation Areas

- `src/app/App`
- `src/app/audio`
- `src/app/audioSettings.ts`
- `src/app/graphicsSettings.ts`
- `src/app/settingsNormalization.ts`
- `src/app/settingsSectionStore.ts`
- `src/app/settingsStorage.ts`
- `src/app/worldMapSettings.ts`
- `src/persistence/storage.ts`
- `src/ui/components/GameSettingsWindow`
- `src/ui/components/Tabs`
- `src/ui/components/Switch`
- `src/ui/components/WindowDock`
