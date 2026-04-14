# UI Surfaced Gameplay

## Scope

This spec covers the gameplay features that are surfaced through the desktop-style UI and tooltip/log feedback systems.

## Current Behavior

- Gameplay state is exposed through draggable desktop-style windows.
- Current windows cover hero stats, equipment, inventory, recipes, combat, loot, log output, hex info, skills, debugger, and docked controls.
- The game uses a custom tooltip system for world objects and item affordances.
- Logs provide system, movement, combat, loot, and other gameplay feedback.
- Filtered log viewing is part of the current gameplay readability loop.
- Current and maximum value bars surface their meaning through the shared tooltip system.
- Log entries show a compact `HH:MM` timestamp in the visible list, while hover reveals the full calendar timestamp using the same world-calendar formatter as the debugger window.

## Main Implementation Areas

- `src/app/App`
- `src/ui/components`
- `src/ui/tooltips.ts`
- `src/game/logs.ts`
