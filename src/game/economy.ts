import { clampItemLevel } from './balance';
import {
  buildGeneratedItemFromConfig,
  buildItemFromConfig,
  getGeneratedAccessoryKeys,
  getGeneratedArmorKeys,
  getGeneratedOffhandKeys,
  getGeneratedWeaponKeys,
  getItemConfigByKey,
} from './content/items';
import { ItemId } from './content/ids';
import { hexDistance, hexKey, type HexCoord } from './hex';
import { compareItems, sellValue } from './inventory';
import { createRng } from './random';
import { applyRarityToItem, pickEquipmentRarity } from './shared';
import type { Item, TownStockEntry } from './types';

const STATIC_TOWN_STOCK_KEYS = [
  ItemId.TownKnife,
  ItemId.CampSpear,
  ItemId.HideBuckler,
  ItemId.ScoutHood,
  ItemId.SettlerVest,
  ItemId.FieldBoots,
  ItemId.CopperBand,
  ItemId.CharmNecklace,
] as const;

const TOWN_STOCK_KEYS = [
  ...STATIC_TOWN_STOCK_KEYS,
  ...getGeneratedWeaponKeys(),
  ...getGeneratedOffhandKeys(),
  ...getGeneratedArmorKeys(),
  ...getGeneratedAccessoryKeys(),
] as const;

export function buildTownStock(
  seed: string,
  coord: HexCoord,
): TownStockEntry[] {
  const baseTier = resolveTownStockBaseTier(coord);

  return TOWN_STOCK_KEYS.map((key, index) => {
    const item = buildTownStockItem({
      seed,
      coord,
      key,
      index,
      baseTier,
    });

    return {
      item,
      price: getTownStockPrice(item),
    };
  }).sort(
    (left, right) =>
      left.price - right.price || compareItems(left.item, right.item),
  );
}

function buildTownStockItem({
  seed,
  coord,
  key,
  index,
  baseTier,
}: {
  seed: string;
  coord: HexCoord;
  key: string;
  index: number;
  baseTier: number;
}) {
  const config = getItemConfigByKey(key);
  if (!config) {
    throw new Error(`Missing item config for town stock: ${key}`);
  }

  const itemId = `town-stock-${hexKey(coord)}-${key}-${index}`;
  const tier = resolveTownStockTier(seed, coord, key, index, baseTier);
  const rarity = pickEquipmentRarity(
    `${seed}:town-stock:${key}:${index}`,
    coord,
    tier,
    config.category === 'artifact' ? 'uncommon' : 'common',
  );

  if (config.generatedStats) {
    return buildGeneratedItemFromConfig(key, {
      id: itemId,
      tier,
      rarity,
    });
  }

  return applyRarityToItem(
    buildItemFromConfig(key, {
      id: itemId,
      tier,
      rarity,
    }),
  );
}

function resolveTownStockBaseTier(coord: HexCoord) {
  return clampItemLevel(1 + Math.floor(hexDistance(coord, { q: 0, r: 0 }) / 4));
}

function resolveTownStockTier(
  seed: string,
  coord: HexCoord,
  key: string,
  index: number,
  baseTier: number,
) {
  const rng = createRng(
    `${seed}:town-stock:tier:${key}:${index}:${coord.q}:${coord.r}`,
  );

  return clampItemLevel(baseTier + Math.floor(rng() * 3));
}

function getTownStockPrice(item: Item) {
  return Math.max(10, sellValue(item) * 2);
}
