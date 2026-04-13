import { t } from '../i18n';
import { RECIPE_BOOK_ITEM_NAME_KEY } from './config';
import { buildItemFromConfig, getItemConfigByName } from './content/items';
import type {
  EquipmentSlot,
  GameState,
  Item,
  ItemKind,
  RecipeDefinition,
} from './types';

export function makeStarterWeapon(): Item {
  return buildItemFromConfig('rust-knife', { id: 'starter-knife' });
}

export function makeStarterArmor(
  slot: EquipmentSlot,
  name: string,
  tier: number,
  defense: number,
): Item {
  const configured = getItemConfigByName(name);
  if (configured) {
    return buildItemFromConfig(configured.key, {
      id: `${slot}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  return {
    id: `${slot}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    kind: 'armor',
    slot,
    name,
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
  return buildItemFromConfig('recipe-book');
}

export function makeHomeScroll(id: string): Item {
  return buildItemFromConfig('home-scroll', { id });
}

export function makeConsumable(
  id: string,
  name: string,
  tier: number,
  healing: number,
  hunger: number,
  quantity = 1,
): Item {
  const configured = getItemConfigByName(name);
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
    kind: 'consumable',
    name,
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
  return buildItemFromConfig('gold', { id: 'resource-gold-1', quantity });
}

export function makeResourceStack(
  name: string,
  tier: number,
  quantity: number,
): Item {
  const configured = getItemConfigByName(name);
  if (configured) {
    return buildItemFromConfig(configured.key, {
      id: `resource-${name.toLowerCase().replace(/\s+/g, '-')}-${tier}`,
      quantity,
      tier,
    });
  }

  return {
    id: `resource-${name.toLowerCase().replace(/\s+/g, '-')}-${tier}`,
    kind: 'resource',
    name,
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
  kind: Exclude<ItemKind, 'consumable' | 'resource'>,
  slot: EquipmentSlot,
  name: string,
  stats: Pick<Item, 'power' | 'defense' | 'maxHp'>,
): Item {
  const configured = getItemConfigByName(name);
  if (configured) {
    return buildItemFromConfig(configured.key, { id });
  }

  return {
    id,
    kind,
    slot,
    name,
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
    recipeId: recipe.id,
    kind: 'resource',
    name: `Recipe: ${recipe.name}`,
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
  if (
    recipe.output.kind === 'consumable' ||
    recipe.output.kind === 'resource'
  ) {
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
    kindOrder.indexOf(left.kind) - kindOrder.indexOf(right.kind);
  if (kindDelta !== 0) return kindDelta;
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const rarityDelta =
    rarityOrder.indexOf(right.rarity) - rarityOrder.indexOf(left.rarity);
  if (rarityDelta !== 0) return rarityDelta;
  if (right.tier !== left.tier) return right.tier - left.tier;
  return left.name.localeCompare(right.name);
}

export function isEquippableItem(item: Item) {
  return (
    item.kind === 'weapon' || item.kind === 'armor' || item.kind === 'artifact'
  );
}

export function canEquipItem(item: Item) {
  return isEquippableItem(item);
}

export function canUseItem(item: Item) {
  return item.kind === 'consumable' || isRecipeBook(item) || isRecipePage(item);
}

export function isRecipeBook(item: Item) {
  return (
    item.kind === 'resource' &&
    (item.itemKey === 'recipe-book' ||
      item.name === t(RECIPE_BOOK_ITEM_NAME_KEY))
  );
}

export function isRecipePage(item: Item) {
  return item.kind === 'resource' && Boolean(item.recipeId);
}

export function hasRecipeBook(inventory: Item[]) {
  return inventory.some(isRecipeBook);
}

export function getGoldAmount(inventory: Item[]) {
  return inventory.reduce(
    (sum, item) =>
      item.kind === 'resource' &&
      (item.itemKey === 'gold' || item.name === 'Gold')
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
      item.kind !== 'resource' ||
      (item.itemKey !== 'gold' && item.name !== 'Gold')
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
  const base =
    item.kind === 'artifact'
      ? 16
      : item.kind === 'weapon'
        ? 10
        : item.kind === 'armor'
          ? 8
          : item.kind === 'resource'
            ? 2
            : 3;
  return Math.round(
    (base + item.tier * 2 + rarityOrder.indexOf(item.rarity) * 6) *
      item.quantity,
  );
}

export function prospectYield(item: Item): Item[] {
  const quantity = Math.max(1, Math.ceil(item.tier / 2));
  if (item.kind === 'weapon') {
    return [
      makeResourceStack('Iron Chunks', item.tier, quantity),
      makeResourceStack('Sticks', item.tier, 1),
    ];
  }
  if (item.kind === 'armor') {
    return [
      makeResourceStack(
        item.slot === 'chest' ? 'Cloth' : 'Leather Scraps',
        item.tier,
        quantity,
      ),
      makeResourceStack('Iron Chunks', item.tier, 1),
    ];
  }
  return [makeResourceStack('Aether Dust', item.tier, quantity + 1)];
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
  if (item.kind !== 'consumable' && item.kind !== 'resource') {
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
    (left.kind === 'consumable' || left.kind === 'resource') &&
    left.kind === right.kind &&
    left.recipeId === right.recipeId &&
    sameStackIdentity(left, right) &&
    left.rarity === right.rarity &&
    left.healing === right.healing &&
    left.hunger === right.hunger
  );
}

function sameStackIdentity(left: Item, right: Item) {
  if (left.itemKey && right.itemKey) {
    return left.itemKey === right.itemKey;
  }

  return left.name === right.name;
}
