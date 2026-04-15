import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const copperBandItemConfig: ItemConfig = {
  key: 'copper-band',
  name: itemName('copper-band'),
  slot: EquipmentSlotId.RingRight,
  icon: ContentIcons.Artifact,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
