import { clampItemLevel } from './balance';
import { TOWN_BUY_PRICE_BALANCE } from './config';
import {
  buildGeneratedItemFromConfig,
  buildItemFromConfig,
  getConsumableItemKeys,
  getGeneratedAccessoryKeys,
  getGeneratedArmorKeys,
  getGeneratedOffhandKeys,
  getGeneratedWeaponKeys,
  getItemConfigByKey,
  getItemCategory,
  hasItemTag,
} from './content/items';
import { ItemId } from './content/ids';
import { GAME_TAGS } from './content/tags';
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
const TOWN_STOCK_CONSUMABLE_COUNT = 4;

export function buildTownStock(
  seed: string,
  coord: HexCoord,
  dayIndex = 0,
): TownStockEntry[] {
  const baseTier = resolveTownStockBaseTier(coord);
  const equippableEntries = TOWN_STOCK_KEYS.map((key, index) => {
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
  });
  const consumableEntries = buildTownConsumables({
    seed,
    coord,
    dayIndex,
    baseTier,
  });

  return [...consumableEntries, ...equippableEntries].sort(
    (left, right) =>
      townStockPriority(left.item, right.item) ||
      left.price - right.price ||
      compareItems(left.item, right.item),
  );
}

function buildTownConsumables({
  seed,
  coord,
  dayIndex,
  baseTier,
}: {
  seed: string;
  coord: HexCoord;
  dayIndex: number;
  baseTier: number;
}) {
  const keys = pickRandomKeys(
    getConsumableItemKeys(),
    `${seed}:town-stock:consumables:${dayIndex}:${coord.q}:${coord.r}`,
    TOWN_STOCK_CONSUMABLE_COUNT,
  );

  return keys.map((key, index) => {
    const item = buildTownStockItem({
      seed,
      coord,
      dayIndex,
      key,
      index: TOWN_STOCK_KEYS.length + index,
      baseTier,
    });

    return {
      item,
      price: getTownStockPrice(item),
    };
  });
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
  const category = getItemCategory(item);
  if (category === 'consumable') {
    const isCraftedFood = hasItemTag(item, GAME_TAGS.item.crafted);
    const consumableBalance = isCraftedFood
      ? TOWN_BUY_PRICE_BALANCE.consumableCraftedFood
      : TOWN_BUY_PRICE_BALANCE.consumable;

    return Math.max(
      consumableBalance.minimum,
      Math.round(
        sellValue(item) *
          consumableBalance.baseMultiplier *
          consumableBalance.rarityMultiplier[item.rarity] *
          (1 + Math.max(0, item.tier - 1) * consumableBalance.perTier),
      ),
    );
  }

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

function townStockPriority(left: Item, right: Item) {
  const leftIsConsumable = getItemCategory(left) === 'consumable';
  const rightIsConsumable = getItemCategory(right) === 'consumable';
  if (leftIsConsumable === rightIsConsumable) return 0;
  return leftIsConsumable ? -1 : 1;
}

function pickRandomKeys<T>(items: readonly T[], seed: string, limit: number) {
  const source = [...items];
  const rng = createRng(seed);
  const selected: T[] = [];
  const count = Math.min(limit, source.length);

  while (selected.length < count) {
    const index = Math.floor(rng() * source.length);
    const picked = source.splice(index, 1)[0];
    if (!picked) break;
    selected.push(picked);
  }

  return selected;
}
