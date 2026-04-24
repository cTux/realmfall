import { t } from '../i18n';
import { Skill, type GameState } from './types';
import { getStructureConfig } from './content/structures';
import {
  consumeRequirements,
  describeRequirement,
  getRecipeBookEntries as getRecipeBookEntriesFromDefinitions,
  getRecipeBookRecipes as getRecipeBookRecipesFromDefinitions,
  getRecipeRequiredStructure,
  hasAllRequirements,
  pickSatisfiedRequirement,
  RECIPE_BOOK_RECIPES,
} from './crafting';
import { addLog } from './logs';
import { addItemToInventory, materializeRecipeOutput } from './inventory';
import { gainSkillXp } from './progression';
import { cloneForPlayerMutation, message } from './stateMutationHelpers';
import { getCurrentTile } from './stateWorldQueries';

export function getRecipeBookRecipes(learnedRecipeIds?: string[]) {
  return getRecipeBookRecipesFromDefinitions(
    RECIPE_BOOK_RECIPES,
    learnedRecipeIds,
  );
}

export function getRecipeBookEntries(learnedRecipeIds: string[]) {
  return getRecipeBookEntriesFromDefinitions(
    RECIPE_BOOK_RECIPES,
    learnedRecipeIds,
  );
}

export function craftRecipe(
  state: GameState,
  recipeId: string,
  count: number | 'max' = 1,
): GameState {
  if (state.gameOver) return state;
  const craftLimit =
    count === 'max' ? Number.POSITIVE_INFINITY : Math.max(1, count);
  let next = state;
  let crafted = 0;

  while (crafted < craftLimit) {
    const result = craftRecipeOnce(next, recipeId);
    if (!result.ok) {
      return crafted > 0 ? next : message(state, result.error);
    }

    next = result.state;
    crafted += 1;
  }

  return next;
}

function craftRecipeOnce(
  state: GameState,
  recipeId: string,
): { ok: true; state: GameState } | { ok: false; error: string } {
  const recipe = RECIPE_BOOK_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return { ok: false, error: t('game.message.recipe.notInBook') };
  if (!state.player.learnedRecipeIds.includes(recipe.id)) {
    return { ok: false, error: t('game.message.recipe.notLearned') };
  }
  const requiredStructure = getRecipeRequiredStructure(recipe);
  const recipeAction =
    recipe.skill === Skill.Hand
      ? 'craft'
      : recipe.skill === Skill.Cooking
        ? 'cook'
        : recipe.skill === Skill.Smelting
          ? 'smelt'
          : 'craft';
  if (
    requiredStructure &&
    getCurrentTile(state).structure !== requiredStructure
  ) {
    const requiredLabel =
      getStructureConfig(requiredStructure).title.toLowerCase();
    return {
      ok: false,
      error: t('game.message.recipe.requiresStation', {
        station: requiredLabel,
        action: recipeAction,
      }),
    };
  }
  if (!hasAllRequirements(state.player.inventory, recipe.ingredients)) {
    return {
      ok: false,
      error: t('game.message.recipe.missingMaterials', {
        item: recipe.output.name,
      }),
    };
  }

  const chosenFuel = recipe.fuelOptions
    ? pickSatisfiedRequirement(state.player.inventory, recipe.fuelOptions)
    : undefined;
  if (recipe.fuelOptions && !chosenFuel) {
    return { ok: false, error: t('game.message.recipe.needsFuel') };
  }

  const next = cloneForPlayerMutation(state);
  consumeRequirements(next.player.inventory, recipe.ingredients);
  if (chosenFuel) consumeRequirements(next.player.inventory, [chosenFuel]);
  addItemToInventory(
    next.player.inventory,
    materializeRecipeOutput(recipe, next),
  );
  gainSkillXp(next, recipe.skill, recipe.output.tier, addLog);
  addLog(
    next,
    'system',
    recipe.skill === Skill.Cooking
      ? t('game.message.craft.cook', {
          item: recipe.output.name,
          fuel: chosenFuel
            ? ` ${t('ui.common.with')} ${describeRequirement(chosenFuel)}`
            : '',
        })
      : recipe.skill === Skill.Smelting
        ? t('game.message.craft.smelt', { item: recipe.output.name })
        : t('game.message.craft.make', { item: recipe.output.name }),
  );
  return { ok: true, state: next };
}
