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

  const inventory = (game.player.inventory ?? []).map(normalizeItem);
  const legacyGold = Math.max(0, Number(legacyGoldValue ?? 0));
  if (legacyGold > 0) inventory.push(normalizeItem(makeGoldStack(legacyGold)));
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
