import { hexKey, type HexCoord } from './hex';
import { buildItemFromConfig } from './content/items';
import { makeConsumable, makeStarterArmor } from './inventory';
import { applyRarityToItem, noise } from './shared';
import { RARITY_ORDER, type TownStockEntry } from './types';

export function buildTownStock(
  seed: string,
  coord: HexCoord,
): TownStockEntry[] {
  const ration = makeConsumable(
    `town-ration-${hexKey(coord)}`,
    'trail-ration',
    1,
    8,
    12,
    2,
  );
  const jerky = makeConsumable(
    `town-jerky-${hexKey(coord)}`,
    'apple',
    2,
    6,
    20,
  );
  const hood = applyRarityToItem({
    ...makeStarterArmor('head', 'scout-hood', 1, 1),
    id: `town-hood-${hexKey(coord)}`,
    rarity: noise(`${seed}:town-stock`, coord) > 0.6 ? 'uncommon' : 'common',
  });
  const knife = {
    ...buildItemFromConfig('town-knife'),
    id: `town-knife-${hexKey(coord)}`,
  };

  return [
    { item: ration, price: 6 },
    { item: jerky, price: 10 },
    { item: hood, price: 18 + RARITY_ORDER.indexOf(hood.rarity) * 6 },
    { item: knife, price: 16 },
  ];
}
