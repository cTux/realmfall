import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Button, ItemSlot as ItemSlotButton } from '@realmfall/ui';
import {
  buildItemFromConfig,
  getItemConfigByKey,
  ITEM_CONFIGS,
} from '../../../game/content/items';
import { recipeUsesItemKey } from '../../../game/crafting';
import {
  EQUIPMENT_SLOTS,
  Skill,
  type EquipmentSlot,
} from '../../../game/types';
import { t } from '../../../i18n';
import {
  formatEquipmentSlotLabel,
  formatSkillLabel,
} from '../../../i18n/labels';
import roundStarIcon from '../../../assets/icons/round-star.svg';
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
const CRAFTING_SLOT_FILTERS = EQUIPMENT_SLOTS;
const CRAFTING_SLOT_FILTER_ICON_CHOICES: Partial<
  Record<EquipmentSlot, readonly string[]>
> = {
  bracers: ['icon-bracers-01', 'icon-bracers-02'],
  belt: ['icon-belt-01', 'icon-belt-02', 'icon-belt-03'],
  cloak: ['icon-cloak-01', 'icon-cloak-02', 'icon-cloak-03'],
};

const CRAFTING_SLOT_FILTER_PREVIEW_ITEMS = (() => {
  const map = new Map<EquipmentSlot, ReturnType<typeof buildItemFromConfig>>();
  for (const slot of CRAFTING_SLOT_FILTERS) {
    const preferred = CRAFTING_SLOT_FILTER_ICON_CHOICES[slot]
      ?.map((itemKey) => getItemConfigByKey(itemKey))
      .filter(
        (
          config,
        ): config is Exclude<
          ReturnType<typeof getItemConfigByKey>,
          undefined
        > => config !== undefined,
      );
    const slotItemConfigs =
      preferred && preferred.length > 0
        ? preferred
        : ITEM_CONFIGS.filter((config) => config.slot === slot);

    if (slotItemConfigs.length === 0) continue;
    const seed = [...slot].reduce(
      (total, char) => (total * 31 + char.charCodeAt(0)) % 997,
      17,
    );
    const chosenConfig =
      slotItemConfigs[Math.abs(seed) % slotItemConfigs.length];
    map.set(slot, buildItemFromConfig(chosenConfig.key));
  }
  return map;
})();

