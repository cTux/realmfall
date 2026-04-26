import { itemName } from '../i18n';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';
import { SHIELD_OFFHAND_ABILITY_POOL } from './itemAbilityPools';

export const hideBucklerItemConfig: ItemConfig = {
  key: 'hide-buckler',
  name: itemName('hide-buckler'),
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  iconPool: GENERATED_ICON_POOLS.shield,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 2,
  maxHp: 1,
  healing: 0,
  hunger: 0,
  grantedAbilityPool: SHIELD_OFFHAND_ABILITY_POOL,
  tags: [GAME_TAGS.item.crafted, GAME_TAGS.item.animalProduct],
};
