import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const hideBucklerItemConfig: ItemConfig = {
  key: 'hide-buckler',
  name: 'Hide Buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 2,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
