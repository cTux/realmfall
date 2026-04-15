import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const charmNecklaceItemConfig: ItemConfig = {
  key: 'charm-necklace',
  name: itemName('charm-necklace'),
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 2,
  healing: 0,
  hunger: 0,
};
