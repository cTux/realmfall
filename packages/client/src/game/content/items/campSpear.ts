import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const campSpearItemConfig: ItemConfig = {
  key: 'camp-spear',
  name: itemName('camp-spear'),
  slot: EquipmentSlotId.Weapon,
  grantedAbilityId: 'impale',
  icon: ContentIcons.Weapon,
  iconPool: GENERATED_ICON_POOLS.twoHandedSword,
  tier: 1,
  rarity: 'common',
  power: 3,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted],
};
