import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const townKnifeItemConfig: ItemConfig = {
  key: 'town-knife',
  name: itemName('town-knife'),
  slot: EquipmentSlotId.Weapon,
  grantedAbilityId: 'slash',
  icon: ContentIcons.Weapon,
  iconPool: GENERATED_ICON_POOLS.dagger,
  tier: 1,
  rarity: 'common',
  power: 2,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};
