import { ContentIcons } from '../icons';
import { EquipmentSlotId } from '../ids';
import type { ItemConfig } from '../types';

export const copperLoopItemConfig: ItemConfig = {
  key: 'copper-loop',
  name: 'Copper Loop',
  kind: 'artifact',
  slot: EquipmentSlotId.RingLeft,
  icon: ContentIcons.Artifact,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};
