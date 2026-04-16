import { EquipmentSlotId, ItemId } from './content/ids';
import {
  buildItemFromConfig,
  getItemCategory,
  getItemConfigByKey,
  hasItemTag,
  isEquippableItemCategory,
} from './content/items';
import { getRecipeOutput } from './crafting';
import { GAME_TAGS } from './content/tags';
import { Skill, type EquipmentSlot, type GameState, type Item, type RecipeDefinition } from './types';
import {
  applyRarityToItem,
  resolveCascadingRarity,
  withCascadingRarityChanceBonus,
} from './shared';
import { createRng } from './random';

export function makeStarterWeapon(): Item {
  return buildItemFromConfig(ItemId.TownKnife, { id: 'starter-knife' });
}

export function makeStarterArmor(
  slot: EquipmentSlot,
  itemKey: string,
  _tier: number,
  _defense: number,
): Item {
  const configured = getRequiredItemConfig(itemKey);
  return buildItemFromConfig(configured.key, {
    id: `${slot}-${configured.key}`,
  });
}

export function makeHomeScroll(id: string): Item {
  return buildItemFromConfig(ItemId.HomeScroll, { id });
}

export function makeConsumable(
  id: string,
  itemKey: string,
  tier: number,
  healing: number,
  hunger: number,
  quantity = 1,
): Item {
  const configured = getRequiredItemConfig(itemKey);
  return buildItemFromConfig(configured.key, {
    id,
    quantity,
    tier,
    healing,
    hunger,
    thirst: configured.thirst ?? 0,
  });
}

export function makeGoldStack(quantity: number): Item {
  return buildItemFromConfig(ItemId.Gold, { id: 'resource-gold-1', quantity });
}

export function makeResourceStack(
  itemKey: string,
  tier: number,
  quantity: number,
): Item {
  const configured = getRequiredItemConfig(itemKey);
  return buildItemFromConfig(configured.key, {
    id: `resource-${configured.key}-${tier}`,
    quantity,
    tier,
  });
}

export function makeCraftedItem(
  id: string,
  slot: EquipmentSlot,
  itemKey: string,
  _stats: Pick<Item, 'power' | 'defense' | 'maxHp'>,
): Item {
  const configured = getRequiredItemConfig(itemKey);
  return buildItemFromConfig(configured.key, { id });
}

export function makeCookedFish(): Item {
  return buildItemFromConfig('cooked-fish');
}

export function makeRecipePage(recipe: RecipeDefinition): Item {
  return {
    id: `recipe-${recipe.id}`,
    recipeId: recipe.id,
    icon: recipe.output.icon,
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
  let output = getRecipeOutput(
    recipe,
    state.player.skills[recipe.skill]?.level ?? 1,
  );

  if (recipe.skill === Skill.Crafting) {
    output = materializeCraftedRecipeOutput(recipe, state, output);
  }

  if (hasItemTag(output, GAME_TAGS.item.stackable)) {
    return output;
  }

  return {
    ...output,
    id: `${output.id}-${state.turn}-${state.logSequence}`,
  };
}

function materializeCraftedRecipeOutput(
  recipe: RecipeDefinition,
  state: GameState,
  output: Item,
) {
  const leveledOutput = scaleCraftedItemToPlayerLevel(output, state.player.level);
  const tierBonus = Math.min(0.12, leveledOutput.tier * 0.02);
  const rarity = resolveCascadingRarity(
    createRng(
      `${state.seed}:crafted-rarity:${recipe.id}:${state.turn}:${state.logSequence}`,
    ),
    leveledOutput.rarity,
    withCascadingRarityChanceBonus({
      legendary: tierBonus * 0.08,
      epic: tierBonus * 0.22,
      rare: tierBonus * 0.5,
      uncommon: tierBonus,
    }),
  );

  return applyRarityToItem({
    ...leveledOutput,
    rarity,
  });
}

function scaleCraftedItemToPlayerLevel(item: Item, playerLevel: number): Item {
  const targetTier = Math.max(1, playerLevel);
  if (item.tier === targetTier) return item;

  const scale = targetTier / Math.max(1, item.tier);
  return {
    ...item,
    tier: targetTier,
    power: Math.max(0, Math.round(item.power * scale)),
    defense: Math.max(0, Math.round(item.defense * scale)),
    maxHp: Math.max(0, Math.round(item.maxHp * scale)),
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

export function canUseItem(item: Item, learnedRecipeIds: string[] = []) {
  if (hasItemTag(item, GAME_TAGS.item.consumable)) {
    return true;
  }

  const recipeId = item.recipeId;
  if (!isRecipePage(item) || !recipeId) {
    return false;
  }

  return !learnedRecipeIds.includes(recipeId);
}

export function isRecipePage(item: Item) {
  return hasItemTag(item, GAME_TAGS.item.resource) && Boolean(item.recipeId);
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
  const recipePage = isRecipePage(item);
  const base =
    recipePage
      ? 24
      : category === 'artifact'
      ? 16
      : category === 'weapon'
        ? 10
        : category === 'armor'
          ? 8
          : category === 'resource'
            ? 2
            : 3;
  return Math.round(
    (base +
      item.tier * (recipePage ? 4 : 2) +
      rarityOrder.indexOf(item.rarity) * (recipePage ? 8 : 6)) *
      item.quantity,
  );
}

export function prospectYield(item: Item): Item[] {
  const quantity = Math.max(1, Math.ceil(item.tier / 2));
  const category = getItemCategory(item);
  if (category === 'weapon') {
    return [
      makeResourceStack(ItemId.IronOre, item.tier, quantity),
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
      makeResourceStack(ItemId.IronOre, item.tier, 1),
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

function getRequiredItemConfig(itemKey: string) {
  const configured = getItemConfigByKey(itemKey);
  if (configured) return configured;
  throw new Error(`Missing item config: ${itemKey}`);
}
