import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const trailLeggingsItemConfig: ItemConfig = {
  key: 'trail-leggings',
  name: 'Trail Leggings',
  slot: EquipmentSlotId.Legs,
  icon: ContentIcons.Chest,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
