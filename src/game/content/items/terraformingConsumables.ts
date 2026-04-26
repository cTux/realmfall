import { TERRAINS, type Terrain } from '../../types';
import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

const TERRAFORMING_CONSUMABLE_PREFIX = 'terraforming-';

const TERRAFORMING_CONSUMABLE_TERRAINS: ReadonlyArray<Terrain> = [...TERRAINS];
const TERRAFORMING_CONSUMABLE_TERRAIN_SET = new Set(
  TERRAFORMING_CONSUMABLE_TERRAINS,
);

const TERRAFORMING_CONSUMABLE_TERRAINS_TO_TINT: Record<Terrain, string> = {
  plains: '#3f6212',
  meadow: '#4d7c0f',
  steppe: '#65a30d',
  grove: '#166534',
  forest: '#14532d',
  marsh: '#3f6212',
  rift: '#7f1d1d',
  blasted: '#7f1d1d',
  highlands: '#365314',
  mountain: '#475569',
  dunes: '#c2410c',
  badlands: '#7c2d12',
  desert: '#92400e',
  swamp: '#1f3a1f',
};

export const TERRAFORMING_CONSUMABLE_ITEM_KEYS =
  TERRAFORMING_CONSUMABLE_TERRAINS.map(
    (terrain) => `${TERRAFORMING_CONSUMABLE_PREFIX}${terrain}` as const,
  );

export const TERRAFORMING_CONSUMABLE_ITEM_CONFIGS =
  TERRAFORMING_CONSUMABLE_TERRAINS.map((terrain) => {
    const key = `${TERRAFORMING_CONSUMABLE_PREFIX}${terrain}`;
    return {
      key,
      name: itemName(key),
      icon: ContentIcons.EarthCrack,
      tint: TERRAFORMING_CONSUMABLE_TERRAINS_TO_TINT[terrain],
      category: 'consumable',
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      defaultQuantity: 1,
    } satisfies ItemConfig;
  });

export function getTerraformingConsumableTerrain(
  itemKey?: string,
): Terrain | null {
  if (!itemKey || !itemKey.startsWith(TERRAFORMING_CONSUMABLE_PREFIX)) {
    return null;
  }
  const terrain = itemKey.slice(TERRAFORMING_CONSUMABLE_PREFIX.length);
  return TERRAFORMING_CONSUMABLE_TERRAIN_SET.has(terrain as Terrain)
    ? (terrain as Terrain)
    : null;
}

export function isTerraformingConsumableItemKey(
  itemKey?: string,
): itemKey is `terraforming-${Terrain}` {
  return getTerraformingConsumableTerrain(itemKey) !== null;
}
