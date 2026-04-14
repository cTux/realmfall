import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const townKnifeItemConfig: ItemConfig = {
  key: 'town-knife',
  name: 'Town Knife',
  kind: 'weapon',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  tier: 1,
  rarity: 'common',
  power: 2,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};
