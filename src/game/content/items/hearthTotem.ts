import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const hearthTotemItemConfig: ItemConfig = {
  key: 'hearth-totem',
  name: itemName('hearth-totem'),
  slot: EquipmentSlotId.Relic,
  icon: ContentIcons.Totem,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 3,
  healing: 0,
  hunger: 0,
};
