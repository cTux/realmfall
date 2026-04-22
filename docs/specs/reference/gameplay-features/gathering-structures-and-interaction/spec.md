# Gathering Structures And Interaction

## Scope

This spec covers gatherable structures, world interaction sites, and contextual tile interaction.

## Current Behavior

- Gathering structures currently include trees, herbs, copper, tin, iron, gold, platinum, and coal ore nodes, plus lakes and ponds through structure definitions.
- Gathering uses structure HP and removes depleted gatherable structures.
- Herb patches now use a weighted reward table and can yield herbs, fruits, and vegetables instead of one fixed herb item.
- Gather actions can award byproducts such as sticks from trees and stone from any ore seam.
- Structures also include non-gathering interaction sites such as towns, camps, furnaces, workshops, forges, and dungeons.
- Structure interaction labels are driven from structure definitions.
- Camps influence atmosphere and world presentation in the renderer.
- Hex interactions are contextual to the current tile and available structure.
- Current interactions include gathering, buying, selling, prospecting, smelting, taking loot, combat start, and claim attempts.

## Main Implementation Areas

- `src/game/world.ts`
- `src/game/state.ts`
- `src/game/stateWorldActions.ts`
- `src/game/stateRewards.ts`
- `src/game/content/structures`
- `src/ui/tooltips.ts`
