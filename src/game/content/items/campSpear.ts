import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const campSpearItemConfig: ItemConfig = {
  key: 'camp-spear',
  name: 'Camp Spear',
  kind: 'weapon',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  tier: 1,
  rarity: 'common',
  power: 3,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};
