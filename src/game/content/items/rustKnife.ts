import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const rustKnifeItemConfig: ItemConfig = {
  key: 'rust-knife',
  name: itemName('rust-knife'),
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
