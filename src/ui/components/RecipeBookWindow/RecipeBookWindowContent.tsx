import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { getItemConfigByKey } from '../../../game/content/items';
import { recipeUsesItemKey } from '../../../game/crafting';
import { Skill } from '../../../game/types';
import { t } from '../../../i18n';
import { formatSkillLabel } from '../../../i18n/labels';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { RecipeBookWindowProps } from './types';
import { compareRecipeBookEntries } from './utils/recipeBookEntries';
import { useRecipeBookRows } from './useRecipeBookRows';
import styles from './styles.module.scss';

const RECIPE_BOOK_TAB_ORDER = [
  Skill.Hand,
  Skill.Cooking,
  Skill.Smelting,
  Skill.Crafting,
];
const RECIPE_BOOK_BATCH_SIZE = 40;

type RecipeBookWindowContentProps = Pick<
  RecipeBookWindowProps,
  | 'currentStructure'
  | 'recipes'
  | 'recipeSkillLevels'
  | 'inventoryCountsByItemKey'
  | 'preferredSkill'
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
  preferredSkill,
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
    preferredSkill && visibleTabs.includes(preferredSkill)
      ? preferredSkill
      : (visibleTabs[0] ?? Skill.Hand),
  );
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(
    RECIPE_BOOK_BATCH_SIZE,
  );

  useEffect(() => {
    if (!preferredSkill || !visibleTabs.includes(preferredSkill)) return;
    setActiveSkill(preferredSkill);
  }, [preferredSkill, visibleTabs]);

  useEffect(() => {
    if (visibleTabs.includes(activeSkill)) return;
    setActiveSkill(visibleTabs[0] ?? Skill.Hand);
  }, [activeSkill, visibleTabs]);

  useEffect(() => {
    setVisibleRecipeCount(RECIPE_BOOK_BATCH_SIZE);
  }, [activeSkill, materialFilterItemKey]);

  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter(
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
    [
      activeSkill,
      currentStructure,
      inventoryCountsByItemKey,
      materialFilterItemKey,
      recipes,
    ],
  );
  const recipeRows = useRecipeBookRows({
    currentStructure,
    inventoryCountsByItemKey,
    recipeSkillLevels,
    recipes: visibleRecipes,
    visibleRecipeCount,
  });
  const hiddenRecipeCount = Math.max(
    0,
    visibleRecipes.length - recipeRows.length,
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
          <>
            <div className={styles.list}>
              {recipeRows.map(
                ({
                  actionLabel,
                  canCraft,
                  recipe,
                  recipeOutput,
                  requiredStructureLabel,
                  tintOverride,
                  tooltipLines,
                }) => (
                  <div
                    key={recipe.id}
                    className={[
                      styles.entry,
                      recipe.learned ? '' : styles.entryDisabled,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {recipe.learned ? (
                      <ItemSlotButton
                        item={recipeOutput}
                        size="compact"
                        disabled={!recipe.learned}
                        tintOverride={tintOverride}
                        onClick={
                          canCraft ? () => onCraft(recipe.id) : undefined
                        }
                        onMouseEnter={(event) =>
                          onHoverDetail?.(
                            event,
                            recipe.name,
                            tooltipLines ?? [],
                            tintOverride,
                          )
                        }
                        onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                      />
                    ) : (
                      <span
                        onMouseEnter={(event) =>
                          onHoverDetail?.(
                            event,
                            recipe.name,
                            tooltipLines ?? [],
                            tintOverride,
                          )
                        }
                        onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                      >
                        <ItemSlotButton
                          item={recipeOutput}
                          size="compact"
                          disabled={!recipe.learned}
                          tintOverride={tintOverride}
                        />
                      </span>
                    )}
                    <div className={styles.meta}>
                      <div className={styles.titleRow}>
                        <span className={styles.title}>{recipe.name}</span>
                      </div>
                      <div className={styles.description}>
                        {recipe.description}
                      </div>
                      <div className={styles.site}>
                        {t('ui.recipeBook.siteLabel', {
                          site: requiredStructureLabel,
                        })}
                      </div>
                    </div>
                    {recipe.learned ? (
                      canCraft ? (
                        <button
                          type="button"
                          onClick={(event) =>
                            onCraft(recipe.id, getRecipeCraftCount(event))
                          }
                          onMouseEnter={(event) =>
                            onHoverDetail?.(
                              event,
                              t('ui.recipeBook.tooltip.batchCraftTitle'),
                              [
                                {
                                  kind: 'text',
                                  text: t(
                                    'ui.recipeBook.tooltip.batchCraftShift',
                                  ),
                                },
                                {
                                  kind: 'text',
                                  text: t(
                                    'ui.recipeBook.tooltip.batchCraftCtrl',
                                  ),
                                },
                              ],
                            )
                          }
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
                        >
                          {actionLabel}
                        </button>
                      ) : (
                        <span
                          onMouseEnter={(event) =>
                            onHoverDetail?.(
                              event,
                              recipe.name,
                              tooltipLines ?? [],
                            )
                          }
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
                        >
                          <button type="button" disabled={!canCraft}>
                            {actionLabel}
                          </button>
                        </span>
                      )
                    ) : (
                      <span
                        onMouseEnter={(event) =>
                          onHoverDetail?.(
                            event,
                            recipe.name,
                            tooltipLines ?? [],
                            tintOverride,
                          )
                        }
                        onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                      >
                        <button type="button" disabled={!recipe.learned}>
                          {actionLabel}
                        </button>
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
            {hiddenRecipeCount > 0 ? (
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() =>
                  startTransition(() => {
                    setVisibleRecipeCount((current) =>
                      Math.min(
                        current + RECIPE_BOOK_BATCH_SIZE,
                        visibleRecipes.length,
                      ),
                    );
                  })
                }
              >
                {t('ui.recipeBook.showMoreAction', {
                  count: Math.min(RECIPE_BOOK_BATCH_SIZE, hiddenRecipeCount),
                })}
              </button>
            ) : null}
          </>
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

export function getRecipeCraftCount(event: ReactMouseEvent<HTMLButtonElement>) {
  if (event.ctrlKey || event.metaKey) return 'max';
  if (event.shiftKey) return 5;
  return 1;
}
