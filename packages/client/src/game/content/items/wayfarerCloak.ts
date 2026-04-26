import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const wayfarerCloakItemConfig: ItemConfig = {
  key: 'wayfarer-cloak',
  name: itemName('wayfarer-cloak'),
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  iconPool: GENERATED_ICON_POOLS.cloak,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.cloth],
};
