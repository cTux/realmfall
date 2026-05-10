import type { ItemRarity } from '@realmfall/core/game/stateTypes';
import { RARITY_COLORS } from '../theme.config';

export const RARITY_COLOR: Record<ItemRarity, string> = RARITY_COLORS;

export function rarityColor(rarity: ItemRarity) {
  return RARITY_COLOR[rarity];
}
