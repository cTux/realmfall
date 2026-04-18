# Combat

## Scope

This spec covers encounter activation, actor timing, and combat resolution.

## Current Behavior

- Entering a tile with hostile enemies opens a combat state.
- Combat must be started explicitly from the combat window.
- While combat is active, regular travel is blocked.
- Combat uses actor state for the player and each enemy.
- Every actor has a global cooldown.
- Current baseline global cooldown is `1500ms`.
- `Kick` remains the default baseline ability for every combat actor, but it now has the lowest cast priority.
- Combat now ships with a broader ability catalog covering melee, fire, lightning, ice, and support roles, with cooldown, mana cost, cast time, targeting, and icon data defined per ability.
- Every ability except `Kick` spends mana, and non-default abilities have a minimum mana cost floor of `5` per cast.
- Ability execution supports direct damage, multi-target attacks, healing, heal-over-time, permanent battle buffs and debuffs, and short high-value buffs and debuffs.
- Enemy ability loadouts are rolled deterministically by rarity:
  `common` enemies keep only `Kick`, `uncommon` enemies add `1` extra ability, `rare` and `epic` enemies add `2`, and `legendary` enemies or world bosses add `3`.
- Enemy AI evaluates its available abilities in priority order, favoring higher-cooldown skills before low-cooldown fillers and only falling back to `Kick` after stronger options are unavailable.
- Actors track cooldowns, cast state, and effective cooldown values.
- Combat progresses through repeated state resolution.
- Winning combat removes enemies from the tile and can leave loot behind.
- Combat end clears the encounter state and logs the outcome.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/combat.ts`
- `src/ui/components/CombatWindow/CombatWindowContent.tsx`
