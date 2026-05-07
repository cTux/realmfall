import type { EquipmentSlotValue, ItemKey } from './content/ids';
import type { GameTag } from './content/tags';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipmentSlotView = EquipmentSlotValue;
export type EquipmentSlot = EquipmentSlotView;

export interface ItemView {
  id: string;
  itemKey?: ItemKey;
  tags?: GameTag[];
  recipeId?: string;
  locked?: boolean;
  slot?: EquipmentSlotView;
  icon?: string;
  name: string;
  quantity: number;
  tier: number;
  rarity: ItemRarity;
  requiredLevel?: number;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
  corrupted?: boolean;
}

export type Item = ItemView;