const getDefaultRecipeSkill = (
  tabs: readonly Skill[],
  preferredSkill: Skill | null,
) => {
  if (preferredSkill && tabs.includes(preferredSkill)) {
    return preferredSkill;
  }

  return tabs.includes(Skill.Hand) ? Skill.Hand : (tabs[0] ?? Skill.Hand);
};

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
  | 'onToggleFavoriteRecipe'
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
  onToggleFavoriteRecipe,
  onHoverDetail,
  onLeaveDetail,
}: RecipeBookWindowContentProps) {
  const [enabledCraftingSlots, setEnabledCraftingSlots] = useState(
    () => new Set(CRAFTING_SLOT_FILTERS),
  );
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
    getDefaultRecipeSkill(visibleTabs, preferredSkill),
  );
  const previousPreferredSkill = useRef<Skill | null>(preferredSkill);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(
    RECIPE_BOOK_BATCH_SIZE,
  );

  useEffect(() => {
    if (visibleTabs.includes(activeSkill)) return;
    setActiveSkill(getDefaultRecipeSkill(visibleTabs, preferredSkill));
  }, [activeSkill, visibleTabs, preferredSkill]);

  useEffect(() => {
    if (previousPreferredSkill.current === preferredSkill) return;

    previousPreferredSkill.current = preferredSkill;
    if (!preferredSkill) return;
    if (!visibleTabs.includes(preferredSkill)) return;

    setActiveSkill(preferredSkill);
  }, [activeSkill, preferredSkill, visibleTabs]);

  useEffect(() => {
    setVisibleRecipeCount(RECIPE_BOOK_BATCH_SIZE);
  }, [activeSkill, materialFilterItemKey, enabledCraftingSlots]);

  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter(
          (recipe) =>
            recipe.skill === activeSkill &&
            (!recipe.output.slot ||
              activeSkill !== Skill.Crafting ||
              enabledCraftingSlots.has(recipe.output.slot)) &&
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
      enabledCraftingSlots,
    ],
  );
  const recipeRows = useRecipeBookRows({
    currentStructure,
    inventoryCountsByItemKey,
    recipeSkillLevels,
    recipes: visibleRecipes,
    visibleRecipeCount,
  });
  const toggleCraftingSlotFilter = (slot: EquipmentSlot) => {
    setEnabledCraftingSlots((current) => {
      const next = new Set(current);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  };
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
        {activeSkill === Skill.Crafting ? (
          <div className={styles.slotFilters}>
            <div className={styles.slotFilterControls}>
              <Button
                unstyled
                type="button"
                className={styles.slotFilterControlButton}
                onClick={() =>
                  setEnabledCraftingSlots(new Set(CRAFTING_SLOT_FILTERS))
                }
              >
                Enable all
              </Button>
              <Button
                unstyled
                type="button"
                className={styles.slotFilterControlButton}
                onClick={() => setEnabledCraftingSlots(new Set())}
              >
                Disable all
              </Button>
            </div>
            {CRAFTING_SLOT_FILTERS.map((slot) => {
              const isSlotEnabled = enabledCraftingSlots.has(slot);
              return (
                <ItemSlotButton
                  key={slot}
                  item={CRAFTING_SLOT_FILTER_PREVIEW_ITEMS.get(slot)}
                  slot={slot}
                  size="compact"
                  ariaLabel={formatEquipmentSlotLabel(slot)}
                  className={styles.slotFilterButton}
                  tintOverride="#ffffff"
                  onClick={() => toggleCraftingSlotFilter(slot)}
                  onMouseEnter={(event) =>
                    onHoverDetail?.(
                      event,
                      formatEquipmentSlotLabel(slot),
                      [
                        {
                          kind: 'text',
                          text: t('ui.tooltip.emptyEquipmentSlot', {
                            slot: formatEquipmentSlotLabel(slot).toLowerCase(),
                          }),
                        },
                      ],
                      'rgba(148, 163, 184, 0.9)',
                    )
                  }
                  onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                  borderColorOverride={
                    isSlotEnabled
                      ? 'rgba(96, 165, 250, 0.58)'
                      : 'rgba(148, 163, 184, 0.14)'
                  }
                  overlayColorOverride={
                    isSlotEnabled ? undefined : 'rgba(2, 6, 23, 0.45)'
                  }
                  style={{ opacity: isSlotEnabled ? 1 : 0.5 }}
                />
              );
            })}
          </div>
        ) : null}
        {filterItemName ? (
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>
              {t('ui.recipeBook.filterLabel', { item: filterItemName })}
            </span>
            <Button
              type="button"
              className={styles.filterReset}
              onClick={onResetMaterialFilter}
            >
              {t('ui.recipeBook.resetFilterAction')}
            </Button>
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
                  craftCount,
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
                          borderColorOverride={tintOverride}
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
                    <div className={styles.actions}>
                      {recipe.learned ? (
                        canCraft ? (
                          <span className={styles.actionButtonRow}>
                            <span
                              className={styles.craftCount}
                            >{`x${craftCount}`}</span>
                            <Button
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
                            </Button>
                          </span>
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
                            <Button type="button" disabled={!canCraft}>
                              {actionLabel}
                            </Button>
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
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
                        >
                          <Button type="button" disabled={!recipe.learned}>
                            {actionLabel}
                          </Button>
                        </span>
                      )}
                      <Button
                        unstyled
                        type="button"
                        className={styles.favoriteButton}
                        onClick={() => onToggleFavoriteRecipe(recipe.id)}
                        onMouseEnter={(event) =>
                          onHoverDetail?.(
                            event,
                            recipe.favorite
                              ? t(
                                  'ui.recipeBook.favoriteAction.unfavoriteLabel',
                                )
                              : t('ui.recipeBook.favoriteAction.favoriteLabel'),
                            [
                              {
                                kind: 'text',
                                text: recipe.favorite
                                  ? t(
                                      'ui.recipeBook.favoriteAction.unfavoriteHint',
                                    )
                                  : t(
                                      'ui.recipeBook.favoriteAction.favoriteHint',
                                    ),
                              },
                            ],
                          )
                        }
                        onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                        aria-label={`${recipe.favorite ? t('ui.recipeBook.favoriteAction.unfavoriteLabel') : t('ui.recipeBook.favoriteAction.favoriteLabel')}: ${recipe.name}`}
                        aria-pressed={recipe.favorite}
                        disabled={!recipe.learned}
                      >
                        <span
                          aria-hidden="true"
                          className={styles.favoriteIcon}
                          style={starIconMask(
                            roundStarIcon,
                            recipe.favorite ? '#f59e0b' : '#94a3b8',
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                ),
              )}
            </div>
            {hiddenRecipeCount > 0 ? (
              <Button
                unstyled
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
              </Button>
            ) : null}
          </>
        )}
      </div>
      <div className={styles.tabs} role="tablist">
        {visibleTabs.map((skill) => (
          <Button
            unstyled
            key={skill}
            type="button"
            role="tab"
            aria-selected={activeSkill === skill}
            className={styles.tab}
            data-active={activeSkill === skill}
            onClick={() => setActiveSkill(skill)}
          >
            {formatSkillLabel(skill)}
          </Button>
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

function starIconMask(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
