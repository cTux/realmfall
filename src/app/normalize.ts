import { makeGoldStack, type GameState, type Item } from '../game/state';

export function normalizeLoadedGame(game: GameState): GameState {
  const { gold: legacyGoldValue, ...player } =
    game.player as GameState['player'] & {
      gold?: number;
    };
  const logs = (game.logs ?? []).map((entry, index) => ({
    ...entry,
    id: `l-${index + 1}`,
  }));

  const inventory = consolidateInventory(
    (game.player.inventory ?? []).map(normalizeItem),
  );
  const legacyGold = Math.max(0, Number(legacyGoldValue ?? 0));
  const hasInventoryGold = inventory.some(
    (item) => item.kind === 'resource' && item.name === 'Gold',
  );
  if (legacyGold > 0 && !hasInventoryGold)
    mergeStackable(inventory, normalizeItem(makeGoldStack(legacyGold)));
  const equipment = Object.fromEntries(
    Object.entries(game.player.equipment ?? {}).map(([key, item]) => [
      key,
      item ? normalizeItem(item) : item,
    ]),
  );
  const tiles = Object.fromEntries(
    Object.entries(game.tiles ?? {}).map(([key, tile]) => [
      key,
      {
        ...tile,
        items: (tile.items ?? []).map(normalizeItem),
        enemyIds:
          tile.enemyIds ??
          (((tile as unknown as { enemyId?: string }).enemyId
            ? [(tile as unknown as { enemyId?: string }).enemyId as string]
            : []) as string[]),
      },
    ]),
  );

  return {
    ...game,
    logSequence: Math.max(game.logSequence ?? 0, logs.length),
    logs,
    tiles,
    combat: game.combat
      ? {
          ...game.combat,
          enemyIds: game.combat.enemyIds ?? [],
        }
      : null,
    player: {
      ...player,
      mana: game.player.mana ?? 12,
      baseMaxMana: game.player.baseMaxMana ?? 12,
      inventory,
      equipment,
    },
  };
}

function normalizeItem(item: Item): Item {
  return {
    ...item,
    quantity: item.quantity ?? 1,
    rarity: item.rarity ?? 'common',
  };
}

function consolidateInventory(inventory: Item[]) {
  return inventory.reduce<Item[]>((merged, item) => {
    mergeStackable(merged, item);
    return merged;
  }, []);
}

function mergeStackable(inventory: Item[], item: Item) {
  if (item.kind !== 'consumable' && item.kind !== 'resource') {
    inventory.push(item);
    return;
  }

  const existing = inventory.find((entry) => isSameStackable(entry, item));
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  inventory.push(item);
}

function isSameStackable(left: Item, right: Item) {
  return (
    (left.kind === 'consumable' || left.kind === 'resource') &&
    left.kind === right.kind &&
    left.name === right.name &&
    left.rarity === right.rarity &&
    left.healing === right.healing &&
    left.hunger === right.hunger
  );
}
