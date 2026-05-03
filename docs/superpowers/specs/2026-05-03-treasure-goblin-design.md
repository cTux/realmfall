# Treasure Goblin Design

## Summary

Add a new legendary enemy type, `treasure-goblin`, that can replace an ordinary overworld hostile spawn with a `0.5%` chance. Treasure goblins are high-HP loot targets: they do not attack, they flee by teleporting away after `3` to `5` successful damaging hits, and they produce sharply increased loot rewards if killed before escaping.

## Goals

- Add a canonical `treasure-goblin` enemy type with its own id, content config, name, and icon entry.
- Allow treasure goblins to appear only from ordinary hostile overworld spawns.
- Keep treasure goblins as single-enemy encounters rather than dungeon packs.
- Scale treasure goblin max HP to `20x` the usual legendary enemy HP for the same tile.
- Prevent treasure goblins from making combat attacks.
- Make treasure goblins flee after `3` to `5` successful damaging hits by teleporting to a free hex within radius `10` and ending the current battle.
- Triple treasure goblin item-drop chance on death.
- Triple treasure goblin item-drop rarity scaling on death.
- Multiply treasure goblin gold drops by `20` on death.

## Non-Goals

- Do not let treasure goblins replace dungeon enemy packs.
- Do not let treasure goblins spawn from claims, towns, camps, or other structured non-overworld tiles.
- Do not change ordinary legendary enemy behavior or global legendary rarity rules.
- Do not add a second enemy-selection system parallel to the existing deterministic enemy config chooser.

## Current Problem

Hostile spawn selection currently chooses one ordinary enemy type for a tile, combat assumes enemies can cast from their equipped ability list, and enemy rewards scale from shared rarity and tier rules. There is no existing enemy that behaves like a passive loot runner with custom flee logic and reward multipliers.

## Recommended Approach

Represent treasure goblin as a real enemy type plus a narrow special-case selection rule in the ordinary overworld hostile spawn path.

- Enemy content owns the goblin's canonical identity.
- Overworld spawn selection owns the `0.5%` replacement chance.
- Combat owns the non-attacking and flee-on-hit behavior.
- Reward resolution owns the goblin-specific drop multipliers.

This keeps the feature aligned with the current split between content, spawn selection, combat orchestration, and reward helpers.

## Spawn Rules

### Where The Chance Applies

The `0.5%` treasure goblin chance applies only when the game would otherwise create an ordinary hostile overworld tile spawn:

- passable tile
- no claim
- no structure
- not a dungeon
- not a world-boss footprint
- normal tile hostile spawn path, not debug or explicit enemy overrides

It does not apply to:

- dungeon-generated enemy packs
- world bosses
- night ambushes
- faction NPCs
- manual debug spawns unless explicitly requested later

### Spawn Shape

- A successful treasure goblin roll produces exactly one enemy on that tile.
- The encounter remains a single-enemy hostile tile.
- Treasure goblin rarity is forced to `legendary`.
- The tile does not also roll an additional normal hostile enemy.

### Determinism

Treasure goblin replacement must remain deterministic from the same seed and coordinate inputs used by the existing spawn system so repeated loads resolve the same tile the same way.

## Enemy Identity And Stats

- Add `treasure-goblin` to the canonical enemy ids.
- Add a dedicated enemy config file under `packages/client/src/game/content/enemies`.
- Use canonical enemy tags so later reward or UI logic can identify the goblin without name checks.
- Keep attack and defense on the normal legendary baseline for the tile.
- Multiply max HP by `20` after the ordinary legendary stat calculation for that spawn.

The result is "legendary survivability target with loot-special behavior" rather than a full combat-threat upgrade.

## Combat Behavior

### No Attacks

Treasure goblins do not attack.

Recommended implementation:

- keep the goblin on the normal combat roster
- short-circuit enemy cast start for the goblin enemy type
- do not rely on random ability pools or `Kick` fallback for this enemy

This is safer than hoping an empty ability list or priority side effect suppresses behavior indirectly.

### Flee Trigger

Each treasure goblin rolls a deterministic flee threshold of `3`, `4`, or `5` hits for the current encounter.

A qualifying hit is:

- a player-driven or status-driven damage event
- that reduces the goblin's HP by more than `0`

Non-qualifying events:

- dodged hits
- blocked hits
- fully absorbed hits
- zero-damage results

Damage-over-time ticks count if they actually remove HP.

### Encounter State

The encounter needs to track:

- the goblin's flee threshold for that battle
- how many qualifying hits it has taken in that battle

This state is battle-scoped, not a permanent enemy progression stat. If the game is saved mid-combat, the additive save shape should preserve the current combat tracking so the resumed encounter does not reroll or forget progress.

### Teleport And Battle End

When the qualifying-hit count reaches the threshold and the goblin is not dead:

