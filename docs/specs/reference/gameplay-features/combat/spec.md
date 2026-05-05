# Combat

## Scope

This spec covers encounter activation, actor timing, and combat resolution.

## Current Behavior

- Any encounter source starts combat immediately, including stepping onto a hostile tile, clicking a hostile world hex, and contact from a roaming dungeon enemy chase.
- Hostile world clicks never move the player onto the hostile hex before the encounter begins.
- Clicking an adjacent hostile hex starts combat from the current hex, keeps the player on that staging hex until victory, and preserves the hostile hex as the encounter target.
- Clicking a farther hostile hex paths only to the nearest reachable adjacent staging hex, then starts combat there against the originally clicked hostile hex while preserving that hostile target through the encounter.
- Battles that run for longer than `60s` surface a `Dea(t)h` title-bar action that accepts defeat, kills the player, and respawns them at their home hex.
- Winning a hostile-click or roaming-chase encounter can auto-step the player onto the preserved hostile target after the final enemy dies, then the app applies the normal movement cooldown for that step.
- While combat is active, regular travel is blocked.
- Combat uses actor state for the player and each enemy.
- Every actor has a global cooldown.
- Current baseline global cooldown is `2000ms` before attack-speed modifiers are applied.
- `Kick` remains the default baseline ability for every combat actor, but it now has the lowest cast priority.
- Combat now ships with a broader ability catalog covering melee, fire, lightning, ice, and support roles, with cooldown, mana cost, cast time, targeting, and icon data defined per ability.
- Every ability except `Kick` spends mana, and non-default abilities have a minimum mana cost floor of `5` per cast.
- Enemies now have a default `100` mana pool and must also afford ability mana costs before they can cast non-free skills.
- All battle entities start with a baseline `5%` critical strike chance before equipment modifiers are added.
- All battle entities also start with baseline `5%` dodge chance and `5%` suppress-damage chance before equipment modifiers are added.
- Ability execution supports direct damage, multi-target attacks, healing, heal-over-time, permanent battle buffs and debuffs, and short high-value buffs and debuffs.
- Single-target and random-target player abilities resolve their damage and status effects against the same chosen target instead of retargeting status application separately.
- Defense subtracts directly from incoming attack power before the final damage value is applied.
- Direct damage may be fully absorbed by defense instead of being forced to deal a minimum of `1`, and the combat log reports absorbed, dodged, blocked, and damage-suppressed hits explicitly instead of logging a `0 damage` hit.
- When player debuff-suppression prevents a hostile status application, the combat log records that the incoming debuff was shrugged off.
- Enemy ability loadouts are rolled deterministically by rarity:
  `common` enemies keep only `Kick`, `uncommon` enemies add `1` extra ability, `rare` and `epic` enemies add `2`, and `legendary` enemies or world bosses add `3`.
- Enemy AI evaluates its available abilities in priority order, favoring higher-cooldown skills before low-cooldown fillers and only falling back to `Kick` after stronger options are unavailable.
- Treasure goblins are legendary enemies that never start enemy attacks or casts.
- Each treasure goblin battle rolls a deterministic escape threshold of `3` to `5` successful damaging hits, counting direct damage and damage-over-time ticks only when they deal positive damage.
- When a treasure goblin reaches its escape threshold and a free valid hex exists within radius `10`, it teleports away and the current battle ends immediately; when no valid escape hex exists, it stays in combat.
- Actors track cooldowns, cast state, and effective cooldown values.
- Hovering a non-player combat entity's HP bar surfaces that entity's current primary stats plus combat-relevant secondary stats in the shared tooltip system.
- Combat progresses through repeated state resolution.
- Combat automation wakes on the earliest pending combat event, including cast completions, ability readiness, damage-over-time or heal-over-time ticks, and status-effect expirations, so timed effects do not leave encounters idling until a later cooldown finishes.
- Winning combat removes enemies from the tile and can leave loot behind.
- Combat end clears the encounter state and logs the outcome.
- Encounter creation stays on the travel path in `state.ts`, while combat timing and battle-resolution orchestration live in `stateCombat.ts` beside the lower-level combat runtime helpers in `combat.ts`.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/stateCombat.ts`
- `src/game/combat.ts`
- `src/ui/components/CombatWindow/CombatWindowContent.tsx`
