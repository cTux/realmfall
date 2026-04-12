import { hexKey, type HexCoord } from './hex';
import {
  makeConsumable,
  makeStarterArmor,
  makeStarterWeapon,
} from './inventory';
import { applyRarityToItem, noise } from './shared';
import { RARITY_ORDER, type TownStockEntry } from './types';

export function buildTownStock(
  seed: string,
  coord: HexCoord,
): TownStockEntry[] {
  const ration = makeConsumable(
    `town-ration-${hexKey(coord)}`,
    'Trail Ration',
    1,
    8,
    12,
    2,
  );
  const jerky = makeConsumable(
    `town-jerky-${hexKey(coord)}`,
    'Jerky Pack',
    2,
    6,
    20,
  );
  const hood = applyRarityToItem({
    ...makeStarterArmor('head', 'Scout Hood', 1, 1),
    id: `town-hood-${hexKey(coord)}`,
    rarity: noise(`${seed}:town-stock`, coord) > 0.6 ? 'uncommon' : 'common',
  });
  const knife = {
    ...makeStarterWeapon(),
    id: `town-knife-${hexKey(coord)}`,
    name: 'Town Knife',
  };

  return [
    { item: ration, price: 6 },
    { item: jerky, price: 10 },
    { item: hood, price: 18 + RARITY_ORDER.indexOf(hood.rarity) * 6 },
    { item: knife, price: 16 },
  ];
}
