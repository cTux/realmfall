import { t } from '../i18n';
import { RECIPE_BOOK_ITEM_NAME_KEY } from './config';
import { EquipmentSlotId, ItemId } from './content/ids';
import {
  buildItemFromConfig,
  getItemCategory,
  getItemConfigByKey,
  getItemConfigByName,
  hasItemTag,
  inferItemTags,
  isEquippableItemCategory,
} from './content/items';
import { GAME_TAGS } from './content/tags';
import type { EquipmentSlot, GameState, Item, RecipeDefinition } from './types';

export function makeStarterWeapon(): Item {
  return buildItemFromConfig(ItemId.RustKnife, { id: 'starter-knife' });
}

export function makeStarterArmor(
  slot: EquipmentSlot,
  itemKeyOrName: string,
  tier: number,
  defense: number,
): Item {
  const configured =
    getItemConfigByKey(itemKeyOrName) ?? getItemConfigByName(itemKeyOrName);
  if (configured) {
    return buildItemFromConfig(configured.key, {
      id: `${slot}-${configured.key}`,
    });
  }

  return {
    id: `${slot}-${itemKeyOrName.toLowerCase().replace(/\s+/g, '-')}`,
    slot,
    name: itemKeyOrName,
    tags: inferItemTags({
      slot,
      name: itemKeyOrName,
      healing: 0,
      hunger: 0,
      thirst: 0,
    }),
    quantity: 1,
    tier,
    rarity: 'common',
    power: 0,
    defense,
    maxHp: tier,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };
}

export function makeRecipeBook(): Item {
  return buildItemFromConfig(ItemId.RecipeBook);
}

export function makeHomeScroll(id: string): Item {
  return buildItemFromConfig(ItemId.HomeScroll, { id });
}

export function makeConsumable(
  id: string,
  itemKeyOrName: string,
  tier: number,
  healing: number,
  hunger: number,
  quantity = 1,
): Item {
  const configured =
    getItemConfigByKey(itemKeyOrName) ?? getItemConfigByName(itemKeyOrName);
  if (configured) {
    return buildItemFromConfig(configured.key, {
      id,
      quantity,
      tier,
      healing,
      hunger,
      thirst: configured.thirst ?? 0,
    });
  }

  return {
    id,
    name: itemKeyOrName,
    tags: inferItemTags({
      name: itemKeyOrName,
      healing,
      hunger,
      thirst: 0,
    }),
    quantity,
    tier,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing,
    hunger,
    thirst: 0,
  };
}

export function makeGoldStack(quantity: number): Item {
  return buildItemFromConfig(ItemId.Gold, { id: 'resource-gold-1', quantity });
}

export function makeResourceStack(
  itemKeyOrName: string,
  tier: number,
  quantity: number,
): Item {
  const configured =
    getItemConfigByKey(itemKeyOrName) ?? getItemConfigByName(itemKeyOrName);
  if (configured) {
    return buildItemFromConfig(configured.key, {
      id: `resource-${configured.key}-${tier}`,
      quantity,
      tier,
    });
  }

  return {
    id: `resource-${itemKeyOrName.toLowerCase().replace(/\s+/g, '-')}-${tier}`,
    name: itemKeyOrName,
    tags: inferItemTags({
      name: itemKeyOrName,
      healing: 0,
      hunger: 0,
      thirst: 0,
    }),
    quantity,
    tier,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };
}

export function makeCraftedItem(
  id: string,
  slot: EquipmentSlot,
  itemKeyOrName: string,
  stats: Pick<Item, 'power' | 'defense' | 'maxHp'>,
): Item {
  const configured =
    getItemConfigByKey(itemKeyOrName) ?? getItemConfigByName(itemKeyOrName);
  if (configured) {
    return buildItemFromConfig(configured.key, { id });
  }

  return {
    id,
    slot,
    name: itemKeyOrName,
    tags: inferItemTags({
      slot,
      name: itemKeyOrName,
      healing: 0,
      hunger: 0,
      thirst: 0,
    }),
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: stats.power,
    defense: stats.defense,
    maxHp: stats.maxHp,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };
}

export function makeCookedFish(): Item {
  return buildItemFromConfig('cooked-fish');
}

export function makeRecipePage(recipe: RecipeDefinition): Item {
  return {
    id: `recipe-${recipe.id}`,
    itemKey: recipe.output.itemKey,
    recipeId: recipe.id,
    name: `Recipe: ${recipe.name}`,
    tags: [GAME_TAGS.item.resource, GAME_TAGS.item.recipe],
    quantity: 1,
    tier: recipe.output.tier,
    rarity: 'uncommon',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };
}

export function materializeRecipeOutput(
  recipe: RecipeDefinition,
  state: GameState,
): Item {
  if (hasItemTag(recipe.output, GAME_TAGS.item.stackable)) {
    return { ...recipe.output };
  }

  return {
    ...recipe.output,
    id: `${recipe.output.id}-${state.turn}-${state.logSequence}`,
  };
}

export function describeItemStack(item: Item) {
  return item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name;
}

