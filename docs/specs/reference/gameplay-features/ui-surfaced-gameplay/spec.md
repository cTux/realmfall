# UI Surfaced Gameplay

## Scope

This spec covers the gameplay features that are surfaced through the desktop-style UI and tooltip/log feedback systems.

## Current Behavior

- Gameplay state is exposed through draggable desktop-style windows.
- Current windows cover hero stats, equipment, inventory, recipes, combat, loot, log output, hex info, skills, game settings, and docked controls.
- New sessions start with every draggable window closed until the player opens one from the dock or a hotkey.
- The fixed left dock uses a dense icon-button stack at roughly 60% of the original button footprint so more windows fit without crowding the main play area.
- The game uses a custom tooltip system for world objects and item affordances.
- Window chrome is consistent across the desktop UI, including shared close-button tooltips, rounded window corners, empty equipment-slot tooltips, resizable inventory, loot, and log surfaces, and focus styling that does not nudge active windows.
- Hero and combat ability, buff, and debuff tiles keep a fixed position while hovered so tooltip affordances do not make the icons jump.
- Ability tooltips now include a human-readable description that summarizes the ability target and its combat effects before the numeric rows.
- Buff and debuff tooltips now also include human-readable effect descriptions instead of generic positive or negative fallback text.
- Attacking ability tooltips surface their current base damage for the hovered combatant, while non-damaging support abilities omit that damage row.
- Ability tooltips now show icon-backed buff or debuff rows for any status effects they grant or inflict.
- Damaging debuff tooltips surface their live damage amount from the active status instance, including stack-aware poison and burning damage.
- Combat ability tiles render the live ability icon asset and visually desaturate and fade while the ability is unavailable, without showing a ticking cooldown overlay.
- Combat entity cards show HP and mana bars only; active casts do not render a separate cast bar.
- Combat entity cards snap their ability-availability view models to a short visual cadence instead of rebuilding every card on every world-clock tick.
- Action bar consumable bindings clear themselves once the assigned stack no longer exists in inventory, so depleted consumables do not linger as unavailable stale slots.
- Action bar consumable slots do not render a cooldown overlay while the shared consumable recharge is active.
- Pressing `Space` toggles a paused state for gameplay mechanics and shows a centered full-stage overlay message until the game is resumed, except when keyboard focus is inside an editable field or another focusable UI control that should keep its native `Space` behavior.
- Pressing `Esc` closes every currently open window.
- While the hex info window is open, the title-bar land actions surface inline `A` and `O` hotkeys through `Cl(a)im` / `Uncl(a)im` and `H(o)me`, and those keys trigger the enabled action directly.
- While a combat encounter remains active for longer than `60s`, the hex info title bar replaces the start action with `Dea(t)h`, and pressing `T` triggers the same defeat-and-respawn action.
- World camp markers stay readable above their night-time glow effects instead of sinking beneath the bloom layer.
- World-map hostile enemy markers tint by runtime enemy rarity, and mixed enemy parties use the highest rarity color on that tile.
- World-map hostile enemy markers show a bottom-right count badge when a visible enemy party shares the hex, surfacing the party size for stacks of `2` or `3`.
- World-map hostile enemy and world-boss markers now pulse with a small deterministic hover motion so combat-heavy hexes read as active without forcing a static-layer redraw.
- World-map settlement, faction-claim, dungeon, and crafting-site markers now bob or pulse subtly, with utility sites picking up a stronger warm tint after dark so the world view reads as inhabited instead of static.
- World-map gathering markers for ore, herbs, timber, and water now catch an intermittent deterministic shimmer so resource hexes feel active without turning into constant bouncing icons.
- The canvas renderer now shows a fullscreen red warning effect when the player's HP drops below `30%`, and the warning clears once HP reaches `30%` or higher.
- Logs provide system, movement, combat, loot, and other gameplay feedback.
- Combat log entries render with white baseline copy, color damage red and healing green, tint enemy names by rarity, and surface hoverable inline source chips with icons and combat tooltips for logged combat sources.
- The newest log row renders immediately and the log list stays pinned to the bottom when new entries arrive, so the active message does not linger on a partial fragment.
- Filtered log viewing is part of the current gameplay readability loop.
- Large recipe lists reveal additional rows in explicit batches instead of mounting the whole matching catalog at once.
- Current and maximum value bars surface their meaning through the shared tooltip system.
- Hovering a non-player combat entity's HP bar now opens a stat sheet tooltip with that entity's current combat stats.
- The character info window now surfaces primary and secondary stat sections beneath the shared combat-style resource bars.
- The character info window now uses the shared resizable shell and scrolls its content inside the window body when the stat list outgrows the current size.
- Overcapped secondary bonuses render their effective total plus the preserved raw total so capped values remain readable in the character info window.
- Log entries show a compact `HH:MM` timestamp in the visible list, while hover reveals the full calendar timestamp using the shared world-calendar formatter.

## Main Implementation Areas

- `src/app/App`
- `src/ui/components`
- `src/ui/tooltips.ts`
- `src/game/logs.ts`