1. Find a free destination hex within radius `10`.
2. Move the goblin from the current tile to the destination tile.
3. Remove the goblin from the current combat encounter.
4. End the current battle.
5. Add a combat log entry describing the teleport escape.

If no valid destination exists:

- the goblin stays on the current tile
- combat continues
- the flee counter remains satisfied so later qualifying hits retry the teleport

This avoids ending combat while leaving the hostile goblin on the player's tile.

## Teleport Destination Rules

Candidate destination hexes:

- must be within hex radius `10`
- must not be the current combat hex
- must not be the player's current hex

Valid destination tiles must be:

- passable
- unclaimed
- structure-free
- free of existing enemies
- outside world-boss footprint occupancy

The chosen destination should be deterministic from encounter inputs and selected from the valid candidate pool at random using the shared RNG approach.

## Reward Rules

Treasure goblin reward bonuses apply only when the goblin dies before escaping.

### Gold

- Start from the standard non-boss enemy-gold resolution.
- Multiply the final gold quantity by `20`.
- Keep the normal gold-drop chance unless later balancing says otherwise.

### Item Drops

- Multiply the enemy item-drop entry chance by `3` before clamping.
- Multiply the item rarity chance scale by `3`.
- Keep the existing per-kind evaluation order and independent kind-roll behavior.

### Other Rewards

- Leave XP, recipe pages, home scrolls, terraforming consumables, skinning, and blood moon logic unchanged unless the existing shared reward code naturally composes with the goblin's multiplied item and gold rules.
- Treasure goblin is not expected to use animal-only skinning rewards.

## Config

Add explicit gameplay config values for the feature instead of hardcoding them in content or combat helpers.

Recommended config group:

- `worldGeneration.enemySpawn.treasureGoblinChance`
- `balance.enemy.treasureGoblin.hpMultiplier`
- `balance.enemy.treasureGoblin.fleeMinHits`
- `balance.enemy.treasureGoblin.fleeMaxHits`
- `balance.enemy.treasureGoblin.fleeRadius`
- `drops.enemyGold.treasureGoblinMultiplier`
- `drops.enemyItem.treasureGoblinChanceMultiplier`
- `drops.enemyItem.treasureGoblinRarityMultiplier`

## Persistence

This feature likely adds additive save shape under active combat state, not under the persistent enemy catalog.

Preferred shape:

- extend combat state with goblin encounter metadata keyed by enemy id, or
- extend the relevant combat actor state with narrow goblin flee metadata

Hydration must treat missing fields as "ordinary enemy, no goblin flee progress" so older saves stay valid.

## Testing

Add or update deterministic tests for:

- enemy content registry exposes the new canonical enemy type
- ordinary overworld hostile spawn can deterministically select treasure goblin
- dungeon packs do not select treasure goblin
- treasure goblin spawns as a single hostile enemy
- treasure goblin max HP equals `20x` the ordinary legendary baseline for the same spawn context
- treasure goblin never starts enemy attacks
- qualifying damage hits increment flee progress
- zero-damage outcomes do not increment flee progress
- treasure goblin teleports after the rolled `3` to `5` hit threshold
- teleport removes the goblin from the current encounter and ends combat
- invalid teleport candidates are rejected
- treasure goblin death multiplies gold quantity by `20`
- treasure goblin death multiplies item-drop chance by `3`
- treasure goblin death multiplies item-rarity scaling by `3`

## File Targets

Likely touch points:

- `packages/client/game.config.ts`
- `packages/client/src/game/gameConfigSchema.ts`
- `packages/client/src/game/config.ts`
- `packages/client/src/game/content/ids.ts`
- `packages/client/src/game/content/icons.ts`
- `packages/client/src/game/content/enemies/treasureGoblin.ts`
- `packages/client/src/game/content/enemies/enemyCatalog.ts`
- `packages/client/src/game/content/enemies/enemySelection.ts`
- `packages/client/src/game/combat.ts`
- `packages/client/src/game/stateCombat.ts`
- `packages/client/src/game/stateCombatRuntime.ts`
- `packages/client/src/game/stateCombatCasting.ts`
- `packages/client/src/game/stateCombatEncounterSync.ts`
- `packages/client/src/game/stateRewards.ts`
- matching gameplay tests in `packages/client/src/game`

## Resolved Decisions

- The `0.5%` chance applies to ordinary hostile overworld spawns, not only to ordinary legendary spawns.
- Treasure goblins are restricted to single-enemy overworld encounters.
- Treasure goblins use normal legendary attack and defense scaling but `20x` legendary HP.
- Treasure goblins count successful damaging hits, not raw damage amount, toward escape.
- Damage-over-time ticks count when they actually reduce HP.
- Treasure goblins end the current battle only after a successful teleport destination is found.
