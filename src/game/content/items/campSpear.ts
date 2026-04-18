import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const campSpearItemConfig: ItemConfig = {
  key: 'camp-spear',
  name: itemName('camp-spear'),
  slot: EquipmentSlotId.Weapon,
  grantedAbilityId: 'impale',
  icon: ContentIcons.Weapon,
  tier: 1,
  rarity: 'common',
  power: 3,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};
