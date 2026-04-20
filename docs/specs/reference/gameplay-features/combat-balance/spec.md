# Combat Balance

## Scope

This spec covers battle stat anchors, item stat scaling, combat pacing, stat caps, and endgame encounter targets.

Full interpolation tables for item, player, and enemy scaling live in [scaling-tables.md](./scaling-tables.md).

## Current Behavior

- Combat balance is centralized in `game.config.json` and runtime helpers shared by combat, progression, item generation, persistence normalization, and the hero window.
- The baseline global cooldown is `2000ms` before attack-speed modifiers adjust actor timing.
- Level `1` battle entities start from `150` HitPoints, `50` Attack, and `35` Defense.
- Player base stats scale from `150 / 50 / 35` at level `1` to `4000 / 800 / 200` at level `100`.
- Non-player base stats scale from `150 / 50 / 35` at level `1` to `5000 / 1600 / 1100` at level `100`.
- Player level is capped at `100`.
- Item level is capped at `100`.
- Enemy level is not capped.
- Enemies above level `100` gain an extra `10%` of the level-`100` non-player base stat anchor for each additional level.
- Defense subtracts directly from incoming attack power before damage is applied, and fully absorbed hits are surfaced as absorbed combat events instead of forced chip damage.
- Enabled equippable main-stat channels scale from `+1` at item level `1` to `+1000` at item level `100`.
- Chance-based generated secondary stat rolls scale from `+1%` at item level `1` to `+10%` at item level `100`.
- Non-chance generated secondary stat rolls scale from `+1` at item level `1` to `+10` at item level `100`.
- Gear-derived secondary bonuses cap at `75%`.
- The hero window preserves raw secondary totals so overcap displays can show the effective value plus the uncapped amount.
- Endgame balance currently targets a fully equipped character that leaves about `80%` HP after one common-to-rare enemy.
- Endgame balance currently targets a fully equipped character that leaves about `55%` HP after two common-to-rare enemies.
- Endgame balance currently targets a fully equipped character that leaves about `20-30%` HP after three common-to-rare enemies.
- Endgame balance currently targets a fully equipped character that loses about `50%` HP to one epic enemy.
- Endgame balance currently targets a fully equipped character that loses about `90%` HP to one legendary enemy.
- Endgame combat pacing currently targets battles that last at least `10` seconds.

## Main Implementation Areas

- `src/game/balance.ts`
- `src/game/combat.ts`
- `src/game/config.ts`
- `src/game/itemSecondaryStats.ts`
- `src/game/progression.ts`
- `src/ui/components/HeroWindow/HeroWindowContent.tsx`
