import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const settlerVestItemConfig: ItemConfig = {
  key: 'settler-vest',
  name: itemName('settler-vest'),
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  iconPool: GENERATED_ICON_POOLS.chest,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 2,
  maxHp: 1,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.cloth],
};
