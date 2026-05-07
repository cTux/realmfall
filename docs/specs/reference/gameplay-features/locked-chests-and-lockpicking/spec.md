# Locked Chests And Lockpicking

## Scope

This spec covers locked chest world spawns, chest opener items, the lockpicking skill, and mimic reveals.

## Current Behavior

- Locked chests spawn through their own rare global structure band above dungeons.
- Locked chest tooltips describe the tile as a sealed chest and tell the player to stand on the hex before using a lockpick or chest key.
- Each locked chest deterministically rolls a `10%` mimic replacement chance from the world seed plus chest coordinate.
- Mimics use the same locked chest icon and tooltip presentation as ordinary locked chests until the player spends an opener on that tile.
- Lockpicks and chest keys are stackable consumables that can only be used while the player is standing on a locked chest hex.
- Lockpicks have a base `75%` break chance, gain `1` lockpicking XP on each real chest interaction including mimic reveals, and reduce that break chance by `0.5%` per lockpicking level down to a `25%` floor.
- Chest keys always consume `1` stack on use and do not award lockpicking XP.
- If a lockpick breaks, the pick is consumed and the chest remains closed.
- If a chest opener resolves an ordinary locked chest, the chest disappears and drops one world-generated item onto the ground.
- Enemies roll dedicated opener drops independently from other loot, with a `0.5%` chance to drop a lockpick and a `0.01%` chance to drop a chest key.
- Revealing a mimic consumes the opener, clears the chest structure, spawns a legendary mimic directly on that tile, and starts combat immediately.
- Mimics double the ordinary attack baseline for their tier and reuse treasure-goblin item-drop chance plus rarity multipliers without treasure-goblin gold scaling.

## Main Implementation Areas

- `src/game/lockedChests.ts`
- `src/game/stateLockedChests.ts`
- `src/game/stateItemActions.ts`
- `src/game/stateRewards.ts`
- `src/game/stateRewards/enemyLoot.ts`
- `src/game/combat.ts`
- `src/game/content/items`
- `src/game/content/structures`
- `src/game/content/enemies`
- `src/ui/tooltips`
