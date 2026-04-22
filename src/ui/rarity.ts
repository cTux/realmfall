import type { ItemRarity } from '../game/stateTypes';

export const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#f8fafc',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fb923c',
};

export function rarityColor(rarity: ItemRarity) {
  return RARITY_COLOR[rarity];
}
