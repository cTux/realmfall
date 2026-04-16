import { useEffect, useMemo, useState } from 'react';
import { getItemConfigByKey } from '../../../game/content/items';
import { getStructureConfig } from '../../../game/content/structures';
import {
  getRecipeOutput,
  getRecipeRequiredStructure,
  recipeUsesItemKey,
} from '../../../game/crafting';
import { Skill, type RecipeBookEntry } from '../../../game/types';
import { t } from '../../../i18n';
import { formatSkillLabel } from '../../../i18n/labels';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { TooltipLine } from '../../tooltips';
import type { RecipeBookWindowProps } from './types';
import {
  canCraftRecipeEntry,
  compareRecipeBookEntries,
} from './utils/recipeBookEntries';
import styles from './styles.module.scss';

const RECIPE_BOOK_TAB_ORDER = [Skill.Cooking, Skill.Smelting, Skill.Crafting];

type RecipeBookWindowContentProps = Pick<
  RecipeBookWindowProps,
  | 'currentStructure'
  | 'recipes'
  | 'recipeSkillLevels'
  | 'inventoryCountsByItemKey'
  | 'materialFilterItemKey'
  | 'onResetMaterialFilter'
  | 'onCraft'
  | 'onHoverDetail'
  | 'onLeaveDetail'
>;

export function RecipeBookWindowContent({
  currentStructure,
  recipes,
  recipeSkillLevels,
  inventoryCountsByItemKey,
  materialFilterItemKey,
  onResetMaterialFilter,
  onCraft,
  onHoverDetail,
  onLeaveDetail,
}: RecipeBookWindowContentProps) {
  const visibleTabs = useMemo(() => {
    const filtered = recipes.filter(
      (recipe) =>
        !materialFilterItemKey ||
        recipeUsesItemKey(recipe, materialFilterItemKey),
    );
    return RECIPE_BOOK_TAB_ORDER.filter((skill) =>
      filtered.some((recipe) => recipe.skill === skill),
    );
  }, [materialFilterItemKey, recipes]);
  const [activeSkill, setActiveSkill] = useState<Skill>(
    visibleTabs[0] ?? Skill.Cooking,
  );

  useEffect(() => {
    if (visibleTabs.includes(activeSkill)) return;
    setActiveSkill(visibleTabs[0] ?? Skill.Cooking);
  }, [activeSkill, visibleTabs]);

  const visibleRecipes = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          recipe.skill === activeSkill &&
          (!materialFilterItemKey ||
            recipeUsesItemKey(recipe, materialFilterItemKey)),
      )
        .slice()
        .sort((left, right) =>
          compareRecipeBookEntries(left, right, {
            currentStructure,
            inventoryCountsByItemKey,
          }),
        ),
    [activeSkill, currentStructure, inventoryCountsByItemKey, materialFilterItemKey, recipes],
  );
  const filterItemName = materialFilterItemKey
    ? (getItemConfigByKey(materialFilterItemKey)?.name ?? materialFilterItemKey)
    : null;

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        {filterItemName ? (
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>
              {t('ui.recipeBook.filterLabel', { item: filterItemName })}
            </span>
            <button
              type="button"
              className={styles.filterReset}
              onClick={onResetMaterialFilter}
            >
              {t('ui.recipeBook.resetFilterAction')}
            </button>
          </div>
        ) : null}
        {visibleRecipes.length === 0 ? (
          <div className={styles.empty}>
            {filterItemName
              ? t('ui.recipeBook.emptyFilter')
              : t('ui.recipeBook.empty')}
          </div>
        ) : (
          <div className={styles.list}>
            {visibleRecipes.map((recipe) => {
              const recipeOutput = getRecipeOutput(
                recipe,
                recipeSkillLevels[recipe.skill] ?? 1,
              );
              const requiredStructure = getRecipeRequiredStructure(recipe);
              const requiredStructureLabel =
                getStructureConfig(requiredStructure).title;
              const atRequiredStructure = currentStructure === requiredStructure;
              const canCraft = canCraftRecipeEntry(recipe, {
                currentStructure,
                inventoryCountsByItemKey,
              });
              const tintOverride = getRecipeSlotTint(recipe, canCraft);
              const tooltipLines = recipe.learned
                ? buildRecipeTooltipLines(
                    recipe,
                    inventoryCountsByItemKey,
                    requiredStructureLabel,
                    atRequiredStructure,
                  )
                : undefined;

              return (
                <div
                  key={recipe.id}
                  className={[
                    styles.entry,
                    recipe.learned ? '' : styles.entryDisabled,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <ItemSlotButton
                    item={recipeOutput}
                    size="compact"
                    disabled={!recipe.learned}
                    tintOverride={tintOverride}
                    onClick={canCraft ? () => onCraft(recipe.id) : undefined}
                    onMouseEnter={
                      recipe.learned
                        ? (event) =>
                            onHoverDetail?.(
                              event,
                              recipe.name,
                              tooltipLines ?? [],
                              tintOverride,
                            )
                        : undefined
                    }
                    onMouseLeave={recipe.learned ? onLeaveDetail : undefined}
                  />
                  <div className={styles.meta}>
                    <div className={styles.titleRow}>
                      <span className={styles.title}>{recipe.name}</span>
                    </div>
                    <div className={styles.description}>{recipe.description}</div>
                    <div className={styles.site}>
                      {t('ui.recipeBook.siteLabel', {
                        site: requiredStructureLabel,
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCraft(recipe.id)}
                    disabled={!canCraft}
                  >
                    {recipe.skill === Skill.Cooking
                      ? t('ui.recipeBook.cookAction')
                      : recipe.skill === Skill.Smelting
                        ? t('ui.recipeBook.smeltAction')
                        : t('ui.recipeBook.craftAction')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.tabs} role="tablist">
        {visibleTabs.map((skill) => (
          <button
            key={skill}
            type="button"
            role="tab"
            aria-selected={activeSkill === skill}
            className={styles.tab}
            data-active={activeSkill === skill}
            onClick={() => setActiveSkill(skill)}
          >
            {formatSkillLabel(skill)}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildRecipeTooltipLines(
  recipe: RecipeBookEntry,
  inventoryCountsByItemKey: Record<string, number>,
  requiredStructureLabel: string,
  atRequiredStructure: boolean,
) {
  const requiredStructure = getRecipeRequiredStructure(recipe);
  const requiredStructureConfig = getStructureConfig(requiredStructure);
  const lines: TooltipLine[] = [
    { kind: 'text' as const, text: recipe.description },
    {
      kind: 'stat' as const,
      label: t('ui.recipeBook.tooltip.siteLabel'),
      value: requiredStructureLabel,
      icon: requiredStructureConfig.icon,
      iconTint: pixiTintToCss(requiredStructureConfig.tint),
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
