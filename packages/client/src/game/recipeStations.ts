import {
  getSingleStructureProvidingFunction,
  getStructureConfig,
} from './content/structures';
import type { StructureFunction } from './content/types';
import {
  Skill,
  type RecipeDefinition,
  type SkillName,
  type StructureType,
} from './types';

type RecipeStationSkill = Exclude<RecipeDefinition['skill'], Skill.Hand>;
type RecipeStationFunction = Extract<
  StructureFunction,
  'cook' | 'craft' | 'smelt'
>;
type RecipeAction = 'cook' | 'craft' | 'smelt';

const RECIPE_STATION_FUNCTION_BY_SKILL = {
  [Skill.Cooking]: 'cook',
  [Skill.Crafting]: 'craft',
  [Skill.Smelting]: 'smelt',
} satisfies Record<RecipeStationSkill, RecipeStationFunction>;

const RECIPE_SKILL_BY_FUNCTION = Object.freeze(
  Object.fromEntries(
    Object.entries(RECIPE_STATION_FUNCTION_BY_SKILL).map(
      ([skill, structureFunction]) => [structureFunction, skill],
    ),
  ) as Record<RecipeStationFunction, RecipeStationSkill>,
);

export function getRecipeRequiredStructure(
  recipe: Pick<RecipeDefinition, 'skill'>,
): StructureType | null {
  if (recipe.skill === Skill.Hand) {
    return null;
  }

  return getSingleStructureProvidingFunction(
    RECIPE_STATION_FUNCTION_BY_SKILL[recipe.skill],
  );
}

export function getRecipeSkillForStructure(
  structure?: StructureType,
): SkillName | null {
  if (!structure) {
    return null;
  }

  const recipeStationFunction = getStructureConfig(
    structure,
  ).functionsProvided.find(
    (structureFunction): structureFunction is RecipeStationFunction =>
      structureFunction in RECIPE_SKILL_BY_FUNCTION,
  );

  return recipeStationFunction
    ? RECIPE_SKILL_BY_FUNCTION[recipeStationFunction]
    : null;
}

export function getRecipeActionForSkill(
  skill: RecipeDefinition['skill'],
): RecipeAction {
  return skill === Skill.Cooking
    ? 'cook'
    : skill === Skill.Smelting
      ? 'smelt'
      : 'craft';
}
