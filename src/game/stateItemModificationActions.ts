import { t } from '../i18n';
import { formatSecondaryStatLabel } from '../i18n/labels';
import { ITEM_MODIFICATION_BALANCE } from './config';
import {
  applyCorruptionBonus,
  canModifyItem,
  getItemDisplayName,
  getItemEnchantedSecondaryStatIndex,
  getItemModificationCost,
  getReforgeableItemSecondaryStats,
} from './itemModifications';
import { buildRandomSecondaryStat } from './itemSecondaryStats';
import { getGoldAmount, isEquippableItem, spendGold } from './inventory';
import { addLog } from './logs';
import { createRng } from './random';
import { cloneForPlayerMutation, message } from './stateMutationHelpers';
import { getCurrentTile } from './stateWorldQueries';
import type { GameState } from './types';

export function reforgeInventoryItem(
  state: GameState,
  itemId: string,
  statIndex: number,
): GameState {
  if (getCurrentTile(state).structure !== 'rune-forge') {
    return message(
      state,
      t('game.message.itemModification.reforge.runeForgeOnly'),
    );
  }

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  const item = state.player.inventory[itemIndex];
  if (!item || !isEquippableItem(item)) {
    return message(state, t('game.message.item.notInPack'));
  }
  if (!canModifyItem(item)) {
    return message(
      state,
      t('game.message.itemModification.blocked.corrupted', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const reforgeableStats = getReforgeableItemSecondaryStats(item);
  if (reforgeableStats.length === 0) {
    return message(
      state,
      t('game.message.itemModification.reforge.noEligibleStat', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const selectedStat = reforgeableStats.find(
    (entry) => entry.index === statIndex,
  );
  if (!selectedStat) {
    return message(
      state,
      t('game.message.itemModification.reforge.lockedToPrevious', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const goldCost = getItemModificationCost(item, 'reforge');
  if (getGoldAmount(state.player.inventory) < goldCost) {
    return message(
      state,
      t('game.message.itemModification.needsGold', {
        action: t('game.itemModification.reforge.label').toLowerCase(),
        gold: goldCost,
        item: getItemDisplayName(item),
      }),
    );
  }

  const otherStatKeys = (item.secondaryStats ?? []).flatMap((stat, index) =>
    index === selectedStat.index ? [] : [stat.key],
  );
  const rng = createRng(
    `${state.seed}:item-modification:reforge:${item.id}:${state.turn}:${state.logSequence}`,
  );
  const nextStat = buildRandomSecondaryStat(
    {
      occupiedKeys: otherStatKeys,
      excludedKeys: [selectedStat.stat.key],
      tier: item.tier,
      rarity: item.rarity,
    },
    rng,
  );

  if (!nextStat) {
    return message(
      state,
      t('game.message.itemModification.reforge.noOutcome', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const next = cloneForPlayerMutation(state);
  spendGold(next.player.inventory, goldCost);
  const nextItem = next.player.inventory[itemIndex];
  if (!nextItem) {
    return state;
  }

  nextItem.secondaryStats = (nextItem.secondaryStats ?? []).map(
    (stat, index) => (index === selectedStat.index ? nextStat : stat),
  );
  nextItem.reforgedSecondaryStatIndex = selectedStat.index;
  addLog(
    next,
    'system',
    t('game.message.itemModification.reforge.success', {
      item: getItemDisplayName(nextItem),
      fromStat: formatSecondaryStatLabel(selectedStat.stat.key),
      toStat: formatSecondaryStatLabel(nextStat.key),
      gold: goldCost,
    }),
  );
  return next;
}

export function enchantInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (getCurrentTile(state).structure !== 'mana-font') {
    return message(
      state,
      t('game.message.itemModification.enchant.manaFontOnly'),
    );
  }

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  const item = state.player.inventory[itemIndex];
  if (!item || !isEquippableItem(item)) {
    return message(state, t('game.message.item.notInPack'));
  }
  if (!canModifyItem(item)) {
    return message(
      state,
      t('game.message.itemModification.blocked.corrupted', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const goldCost = getItemModificationCost(item, 'enchant');
  if (getGoldAmount(state.player.inventory) < goldCost) {
    return message(
      state,
      t('game.message.itemModification.needsGold', {
        action: t('game.itemModification.enchant.label').toLowerCase(),
        gold: goldCost,
        item: getItemDisplayName(item),
      }),
    );
  }

  const enchantedIndex = getItemEnchantedSecondaryStatIndex(item);
  const occupiedKeys = (item.secondaryStats ?? []).flatMap((stat, index) =>
    index === enchantedIndex ? [] : [stat.key],
  );
  const excludedKeys =
    enchantedIndex == null || !item.secondaryStats?.[enchantedIndex]
      ? []
      : [item.secondaryStats[enchantedIndex].key];
  const rng = createRng(
    `${state.seed}:item-modification:enchant:${item.id}:${state.turn}:${state.logSequence}`,
  );
  const enchantedStat = buildRandomSecondaryStat(
    {
      occupiedKeys,
      excludedKeys,
      tier: item.tier,
      rarity: item.rarity,
    },
    rng,
  );

  if (!enchantedStat) {
    return message(
      state,
      t('game.message.itemModification.enchant.noOutcome', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const next = cloneForPlayerMutation(state);
  spendGold(next.player.inventory, goldCost);
  const nextItem = next.player.inventory[itemIndex];
  if (!nextItem) {
    return state;
  }

  const secondaryStats = [...(nextItem.secondaryStats ?? [])];
  if (enchantedIndex == null) {
    secondaryStats.push(enchantedStat);
    nextItem.enchantedSecondaryStatIndex = secondaryStats.length - 1;
  } else {
    secondaryStats[enchantedIndex] = enchantedStat;
    nextItem.enchantedSecondaryStatIndex = enchantedIndex;
  }
  nextItem.secondaryStats = secondaryStats;
  addLog(
    next,
    'system',
    t('game.message.itemModification.enchant.success', {
      item: getItemDisplayName(nextItem),
      stat: formatSecondaryStatLabel(enchantedStat.key),
      gold: goldCost,
    }),
  );
  return next;
}

export function corruptInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (getCurrentTile(state).structure !== 'corruption-altar') {
    return message(
      state,
      t('game.message.itemModification.corrupt.corruptionAltarOnly'),
    );
  }

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  const item = state.player.inventory[itemIndex];
  if (!item || !isEquippableItem(item)) {
    return message(state, t('game.message.item.notInPack'));
  }
  if (!canModifyItem(item)) {
    return message(
      state,
      t('game.message.itemModification.blocked.corrupted', {
        item: getItemDisplayName(item),
      }),
    );
  }

  const goldCost = getItemModificationCost(item, 'corrupt');
  if (getGoldAmount(state.player.inventory) < goldCost) {
    return message(
      state,
      t('game.message.itemModification.needsGold', {
        action: t('game.itemModification.corrupt.label').toLowerCase(),
        gold: goldCost,
        item: getItemDisplayName(item),
      }),
    );
  }

  const next = cloneForPlayerMutation(state);
  spendGold(next.player.inventory, goldCost);
  const rng = createRng(
    `${state.seed}:item-modification:corrupt:${item.id}:${state.turn}:${state.logSequence}`,
  );
  if (rng() < ITEM_MODIFICATION_BALANCE.corrupt.breakChance) {
    next.player.inventory.splice(itemIndex, 1);
    addLog(
      next,
      'system',
      t('game.message.itemModification.corrupt.break', {
        item: getItemDisplayName(item),
        gold: goldCost,
      }),
    );
    return next;
  }

  const nextItem = next.player.inventory[itemIndex];
  if (!nextItem) {
    return state;
  }

  nextItem.power = applyCorruptionBonus(nextItem.power);
  nextItem.defense = applyCorruptionBonus(nextItem.defense);
  nextItem.maxHp = applyCorruptionBonus(nextItem.maxHp);
  nextItem.secondaryStats = nextItem.secondaryStats?.map((stat) => ({
    ...stat,
    value: applyCorruptionBonus(stat.value),
  }));
  nextItem.corrupted = true;
  addLog(
    next,
    'system',
    t('game.message.itemModification.corrupt.success', {
      item: getItemDisplayName(nextItem),
      gold: goldCost,
    }),
  );
  return next;
}
