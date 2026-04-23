import { clampItemLevel } from './balance';
import { TOWN_BUY_PRICE_BALANCE } from './config';
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
  dayIndex = 0,
): TownStockEntry[] {
  const baseTier = resolveTownStockBaseTier(coord);

  return TOWN_STOCK_KEYS.map((key, index) => {
    const item = buildTownStockItem({
      seed,
      coord,
      dayIndex,
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
  dayIndex,
  key,
  index,
  baseTier,
}: {
  seed: string;
  coord: HexCoord;
  dayIndex: number;
  key: string;
  index: number;
  baseTier: number;
}) {
  const config = getItemConfigByKey(key);
  if (!config) {
    throw new Error(`Missing item config for town stock: ${key}`);
  }

  const itemId = `town-stock-${hexKey(coord)}-${dayIndex}-${key}-${index}`;
  const tier = resolveTownStockTier(
    seed,
    coord,
    key,
    index,
    dayIndex,
    baseTier,
  );
  const rarity = pickEquipmentRarity(
    `${seed}:town-stock:${dayIndex}:${key}:${index}`,
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
  dayIndex: number,
  baseTier: number,
) {
  const rng = createRng(
    `${seed}:town-stock:tier:${dayIndex}:${key}:${index}:${coord.q}:${coord.r}`,
  );

  return clampItemLevel(baseTier + Math.floor(rng() * 3));
}

export function getTownStockPrice(item: Item) {
  const tierMultiplier =
    1 + Math.max(0, item.tier - 1) * TOWN_BUY_PRICE_BALANCE.perTier;

  return Math.max(
    TOWN_BUY_PRICE_BALANCE.minimum,
    Math.round(
      sellValue(item) *
        TOWN_BUY_PRICE_BALANCE.rarityMultiplier[item.rarity] *
        tierMultiplier,
    ),
  );
}
