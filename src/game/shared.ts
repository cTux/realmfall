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

export function pickEquipmentRarity(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimum: ItemRarity = 'common',
): ItemRarity {
  const roll = noise(`${seed}:rarity`, coord) + Math.min(0.06, tier * 0.0025);
  const rarity =
    roll > 0.995
      ? 'legendary'
      : roll > 0.945
        ? 'epic'
        : roll > 0.745
          ? 'rare'
          : roll > 0.145
            ? 'uncommon'
            : 'common';
  return (
    RARITY_ORDER[
      Math.max(RARITY_ORDER.indexOf(minimum), RARITY_ORDER.indexOf(rarity))
    ] ?? minimum
  );
}

export function applyRarityToItem(item: Item): Item {
  const multiplier = rarityMultiplier(item.rarity);
  return {
    ...item,
    power: Math.round(item.power * multiplier),
    defense: Math.round(item.defense * multiplier),
    maxHp: Math.round(item.maxHp * multiplier + rarityBonus(item.rarity)),
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
