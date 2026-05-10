import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const copperLoopItemConfig: ItemConfig = {
  key: 'copper-loop',
  name: itemName('copper-loop'),
  slot: EquipmentSlotId.RingLeft,
  icon: ContentIcons.Artifact,
  iconPool: GENERATED_ICON_POOLS.ring,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 1,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.mana],
};
