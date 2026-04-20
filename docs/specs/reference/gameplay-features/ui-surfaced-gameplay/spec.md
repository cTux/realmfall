# UI Surfaced Gameplay

## Scope

This spec covers the gameplay features that are surfaced through the desktop-style UI and tooltip/log feedback systems.

## Current Behavior

- Gameplay state is exposed through draggable desktop-style windows.
- Current windows cover hero stats, equipment, inventory, recipes, combat, loot, log output, hex info, skills, game settings, and docked controls.
- New sessions start with every draggable window closed until the player opens one from the dock or a hotkey.
- The fixed left dock uses a dense icon-button stack at roughly 60% of the original button footprint so more windows fit without crowding the main play area.
- The game uses a custom tooltip system for world objects and item affordances.
- Window chrome is consistent across the desktop UI, including shared close-button tooltips, empty equipment-slot tooltips, resizable inventory, loot, and log surfaces, and focus styling that does not nudge active windows.
- Hero and combat ability, buff, and debuff tiles keep a fixed position while hovered so tooltip affordances do not make the icons jump.
- Ability tooltips now include a human-readable description that summarizes the ability target and its combat effects before the numeric rows.
- Buff and debuff tooltips now also include human-readable effect descriptions instead of generic positive or negative fallback text.
- Attacking ability tooltips surface their current base damage for the hovered combatant, while non-damaging support abilities omit that damage row.
- Ability tooltips now show icon-backed buff or debuff rows for any status effects they grant or inflict.
- Damaging debuff tooltips surface their live damage amount from the active status instance, including stack-aware poison and burning damage.
- Hero and combat ability tiles now render the live ability icon asset, show a vertical cooldown fill over the icon, and visually desaturate and fade while the ability is unavailable.
- Combat entity cards now show a yellow cast bar beneath the resource bars whenever that entity is actively casting, with the fill advancing through the cast duration and the active ability name shown on the bar.
- Combat entity cards snap their cooldown and cast-bar view models to a short visual cadence instead of rebuilding every card on every world-clock tick.
- Action bar consumable bindings clear themselves once the assigned stack no longer exists in inventory, so depleted consumables do not linger as unavailable stale slots.
- Action bar consumables now show the same vertical cooldown overlay style used for abilities, and a shared consumable cooldown overlays every populated slot while any consumable is recharging.
- Pressing `Esc` closes every currently open window.
- World camp markers stay readable above their night-time glow effects instead of sinking beneath the bloom layer.
- Logs provide system, movement, combat, loot, and other gameplay feedback.
- Combat log entries render with white baseline copy, color damage red and healing green, tint enemy names by rarity, and surface hoverable inline source chips with icons and combat tooltips for logged combat sources.
- Filtered log viewing is part of the current gameplay readability loop.
- Large recipe lists reveal additional rows in explicit batches instead of mounting the whole matching catalog at once.
- Current and maximum value bars surface their meaning through the shared tooltip system.
- The character info window currently focuses on shared combat-style resource bars and no longer lists the full derived combat stat sheet inline.
- Log entries show a compact `HH:MM` timestamp in the visible list, while hover reveals the full calendar timestamp using the shared world-calendar formatter.

## Main Implementation Areas

- `src/app/App`
- `src/ui/components`
- `src/ui/tooltips.ts`
- `src/game/logs.ts`
