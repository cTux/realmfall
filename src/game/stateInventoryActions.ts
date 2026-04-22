import { hexKey } from './hex';
import { t } from '../i18n';
import { itemOccupiesOffhand } from './content/items';
import { buildTownStock } from './economy';
import { addLog } from './logs';
import {
  addItemToInventory,
  compareItems,
  consolidateInventory,
  describeItemStack,
  getGoldAmount,
  isEquippableItem,
  isRecipePage,
  makeGoldStack,
  prospectYield,
  sellValue,
  spendGold,
} from './inventory';
import { getPlayerStats } from './progression';
import {
  cloneForPlayerAndTileMutation,
  cloneForPlayerMutation,
  message,
} from './stateMutationHelpers';
import { getCurrentTile } from './stateWorldQueries';
import type { EquipmentSlot, GameState, TownStockEntry } from './types';
import { ensureTileState, normalizeStructureState } from './world';

export function isOffhandSlotDisabled(
  equipment: GameState['player']['equipment'],
) {
  return itemOccupiesOffhand(equipment.weapon);
}

export function sortInventory(state: GameState): GameState {
  const next = cloneForPlayerMutation(state);
  next.player.inventory = consolidateInventory(next.player.inventory);
  const equippable = next.player.inventory
    .filter(isEquippableItem)
    .sort(compareItems);
  const other = next.player.inventory.filter((item) => !isEquippableItem(item));
  next.player.inventory = [...equippable, ...other];
  addLog(next, 'system', t('game.message.inventory.sort'));
  return next;
}

export function sellAllItems(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'town') {
    return message(state, t('game.message.sell.townOnly'));
  }

  const sellable = state.player.inventory.filter(
    (item) => isEquippableItem(item) && !item.locked,
  );
  if (sellable.length === 0) {
    return message(state, t('game.message.sell.empty'));
  }

  const next = cloneForPlayerMutation(state);
  const gold = sellable.reduce((sum, item) => sum + sellValue(item), 0);
  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item) || item.locked,
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(next, 'system', t('game.message.sell.success', { gold }));
  return next;
}

export function sellInventoryItem(state: GameState, itemId: string): GameState {
  if (getCurrentTile(state).structure !== 'town') {
    return message(state, t('game.message.sell.townOnly'));
  }

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (
    !item ||
    (!isEquippableItem(item) && !isRecipePage(item)) ||
    item.locked
  ) {
    return message(state, t('game.message.sell.empty'));
  }

  const next = cloneForPlayerMutation(state);
  const gold = sellValue(item);
  next.player.inventory = next.player.inventory.filter(
    (entry) => entry.id !== itemId,
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(
    next,
    'system',
    t('game.message.sell.itemSuccess', {
      item: describeItemStack(item),
      gold,
    }),
  );
  return next;
}

export function prospectInventory(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, t('game.message.prospect.forgeOnly'));
  }

  const next = cloneForPlayerMutation(state);
  const prospectable = next.player.inventory.filter(
    (item) => isEquippableItem(item) && !item.locked,
  );
  if (prospectable.length === 0) {
    return message(state, t('game.message.prospect.empty'));
  }

  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item) || item.locked,
  );
  prospectable.forEach((item) => {
    prospectYield(item).forEach((resource) =>
      addItemToInventory(next.player.inventory, resource),
    );
  });

  next.player.inventory.sort(compareItems);
  addLog(next, 'loot', t('game.message.prospect.success'));
  return next;
}

export function prospectInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, t('game.message.prospect.forgeOnly'));
  }

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (!item || !isEquippableItem(item) || item.locked) {
    return message(state, t('game.message.prospect.empty'));
  }

  const next = cloneForPlayerMutation(state);
  next.player.inventory = next.player.inventory.filter(
    (entry) => entry.id !== itemId,
  );
  prospectYield(item).forEach((resource) =>
    addItemToInventory(next.player.inventory, resource),
  );
  next.player.inventory.sort(compareItems);
  addLog(
    next,
    'loot',
    t('game.message.prospect.itemSuccess', {
      item: describeItemStack(item),
    }),
  );
  return next;
}

