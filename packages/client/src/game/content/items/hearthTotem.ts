import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';
import { MAGICAL_OFFHAND_ABILITY_POOL } from './itemAbilityPools';

export const hearthTotemItemConfig: ItemConfig = {
  key: 'hearth-totem',
  name: itemName('hearth-totem'),
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Totem,
  iconPool: GENERATED_ICON_POOLS.magicalSphere,
  category: 'artifact',
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 3,
  healing: 0,
  hunger: 0,
  grantedAbilityPool: MAGICAL_OFFHAND_ABILITY_POOL,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.mana, GAME_TAGS.item.totem],
};
