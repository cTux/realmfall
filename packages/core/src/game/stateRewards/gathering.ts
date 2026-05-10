import { t } from '../../i18n';
import { createRng } from '../random';
import { itemName } from '../content/i18n';
import { ItemId } from '../content/ids';
import {
  getGatheringByproductKind,
  getStructureConfig,
} from '../content/structures';
import { GATHERING_BYPRODUCT_CHANCES } from '../config';
import { hexKey } from '../hex';
import { describeItemStack, makeResourceStack } from '../inventory';
import { structureDefinition } from '../world';
import type { GameState, GatheringStructureType, Item } from '../types';

type GatheringDefinition = ReturnType<typeof structureDefinition>;

export function buildGatheringRewards(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
  quantity: number,
) {
  if (!definition.rewardTable || definition.rewardTable.length === 0) {
    return [
      makeResourceStack(
        definition.rewardItemKey,
        definition.rewardTier,
        quantity,
      ),
    ];
  }

  const counts = new Map<string, { tier: number; quantity: number }>();
  for (let index = 0; index < quantity; index += 1) {
    const reward = pickGatheringReward(state, structure, definition, index);
    const key = reward.itemKey;
    const current = counts.get(key) ?? {
      tier: reward.rewardTier ?? definition.rewardTier,
      quantity: 0,
    };
    counts.set(key, {
      tier: current.tier,
      quantity: current.quantity + (reward.quantity ?? 1),
    });
  }

  return [...counts.entries()].map(([itemKey, reward]) =>
    makeResourceStack(itemKey, reward.tier, reward.quantity),
  );
}

export function describeItemStacks(items: Item[]) {
  if (items.length === 1) return describeItemStack(items[0]!);
  return items.map(describeItemStack).join(', ');
}

export function maybeGatherByproduct(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
) {
  const byproductKind = getGatheringByproductKind(
    getStructureConfig(structure).tags,
  );
  if (!byproductKind) return null;

  const byproductItemKey =
    byproductKind === 'tree'
      ? ItemId.Sticks
      : byproductKind === 'ore'
        ? ItemId.Stone
        : ItemId.String;

  const rng = createRng(
    `${state.seed}:gather-byproduct:${structure}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  const byproductChance =
    byproductKind === 'string'
      ? 1
      : GATHERING_BYPRODUCT_CHANCES[byproductKind];
  if (
    rng() >= byproductChance
  ) {
    return null;
  }

  const text =
    byproductKind === 'tree'
      ? t('game.message.gather.byproduct.sticks', {
          item: itemName(ItemId.Sticks),
        })
      : byproductKind === 'ore'
        ? t('game.message.gather.byproduct.stone', {
            item: itemName(ItemId.Stone),
          })
        : t('game.message.gather.byproduct.string', {
            item: itemName(ItemId.String),
          });

  return {
    item: makeResourceStack(byproductItemKey, definition.rewardTier, 1),
    text,
  };
}

function pickGatheringReward(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
  rollIndex: number,
) {
  const table = definition.rewardTable;
  if (!table || table.length === 0) {
    return {
      itemKey: definition.rewardItemKey,
      rewardTier: definition.rewardTier,
      quantity: 1,
    };
  }

  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  const rng = createRng(
    `${state.seed}:gather-reward:${structure}:${state.turn}:${hexKey(state.player.coord)}:${rollIndex}`,
  );
  let remaining = rng() * totalWeight;
  for (const entry of table) {
    remaining -= entry.weight;
    if (remaining <= 0) return entry;
  }
  return table[table.length - 1]!;
}
