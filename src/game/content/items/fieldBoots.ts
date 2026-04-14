import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const fieldBootsItemConfig: ItemConfig = {
  key: 'field-boots',
  name: 'Field Boots',
  kind: 'armor',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
