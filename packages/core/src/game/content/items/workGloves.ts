import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const workGlovesItemConfig: ItemConfig = {
  key: 'work-gloves',
  name: itemName('work-gloves'),
  slot: EquipmentSlotId.Hands,
  icon: ContentIcons.Gauntlet,
  iconPool: GENERATED_ICON_POOLS.gloves,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.animalProduct],
};