export function takeTileItem(state: GameState, itemId: string): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  const itemIndex = tile.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) {
    return message(state, t('game.message.loot.itemGone'));
  }

  const [item] = tile.items.splice(itemIndex, 1);
  addItemToInventory(next.player.inventory, item);
  next.tiles[key] = normalizeStructureState({
    ...tile,
    items: [...tile.items],
  });
  addLog(
    next,
    'loot',
    t('game.message.loot.takeOne', { item: describeItemStack(item) }),
  );
  return next;
}

export function getTownStock(state: GameState): TownStockEntry[] {
  const tile = getCurrentTile(state);
  if (tile.structure !== 'town') {
    return [];
  }

  const purchasedItemIds = new Set(tile.townStockPurchasedItemIds ?? []);

  return buildTownStock(state.seed, tile.coord).filter(
    (entry) => !purchasedItemIds.has(entry.item.id),
  );
}

export function hasEquippableInventoryItems(state: GameState) {
  return state.player.inventory.some(isEquippableItem);
}

export function buyTownItem(state: GameState, itemId: string): GameState {
  const tile = getCurrentTile(state);
  if (tile.structure !== 'town') {
    return message(state, t('game.message.buy.townOnly'));
  }

  const stock = getTownStock(state);
  const entry = stock.find((candidate) => candidate.item.id === itemId);
  if (!entry) {
    return message(state, t('game.message.buy.unavailable'));
  }

  const gold = getGoldAmount(state.player.inventory);
  if (gold < entry.price) {
    return message(
      state,
      t('game.message.buy.needsGold', {
        price: entry.price,
        item: entry.item.name,
      }),
    );
  }

  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const currentTileKey = hexKey(next.player.coord);
  const currentTile = next.tiles[currentTileKey];
  spendGold(next.player.inventory, entry.price);
  addItemToInventory(next.player.inventory, { ...entry.item });
  currentTile.townStockPurchasedItemIds = [
    ...(currentTile.townStockPurchasedItemIds ?? []),
    entry.item.id,
  ];
  addLog(
    next,
    'system',
    t('game.message.buy.success', {
      item: entry.item.name,
      price: entry.price,
    }),
  );
  return next;
}

export function takeAllTileItems(state: GameState): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  if (tile.items.length === 0) {
    return message(state, t('game.message.loot.nothingHere'));
  }

  tile.items.forEach((item) => addItemToInventory(next.player.inventory, item));
  next.tiles[key] = normalizeStructureState({ ...tile, items: [] });
  addLog(
    next,
    'loot',
    t('game.message.loot.takeMany', {
      items: tile.items.map((item) => describeItemStack(item)).join(', '),
    }),
  );
  return next;
}

export function dropInventoryItem(state: GameState, itemId: string): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  const itemIndex = next.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) {
    return message(state, t('game.message.item.notInPack'));
  }

  const [item] = next.player.inventory.splice(itemIndex, 1);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, item);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    next,
    'loot',
    t('game.message.loot.drop', { item: describeItemStack(item) }),
  );
  return next;
}

export function dropEquippedItem(
  state: GameState,
  slot: EquipmentSlot,
): GameState {
  const equipped = state.player.equipment[slot];
  if (!equipped) {
    return message(state, t('game.message.equipment.slotEmpty'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  delete next.player.equipment[slot];
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, equipped);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'loot', t('game.message.loot.drop', { item: equipped.name }));
  return next;
}

export function setInventoryItemLocked(
  state: GameState,
  itemId: string,
  locked: boolean,
): GameState {
  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) {
    return message(state, t('game.message.item.notInPack'));
  }
  if (state.player.inventory[itemIndex]?.locked === locked) {
    return state;
  }

  const next = cloneForPlayerMutation(state);
  const item = next.player.inventory[itemIndex];
  if (!item) {
    return state;
  }

  item.locked = locked;
  addLog(
    next,
    'system',
    locked
      ? t('game.message.item.locked', { item: item.name })
      : t('game.message.item.unlocked', { item: item.name }),
  );
  return next;
}
