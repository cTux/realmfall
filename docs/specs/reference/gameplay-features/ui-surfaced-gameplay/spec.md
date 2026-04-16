# UI Surfaced Gameplay

## Scope

This spec covers the gameplay features that are surfaced through the desktop-style UI and tooltip/log feedback systems.

## Current Behavior

- Gameplay state is exposed through draggable desktop-style windows.
- Current windows cover hero stats, equipment, inventory, recipes, combat, loot, log output, hex info, skills, debugger, game settings, and docked controls.
- New sessions start with every draggable window closed until the player opens one from the dock or a hotkey.
- The fixed left dock uses a dense icon-button stack at roughly 60% of the original button footprint so more windows fit without crowding the main play area.
- The game uses a custom tooltip system for world objects and item affordances.
- Window chrome is consistent across the desktop UI, including shared close-button tooltips, empty equipment-slot tooltips, resizable inventory, loot, and log surfaces, and focus styling that does not nudge active windows.
- Hero and combat ability, buff, and debuff tiles keep a fixed position while hovered so tooltip affordances do not make the icons jump.
- Pressing `Esc` closes every currently open window.
- World camp markers stay readable above their night-time glow effects instead of sinking beneath the bloom layer.
- Logs provide system, movement, combat, loot, and other gameplay feedback.
- Filtered log viewing is part of the current gameplay readability loop.
- Current and maximum value bars surface their meaning through the shared tooltip system.
- Log entries show a compact `HH:MM` timestamp in the visible list, while hover reveals the full calendar timestamp using the same world-calendar formatter as the debugger window.

## Main Implementation Areas

- `src/app/App`
- `src/ui/components`
- `src/ui/tooltips.ts`
- `src/game/logs.ts`
