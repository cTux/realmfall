import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const charmNecklaceItemConfig: ItemConfig = {
  key: 'charm-necklace',
  name: itemName('charm-necklace'),
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  iconPool: GENERATED_ICON_POOLS.necklace,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 2,
  healing: 0,
  hunger: 0,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.mana],
};
