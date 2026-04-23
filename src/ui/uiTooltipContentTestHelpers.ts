import { EquipmentSlotId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import type { Item } from '../game/stateTypes';

export const equippedTooltipItem: Item = {
  id: 'weapon-equipped',
  slot: EquipmentSlotId.Weapon,
  name: 'Old Blade',
  quantity: 1,
  tier: 1,
  rarity: 'common',
  power: 1,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};

export const weaponTooltipItem: Item = {
  ...equippedTooltipItem,
  id: 'weapon-new',
  name: 'Knight Blade',
  tags: undefined,
  grantedAbilityId: 'slash',
  tier: 2,
  rarity: 'rare',
  power: 4,
  defense: 2,
  maxHp: 3,
};

export const consumableTooltipItem: Item = {
  id: 'food-1',
  name: 'Meal',
  tags: [GameTag.ItemFood, GameTag.ItemHealing],
  quantity: 2,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 12,
  hunger: 8,
};

export const resourceTooltipItem: Item = {
  id: 'gold-1',
  name: 'Gold',
  tags: [GameTag.ItemResource, GameTag.ItemCurrency],
  quantity: 7,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};

export const manaPotionTooltipItem: Item = {
  id: 'mana-potion-1',
  itemKey: 'mana-potion',
  name: 'Mana Potion',
  quantity: 1,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  tags: [GameTag.ItemConsumable, GameTag.ItemStackable],
};

export const recipePageTooltipItem: Item = {
  id: 'recipe-1',
  recipeId: 'cook-cooked-fish',
  icon: 'recipe.svg',
  name: 'Recipe: Cooked Fish',
  tags: [GameTag.ItemResource, GameTag.ItemRecipe],
  quantity: 1,
  tier: 1,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  thirst: 0,
};
