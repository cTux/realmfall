import { useMemo } from 'react';
import { getItemConfigByKey } from '../../../game/content/items';
import { getStructureConfig } from '../../../game/content/structures';
import {
  getRecipeOutput,
  getRecipeRequiredStructure,
} from '../../../game/crafting';
import { Skill, type RecipeBookEntry } from '../../../game/types';
import type { Tile } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import type { TooltipLine } from '../../tooltips';
import {
  canCraftRecipeEntry,
  getRecipeCraftAvailabilityCount,
} from './utils/recipeBookEntries';

interface RecipeBookRowsArgs {
  currentStructure?: Tile['structure'];
  inventoryCountsByItemKey: Record<string, number>;
  recipeSkillLevels: Record<Skill, number>;
  recipes: RecipeBookEntry[];
  visibleRecipeCount: number;
}

export interface RecipeBookRow {
  actionLabel: string;
  canCraft: boolean;
  craftCount: number;
  recipe: RecipeBookEntry;
  recipeOutput: ReturnType<typeof getRecipeOutput>;
  requiredStructureLabel: string;
  tintOverride: string | undefined;
  tooltipLines: TooltipLine[] | undefined;
}

export function useRecipeBookRows(args: RecipeBookRowsArgs) {
  const {
    currentStructure,
    inventoryCountsByItemKey,
    recipeSkillLevels,
    recipes,
    visibleRecipeCount,
  } = args;

  return useMemo(
    () =>
      buildRecipeBookRows({
        currentStructure,
        inventoryCountsByItemKey,
        recipeSkillLevels,
        recipes,
        visibleRecipeCount,
      }),
    [
      currentStructure,
      inventoryCountsByItemKey,
      recipeSkillLevels,
      recipes,
      visibleRecipeCount,
    ],
  );
}

export function buildRecipeBookRows({
  currentStructure,
  inventoryCountsByItemKey,
  recipeSkillLevels,
  recipes,
  visibleRecipeCount,
}: RecipeBookRowsArgs): RecipeBookRow[] {
  return recipes.slice(0, visibleRecipeCount).map((recipe) => {
    const recipeOutput = getRecipeOutput(
      recipe,
      recipeSkillLevels[recipe.skill] ?? 1,
    );
    const requiredStructure = getRecipeRequiredStructure(recipe);
    const requiredStructureLabel =
      requiredStructure === null
        ? t('ui.recipeBook.siteHand')
        : getStructureConfig(requiredStructure).title;
    const atRequiredStructure =
      requiredStructure === null || currentStructure === requiredStructure;
    const canCraft = canCraftRecipeEntry(recipe, {
      currentStructure,
      inventoryCountsByItemKey,
    });
    const craftCount = canCraft
      ? getRecipeCraftAvailabilityCount(recipe, {
          currentStructure,
          inventoryCountsByItemKey,
        })
      : 0;
    const tintOverride = getRecipeSlotTint(recipe, canCraft);
    const tooltipLines = recipe.learned
      ? buildRecipeTooltipLines(
          recipe,
          inventoryCountsByItemKey,
          requiredStructureLabel,
          atRequiredStructure,
        )
      : buildMissingRecipeTooltipLines();

    return {
      actionLabel: getRecipeActionLabel(recipe.skill),
      canCraft,
      craftCount,
      recipe,
      recipeOutput,
      requiredStructureLabel,
      tintOverride,
      tooltipLines,
    };
  });
}

function buildRecipeTooltipLines(
  recipe: RecipeBookEntry,
  inventoryCountsByItemKey: Record<string, number>,
  requiredStructureLabel: string,
  atRequiredStructure: boolean,
) {
  const requiredStructure = getRecipeRequiredStructure(recipe);
  const requiredStructureConfig =
    requiredStructure === null ? null : getStructureConfig(requiredStructure);
  const lines: TooltipLine[] = [
    { kind: 'text' as const, text: recipe.description },
    {
      kind: 'stat' as const,
      label: t('ui.recipeBook.tooltip.siteLabel'),
      value: requiredStructureLabel,
      icon: requiredStructureConfig?.icon,
      iconTint: requiredStructureConfig
        ? pixiTintToCss(requiredStructureConfig.tint)
        : undefined,
      tone: atRequiredStructure ? 'item' : 'negative',
    },
    {
      kind: 'text' as const,
      text: t('ui.recipeBook.tooltip.materialsLabel'),
      tone: 'section' as const,
    },
    ...recipe.ingredients.map((ingredient) => {
      const owned =
        inventoryCountsByItemKey[ingredient.itemKey ?? ingredient.name] ?? 0;
      const itemConfig = ingredient.itemKey
        ? getItemConfigByKey(ingredient.itemKey)
        : undefined;

      return {
        kind: 'stat' as const,
        label: ingredient.name,
        value: `${owned}/${ingredient.quantity}`,
        icon: itemConfig?.icon,
        iconTint: itemConfig?.tint,
        tone:
          owned >= ingredient.quantity
            ? ('item' as const)
            : ('negative' as const),
      };
    }),
    ...(recipe.fuelOptions
      ? [
          {
            kind: 'text' as const,
            text: t('ui.recipeBook.tooltip.fuelMaterialsLabel'),
            tone: 'section' as const,
          },
          {
            kind: 'text' as const,
            text: t('ui.recipeBook.tooltip.fuelOneOfHint'),
            tone: 'item' as const,
          },
          ...recipe.fuelOptions.map((fuel) => {
            const owned =
              inventoryCountsByItemKey[fuel.itemKey ?? fuel.name] ?? 0;
            const itemConfig = fuel.itemKey
              ? getItemConfigByKey(fuel.itemKey)
              : undefined;
            return {
              kind: 'stat' as const,
              label: fuel.name,
              value: `${owned}/${fuel.quantity}`,
              icon: itemConfig?.icon,
              iconTint: itemConfig?.tint,
              tone:
                owned >= fuel.quantity
                  ? ('item' as const)
                  : ('negative' as const),
            };
          }),
        ]
      : []),
  ];

  return lines;
}

function buildMissingRecipeTooltipLines() {
  return [
    {
      kind: 'text' as const,
      tone: 'negative' as const,
      text: t('ui.recipeBook.tooltip.missing'),
    },
  ];
}

function getRecipeActionLabel(skill: Skill) {
  if (skill === Skill.Cooking) return t('ui.recipeBook.cookAction');
  if (skill === Skill.Smelting) return t('ui.recipeBook.smeltAction');
  return t('ui.recipeBook.craftAction');
}

function pixiTintToCss(tint: number) {
  return `#${tint.toString(16).padStart(6, '0')}`;
}

function getRecipeSlotTint(recipe: RecipeBookEntry, canCraft: boolean) {
  if (!recipe.learned) return 'rgba(148, 163, 184, 0.45)';
  if (recipe.skill === Skill.Crafting) {
    return canCraft ? '#f8fafc' : 'rgba(248, 113, 113, 0.92)';
  }
  return canCraft ? undefined : 'rgba(248, 113, 113, 0.92)';
}
