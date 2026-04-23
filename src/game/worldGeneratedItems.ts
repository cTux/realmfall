import {
  buildGeneratedItemFromConfig,
  getGeneratedAccessoryKeys,
  getGeneratedArmorKeys,
  getGeneratedOffhandKeys,
  getGeneratedWeaponKeys,
} from './content/items';
import { pickWorldGeneratedItemKind } from './config';
import { hexKey, type HexCoord } from './hex';
import { makeConsumable } from './inventory';
import { itemId, pickEquipmentRarity, scaledIndex } from './shared';
import type { Item, ItemRarity, StructureType } from './types';

export function makeWorldGeneratedItem(
  seed: string,
  coord: HexCoord,
  tier: number,
  roll: number,
  structure?: StructureType,
) {
  const minimumRarity = structure === 'dungeon' ? 'rare' : undefined;

  switch (pickWorldGeneratedItemKind(roll)) {
    case 'artifact':
      return makeArtifact(seed, coord, tier, minimumRarity);
    case 'weapon':
      return makeWeapon(seed, coord, tier, minimumRarity);
    case 'offhand':
      return makeOffhand(seed, coord, tier, minimumRarity);
    case 'armor':
      return makeArmor(seed, coord, tier, minimumRarity);
    default:
      return makeConsumable(
        itemId('consumable', coord, seed),
        'trail-ration',
        tier,
        8,
        12,
      );
  }
}

export function makeWeapon(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const keys = getGeneratedWeaponKeys();
  const key = keys[scaledIndex(`${seed}:weapon:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('weapon', coord, seed),
    tier,
    rarity,
  });
}

export function makeOffhand(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedOffhandKeys();
  const key = keys[scaledIndex(`${seed}:offhand:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('offhand', coord, seed),
    tier,
    rarity,
  });
}

export function makeArmor(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedArmorKeys();
  const key = keys[scaledIndex(`${seed}:armor:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('armor', coord, seed),
    tier,
    rarity,
  });
}

export function makeArtifact(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedAccessoryKeys();
  const key = keys[scaledIndex(`${seed}:artifact:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(
    seed,
    coord,
    tier + 1,
    minimumRarity ?? 'uncommon',
  );
  return buildGeneratedItemFromConfig(key, {
    id: itemId('artifact', coord, seed),
    tier,
    rarity,
  });
}

export function makeBonusCacheItem(coord: HexCoord, tier: number) {
  return makeConsumable(`${hexKey(coord)}-cache`, 'apple', tier, 6, 20);
}
