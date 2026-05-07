import { t } from '../i18n';
import { HOME_SCROLL_ITEM_NAME_KEY } from './config';
import { buildItemFromConfig } from './content/items';
import {
  createGame,
  getTileAt,
  moveToTile,
  startCombat,
  type GameState,
  type Item,
} from './state';
import { makeCombatState } from './stateTestHelpers';

type HexCoord = { q: number; r: number };

export function createItemsAndProgressionGame(seed: string, radius = 3) {
  return createGame(radius, seed);
}

export function addInventoryConfigItem(
  game: GameState,
  itemKey: string,
  overrides: Partial<Item> & { id: string },
) {
  const item = buildItemFromConfig(itemKey, overrides);
  game.player.inventory.push(item);
  return item;
}

export function addHomeScroll(game: GameState, id: string) {
  return addInventoryConfigItem(game, 'home-scroll', { id });
}

export function addCombatConsumables(game: GameState, suffix: string) {
  const healthPotion = addInventoryConfigItem(game, 'health-potion', {
    id: `health-potion-${suffix}`,
  });
  const manaPotion = addInventoryConfigItem(game, 'mana-potion', {
    id: `mana-potion-${suffix}`,
  });

  return { healthPotion, manaPotion };
}

export function itemQuantity(state: GameState, itemId: string) {
  return state.player.inventory.find((item) => item.id === itemId)?.quantity;
}

export function hasInventoryItem(state: GameState, itemId: string) {
  return state.player.inventory.some((item) => item.id === itemId);
}

export function setActiveCombat(
  game: GameState,
  coord = game.player.coord,
  enemyIds: string[] = [],
) {
  game.combat = makeCombatState(coord, enemyIds, game.worldTimeMs);
  return game;
}

export function seedEnemyEncounter(
  game: GameState,
  {
    enemyId = 'enemy-2,0-0',
    coord = { q: 2, r: 0 },
    tile = {},
    ...enemy
  }: Partial<GameState['enemies'][string]> & {
    coord?: HexCoord;
    enemyId?: string;
    tile?: Partial<GameState['tiles'][string]>;
  } = {},
) {
  game.tiles[`${coord.q},${coord.r}`] = {
    coord,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [enemyId],
    ...tile,
  };
  game.enemies[enemyId] = {
    id: enemyId,
    name: 'Training Dummy',
    coord,
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 1,
    elite: false,
    ...enemy,
  };
  game.player.coord = { q: coord.q - 1, r: coord.r };

  return { coord, enemyId };
}

export function resolveEnemyEncounter(game: GameState, coord = { q: 2, r: 0 }) {
  return startCombat(moveToTile(game, coord));
}

export function findHomeScrollDrop(seedPrefix: string, maxAttempts = 800) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const game = createItemsAndProgressionGame(`${seedPrefix}-${attempt}`);
    const { coord } = seedEnemyEncounter(game, {
      name: 'Wolf',
      xp: 1,
    });

    game.homeHex = { q: -2, r: 1 };

    const resolved = resolveEnemyEncounter(game, coord);
    if (
      getTileAt(resolved, coord).items.some(
        (item) => item.name === t(HOME_SCROLL_ITEM_NAME_KEY),
      )
    ) {
      return resolved;
    }
  }

  return null;
}

export function createEquipmentItem(
  slot: NonNullable<Item['slot']>,
  overrides: Partial<Item> = {},
): Item {
  return {
    id: `item-${slot}`,
    slot,
    name: `Item ${slot}`,
    quantity: 1,
    tier: 1,
    rarity: 'rare',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    ...overrides,
  };
}