export function compareItems(left: Item, right: Item) {
  const kindOrder = ['resource', 'consumable', 'artifact', 'armor', 'weapon'];
  const kindDelta =
    kindOrder.indexOf(getItemCategory(left)) -
    kindOrder.indexOf(getItemCategory(right));
  if (kindDelta !== 0) return kindDelta;
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const rarityDelta =
    rarityOrder.indexOf(right.rarity) - rarityOrder.indexOf(left.rarity);
  if (rarityDelta !== 0) return rarityDelta;
  if (right.tier !== left.tier) return right.tier - left.tier;
  return left.name.localeCompare(right.name);
}

export function isEquippableItem(item: Item) {
  return isEquippableItemCategory(getItemCategory(item));
}

export function canEquipItem(item: Item) {
  return isEquippableItem(item);
}

export function canUseItem(item: Item) {
  return (
    hasItemTag(item, GAME_TAGS.item.consumable) ||
    isRecipeBook(item) ||
    isRecipePage(item)
  );
}

export function isRecipeBook(item: Item) {
  return (
    hasItemTag(item, GAME_TAGS.item.resource) &&
    (item.itemKey === ItemId.RecipeBook ||
      hasItemTag(item, GAME_TAGS.item.recipeBook) ||
      item.name === t(RECIPE_BOOK_ITEM_NAME_KEY))
  );
}

export function isRecipePage(item: Item) {
  return hasItemTag(item, GAME_TAGS.item.resource) && Boolean(item.recipeId);
}

export function hasRecipeBook(inventory: Item[]) {
  return inventory.some(isRecipeBook);
}

export function getGoldAmount(inventory: Item[]) {
  return inventory.reduce(
    (sum, item) =>
      hasItemTag(item, GAME_TAGS.item.resource) &&
      (item.itemKey === ItemId.Gold ||
        hasItemTag(item, GAME_TAGS.item.currency))
        ? sum + item.quantity
        : sum,
    0,
  );
}

export function spendGold(inventory: Item[], amount: number) {
  let remaining = amount;
  for (
    let index = inventory.length - 1;
    index >= 0 && remaining > 0;
    index -= 1
  ) {
    const item = inventory[index];
    if (
      !hasItemTag(item, GAME_TAGS.item.resource) ||
      (item.itemKey !== ItemId.Gold &&
        !hasItemTag(item, GAME_TAGS.item.currency))
    ) {
      continue;
    }
    const spent = Math.min(item.quantity, remaining);
    item.quantity -= spent;
    remaining -= spent;
    if (item.quantity <= 0) inventory.splice(index, 1);
  }
}

export function sellValue(item: Item) {
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const category = getItemCategory(item);
  const base =
    category === 'artifact'
      ? 16
      : category === 'weapon'
        ? 10
        : category === 'armor'
          ? 8
          : category === 'resource'
            ? 2
            : 3;
  return Math.round(
    (base + item.tier * 2 + rarityOrder.indexOf(item.rarity) * 6) *
      item.quantity,
  );
}

export function prospectYield(item: Item): Item[] {
  const quantity = Math.max(1, Math.ceil(item.tier / 2));
  const category = getItemCategory(item);
  if (category === 'weapon') {
    return [
      makeResourceStack(ItemId.IronChunks, item.tier, quantity),
      makeResourceStack(ItemId.Sticks, item.tier, 1),
    ];
  }
  if (category === 'armor') {
    return [
      makeResourceStack(
        item.slot === EquipmentSlotId.Chest
          ? ItemId.Cloth
          : ItemId.LeatherScraps,
        item.tier,
        quantity,
      ),
      makeResourceStack(ItemId.IronChunks, item.tier, 1),
    ];
  }
  return [makeResourceStack(ItemId.ArcaneDust, item.tier, quantity + 1)];
}

export function consumeInventoryItem(
  inventory: Item[],
  itemIndex: number,
  item: Item,
) {
  if (item.quantity > 1) {
    inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - 1,
    };
    return;
  }

  inventory.splice(itemIndex, 1);
}

export function consolidateInventory(inventory: Item[]) {
  return inventory.reduce<Item[]>((merged, item) => {
    addItemToInventory(merged, item);
    return merged;
  }, []);
}

export function addItemToInventory(inventory: Item[], item: Item) {
  if (!hasItemTag(item, GAME_TAGS.item.stackable)) {
    inventory.push(ensureUniqueItemId(inventory, item));
    return;
  }

  const existing = inventory.find((entry) => isSameStackable(entry, item));
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  inventory.push(ensureUniqueItemId(inventory, item));
}

function ensureUniqueItemId(collection: Item[], item: Item) {
  if (!collection.some((entry) => entry.id === item.id)) return item;

  let suffix = 2;
  let candidateId = `${item.id}-${suffix}`;
  while (collection.some((entry) => entry.id === candidateId)) {
    suffix += 1;
    candidateId = `${item.id}-${suffix}`;
  }

  return {
    ...item,
    id: candidateId,
  };
}

function isSameStackable(left: Item, right: Item) {
  return (
    hasItemTag(left, GAME_TAGS.item.stackable) &&
    getItemCategory(left) === getItemCategory(right) &&
    left.recipeId === right.recipeId &&
    sameStackIdentity(left, right) &&
    left.rarity === right.rarity &&
    left.healing === right.healing &&
    left.hunger === right.hunger &&
    (left.thirst ?? 0) === (right.thirst ?? 0)
  );
}

function sameStackIdentity(left: Item, right: Item) {
  if (left.itemKey && right.itemKey) {
    return left.itemKey === right.itemKey;
  }

  return left.name === right.name;
}
