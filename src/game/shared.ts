import { type HexCoord } from './hex';
import {
  RARITY_ORDER,
  type Item,
  type ItemRarity,
  type Terrain,
} from './types';
import { createRng } from './random';
import { hexDistance, hexKey } from './hex';

export function noise(seed: string, coord: HexCoord) {
  const rng = createRng(`${seed}:${coord.q}:${coord.r}`);
  return rng();
}

export function scaledIndex(seed: string, coord: HexCoord, size: number) {
  return Math.floor(noise(seed, coord) * size) % size;
}

export function itemId(kind: string, coord: HexCoord, seed: string) {
  return `${kind}-${hexKey(coord)}-${Math.floor(noise(`${seed}:${kind}:id`, coord) * 100000)}`;
}

export function terrainTier(coord: HexCoord, terrain: Terrain) {
  const distance = Math.floor(hexDistance(coord, { q: 0, r: 0 }) / 4);
  const terrainBonus = terrain === 'mountain' ? 2 : terrain === 'swamp' ? 1 : 0;
  return 1 + distance + terrainBonus;
}

export function isPassable(terrain: Terrain) {
  return terrain !== 'rift' && terrain !== 'mountain';
}

type CascadingRarityChanceMap = Partial<
  Record<Exclude<ItemRarity, 'common'>, number>
>;

const CASCADING_RARITY_CHECK_ORDER: Array<Exclude<ItemRarity, 'common'>> = [
  'legendary',
  'epic',
  'rare',
  'uncommon',
];

export const BASE_CASCADING_RARITY_CHANCES = Object.freeze({
  legendary: 0.005,
  epic: 0.02,
  rare: 0.1,
  uncommon: 0.3,
}) satisfies Record<Exclude<ItemRarity, 'common'>, number>;

export function resolveCascadingRarity(
  nextRoll: () => number,
  minimum: ItemRarity = 'common',
  chances: CascadingRarityChanceMap = BASE_CASCADING_RARITY_CHANCES,
): ItemRarity {
  const rolledRarity =
    CASCADING_RARITY_CHECK_ORDER.find(
      (rarity) => nextRoll() < clampChance(chances[rarity] ?? 0),
    ) ?? 'common';

  return (
    RARITY_ORDER[
      Math.max(
        RARITY_ORDER.indexOf(minimum),
        RARITY_ORDER.indexOf(rolledRarity),
      )
    ] ?? minimum
  );
}

export function pickEquipmentRarity(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimum: ItemRarity = 'common',
): ItemRarity {
  const bonus = Math.min(0.06, tier * 0.0025);
  const rng = createRng(`${seed}:rarity:${coord.q}:${coord.r}:${tier}`);

  return resolveCascadingRarity(
    rng,
    minimum,
    withCascadingRarityChanceBonus({
      legendary: bonus * 0.08,
      epic: bonus * 0.2,
      rare: bonus * 0.45,
      uncommon: bonus,
    }),
  );
}

export function applyRarityToItem(item: Item): Item {
  const multiplier = rarityMultiplier(item.rarity);
  return {
    ...item,
    power: Math.round(item.power * multiplier),
    defense: Math.round(item.defense * multiplier),
    maxHp:
      item.maxHp > 0
        ? Math.round(item.maxHp * multiplier + rarityBonus(item.rarity))
        : 0,
  };
}

function rarityMultiplier(rarity: ItemRarity) {
  switch (rarity) {
    case 'uncommon':
      return 1.2;
    case 'rare':
      return 1.45;
    case 'epic':
      return 1.8;
    case 'legendary':
      return 2.2;
    default:
      return 1;
  }
}

function rarityBonus(rarity: ItemRarity) {
  switch (rarity) {
    case 'rare':
      return 1;
    case 'epic':
      return 2;
    case 'legendary':
      return 4;
    default:
      return 0;
  }
}

function clampChance(chance: number) {
  return Math.max(0, Math.min(1, chance));
}

export function withCascadingRarityChanceBonus(
  bonuses: CascadingRarityChanceMap,
) {
  return {
    legendary:
      BASE_CASCADING_RARITY_CHANCES.legendary + (bonuses.legendary ?? 0),
    epic: BASE_CASCADING_RARITY_CHANCES.epic + (bonuses.epic ?? 0),
    rare: BASE_CASCADING_RARITY_CHANCES.rare + (bonuses.rare ?? 0),
    uncommon: BASE_CASCADING_RARITY_CHANCES.uncommon + (bonuses.uncommon ?? 0),
  } satisfies Record<Exclude<ItemRarity, 'common'>, number>;
}
