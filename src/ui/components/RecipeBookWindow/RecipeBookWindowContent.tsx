import { useEffect, useMemo, useState } from 'react';
import { getItemConfigByKey } from '../../../game/content/items';
import { getStructureConfig } from '../../../game/content/structures';
import {
  getRecipeRequiredStructure,
  recipeUsesItemKey,
} from '../../../game/crafting';
import { Skill, type RecipeBookEntry } from '../../../game/types';
import { t } from '../../../i18n';
import { formatSkillLabel } from '../../../i18n/labels';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { TooltipLine } from '../../tooltips';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

const RECIPE_BOOK_TAB_ORDER = [Skill.Crafting, Skill.Smelting, Skill.Cooking];

type RecipeBookWindowContentProps = Pick<
  RecipeBookWindowProps,
  | 'currentStructure'
  | 'recipes'
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
    visibleTabs[0] ?? Skill.Crafting,
  );

  useEffect(() => {
    if (visibleTabs.includes(activeSkill)) return;
    setActiveSkill(visibleTabs[0] ?? Skill.Crafting);
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
        .sort((left, right) => {
          if (left.learned !== right.learned) {
            return Number(right.learned) - Number(left.learned);
          }
          return left.name.localeCompare(right.name);
        }),
    [activeSkill, materialFilterItemKey, recipes],
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
              const requiredStructure = getRecipeRequiredStructure(recipe);
              const requiredStructureLabel =
                getStructureConfig(requiredStructure).title;
              const missingIngredient = recipe.ingredients.some(
                (ingredient) =>
                  (inventoryCountsByItemKey[ingredient.itemKey ?? ingredient.name] ??
                    0) < ingredient.quantity,
              );
              const hasFuel =
                !recipe.fuelOptions ||
                recipe.fuelOptions.some(
                  (fuel) =>
                    (inventoryCountsByItemKey[fuel.itemKey ?? fuel.name] ?? 0) >=
                    fuel.quantity,
                );
              const atRequiredStructure = currentStructure === requiredStructure;
              const canCraft =
                recipe.learned && !missingIngredient && hasFuel && atRequiredStructure;
              const tintOverride = !recipe.learned
                ? 'rgba(148, 163, 184, 0.45)'
                : canCraft
                  ? undefined
                  : 'rgba(248, 113, 113, 0.92)';
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
                    item={recipe.output}
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
  const requiredStructureIcon = getStructureConfig(requiredStructure).icon;
  const lines: TooltipLine[] = [
    { kind: 'text' as const, text: recipe.description },
    {
      kind: 'stat' as const,
      label: t('ui.recipeBook.tooltip.siteLabel'),
      value: requiredStructureLabel,
      icon: requiredStructureIcon,
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
      return {
        kind: 'stat' as const,
        label: ingredient.name,
        value: `${owned}/${ingredient.quantity}`,
        icon: ingredient.itemKey
          ? getItemConfigByKey(ingredient.itemKey)?.icon
          : undefined,
        tone: owned >= ingredient.quantity ? ('item' as const) : ('negative' as const),
      };
    }),
    ...(recipe.fuelOptions
      ? recipe.fuelOptions.map((fuel) => {
          const owned = inventoryCountsByItemKey[fuel.itemKey ?? fuel.name] ?? 0;
          return {
            kind: 'stat' as const,
            label: `${t('ui.recipeBook.tooltip.fuelLabel')} ${fuel.name}`,
            value: `${owned}/${fuel.quantity}`,
            icon: fuel.itemKey ? getItemConfigByKey(fuel.itemKey)?.icon : undefined,
            tone:
              owned >= fuel.quantity
                ? ('item' as const)
                : ('negative' as const),
          };
        })
      : []),
  ];

  return lines;
}
