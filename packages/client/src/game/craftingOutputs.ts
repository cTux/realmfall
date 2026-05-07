import { clampItemLevel, scaleMainItemStatForLevel } from './balance';
import { getRecipeOutput } from './crafting';
import { ItemId } from './content/ids';
import { GAME_TAGS } from './content/tags';
import { buildItemFromConfig, hasItemTag } from './content/items';
import { createRng } from './random';
import {
  applyRarityToItem,
  resolveCascadingRarity,
  withCascadingRarityChanceBonus,
} from './shared';
import {
  Skill,
  type GameState,
  type Item,
  type RecipeDefinition,
} from './types';

export function makeRecipePage(recipe: RecipeDefinition): Item {
  return {
    id: `recipe-${recipe.id}`,
    itemKey: ItemId.RecipeBook,
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
  const leveledOutput = scaleCraftedItemToPlayerLevel(
    output,
    state.player.level,
  );
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
  const targetTier = clampItemLevel(playerLevel);
  if (item.tier === targetTier) return item;

  if (item.itemKey) {
    return buildItemFromConfig(item.itemKey, {
      id: item.id,
      recipeId: item.recipeId,
      locked: item.locked,
      quantity: item.quantity,
      tier: targetTier,
      rarity: item.rarity,
      icon: item.icon,
      name: item.name,
      tags: item.tags,
      secondaryStatCapacity: item.secondaryStatCapacity,
      secondaryStats: item.secondaryStats,
      reforgedSecondaryStatIndex: item.reforgedSecondaryStatIndex,
      enchantedSecondaryStatIndex: item.enchantedSecondaryStatIndex,
      corrupted: item.corrupted,
      grantedAbilityId: item.grantedAbilityId,
    });
  }

  return {
    ...item,
    tier: targetTier,
    power: item.power > 0 ? scaleMainItemStatForLevel(targetTier) : 0,
    defense: item.defense > 0 ? scaleMainItemStatForLevel(targetTier) : 0,
    maxHp: item.maxHp > 0 ? scaleMainItemStatForLevel(targetTier) : 0,
  };
}
