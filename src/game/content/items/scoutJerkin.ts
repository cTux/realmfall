import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const scoutJerkinItemConfig: ItemConfig = {
  key: 'scout-jerkin',
  name: itemName('scout-jerkin'),
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
