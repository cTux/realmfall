import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const patchworkHoodItemConfig: ItemConfig = {
  key: 'patchwork-hood',
  name: 'Patchwork Hood',
  kind: 'armor',
  slot: EquipmentSlotId.Head,
  icon: ContentIcons.Hood,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
