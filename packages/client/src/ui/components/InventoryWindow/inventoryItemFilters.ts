import {
  buildItemFromConfig,
  getItemCategory,
  hasItemTag,
  isEquippableItemCategory,
} from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { GAME_TAGS } from '../../../game/content/tags';
import { isRecipePage } from '../../../game/inventory';
import type { Item } from '../../../game/stateTypes';

export type InventoryItemFilterId =
  | 'equippable'
  | 'consumable'
  | 'material'
  | 'recipe'
  | 'currency'
  | 'resource';

interface InventoryItemFilterDefinition {
  id: InventoryItemFilterId;
  labelKey: string;
  previewItem: Item;
}

export const INVENTORY_ITEM_FILTERS = [
  {
    id: 'equippable',
    labelKey: 'ui.inventory.filter.equippable',
    previewItem: buildItemFromConfig(ItemId.TownKnife, {
      id: 'inventory-filter-equippable',
    }),
  },
  {
    id: 'consumable',
    labelKey: 'ui.inventory.filter.consumable',
    previewItem: buildItemFromConfig(ItemId.TrailRation, {
      id: 'inventory-filter-consumable',
    }),
  },
  {
    id: 'material',
    labelKey: 'ui.inventory.filter.materials',
    previewItem: buildItemFromConfig(ItemId.Cloth, {
      id: 'inventory-filter-materials',
    }),
  },
  {
    id: 'recipe',
    labelKey: 'ui.inventory.filter.recipes',
    previewItem: {
      id: 'inventory-filter-recipes',
      itemKey: ItemId.RecipeBook,
      recipeId: 'inventory-filter-recipe-page',
      icon: buildItemFromConfig(ItemId.CampSpear, {
        id: 'inventory-filter-recipe-icon',
      }).icon,
      name: 'Recipe: Camp Spear',
      tags: [GAME_TAGS.item.resource, GAME_TAGS.item.recipe],
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
  },
  {
    id: 'currency',
    labelKey: 'ui.inventory.filter.currency',
    previewItem: buildItemFromConfig(ItemId.Gold, {
      id: 'inventory-filter-currency',
      quantity: 12,
    }),
  },
  {
    id: 'resource',
    labelKey: 'ui.inventory.filter.resources',
    previewItem: buildItemFromConfig(ItemId.Stone, {
      id: 'inventory-filter-resources',
      quantity: 3,
    }),
  },
] satisfies readonly InventoryItemFilterDefinition[];

export const ALL_INVENTORY_ITEM_FILTER_IDS = INVENTORY_ITEM_FILTERS.map(
  ({ id }) => id,
);

export function getInventoryItemFilterId(item: Item): InventoryItemFilterId {
  if (isRecipePage(item)) return 'recipe';

  const category = getItemCategory(item);
  if (isEquippableItemCategory(category)) return 'equippable';
  if (category === 'consumable') return 'consumable';
  if (hasItemTag(item, GAME_TAGS.item.currency)) return 'currency';
  if (hasItemTag(item, GAME_TAGS.item.craftingMaterial)) return 'material';
  return 'resource';
}
