import {
  isGatheringStructure,
  makeGoldStack,
  type GameState,
  type Item,
  type SkillName,
} from '../game/state';

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
      normalizeTile(tile),
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
      skills: normalizeSkills(
        (
          game.player as GameState['player'] & {
            skills?: Partial<
              Record<SkillName, { level?: number; xp?: number }>
            >;
          }
        ).skills,
      ),
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

function normalizeTile(tile: GameState['tiles'][string]) {
  const structureHp =
    isGatheringStructure(tile.structure) && tile.structureHp == null
      ? defaultStructureHp(tile.structure)
      : tile.structureHp;
  const structureMaxHp =
    isGatheringStructure(tile.structure) && tile.structureMaxHp == null
      ? defaultStructureHp(tile.structure)
      : tile.structureMaxHp;

  return {
    ...tile,
    structureHp,
    structureMaxHp,
    items: (tile.items ?? []).map(normalizeItem),
    enemyIds:
      tile.enemyIds ??
      (((tile as unknown as { enemyId?: string }).enemyId
        ? [(tile as unknown as { enemyId?: string }).enemyId as string]
        : []) as string[]),
  };
}

function normalizeSkills(
  skills?: Partial<Record<SkillName, { level?: number; xp?: number }>>,
) {
  return {
    logging: normalizeSkill(skills?.logging),
    mining: normalizeSkill(skills?.mining),
    skinning: normalizeSkill(skills?.skinning),
    fishing: normalizeSkill(skills?.fishing),
  };
}

function normalizeSkill(skill?: { level?: number; xp?: number }) {
  return {
    level: Math.max(1, Number(skill?.level ?? 1) || 1),
    xp: Math.max(0, Number(skill?.xp ?? 0) || 0),
  };
}

function defaultStructureHp(
  structure: Extract<GameState['tiles'][string]['structure'], string>,
) {
  switch (structure) {
    case 'tree':
      return 5;
    case 'copper-ore':
      return 6;
    case 'iron-ore':
      return 8;
    case 'coal-ore':
      return 7;
    case 'pond':
      return 4;
    case 'lake':
      return 6;
    default:
      return undefined;
  }
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
