import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const wayfarerCloakItemConfig: ItemConfig = {
  key: 'wayfarer-cloak',
  name: 'Wayfarer Cloak',
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
