import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import { iconForItem } from '../../icons';
import { iconMaskStyle } from '../../iconMaskStyle';
import roundStarIcon from '../../../assets/icons/round-star.svg';
import type { RecipeBookWindowProps } from './types';
import { compareRecipeBookEntries } from './utils/recipeBookEntries';
import { useRecipeBookRows } from './useRecipeBookRows';
import {
  measureElementWithFallback,
  observeElementRectWithFallback,
} from '../../virtualizer';
import styles from './styles.module.scss';

const RECIPE_BOOK_TAB_ORDER = [
  Skill.Hand,
  Skill.Cooking,
  Skill.Smelting,
  Skill.Crafting,
];
const RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE = 110;
const RECIPE_BOOK_VIRTUAL_INITIAL_RECT = { height: 280, width: 0 };
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

const formatRecipeBookTabLabel = (skill: Skill) => {
  const label = formatSkillLabel(skill);
  if (label.length === 0) return label;
  return label[0].toUpperCase() + label.slice(1);
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
  const recipeListRef = useRef<HTMLDivElement | null>(null);

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
  const recipeVirtualizer = useVirtualizer({
    count: visibleRecipes.length,
    getScrollElement: () => recipeListRef.current,
    estimateSize: () => RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE,
    overscan: 4,
    getItemKey: (index) => visibleRecipes[index]!.id,
    observeElementRect: observeElementRectWithFallback(
      RECIPE_BOOK_VIRTUAL_INITIAL_RECT,
    ),
    initialRect: RECIPE_BOOK_VIRTUAL_INITIAL_RECT,
    measureElement: measureElementWithFallback(
      RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE,
    ),
    useFlushSync: false,
  });
  const virtualRecipeItems = recipeVirtualizer.getVirtualItems();
  const recipeRows = useRecipeBookRows({
    currentStructure,
    inventoryCountsByItemKey,
    recipeSkillLevels,
    recipes: virtualRecipeItems.map((virtualItem) => {
      return visibleRecipes[virtualItem.index]!;
    }),
    visibleRecipeCount: virtualRecipeItems.length,
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
  const filterItemName = materialFilterItemKey
    ? (getItemConfigByKey(materialFilterItemKey)?.name ?? materialFilterItemKey)
    : null;

  return (
    <div className={styles.layout}>
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
        {visibleTabs.map((skill) => (
          <Button
            unstyled
            key={skill}
            type="button"
            size="small"
            role="tab"
            aria-selected={activeSkill === skill}
            className={styles.tab}
            data-active={activeSkill === skill}
            onClick={() => setActiveSkill(skill)}
          >
            {formatRecipeBookTabLabel(skill)}
          </Button>
        ))}
      </div>
      <div className={styles.content}>
        {activeSkill === Skill.Crafting ? (
          <div className={styles.slotFilters}>
            <div className={styles.slotFilterControls}>
              <Button
                unstyled
                type="button"
                size="small"
                className={styles.slotFilterControlButton}
                onClick={() =>
                  setEnabledCraftingSlots(new Set(CRAFTING_SLOT_FILTERS))
                }
              >
                {t('ui.common.allAction')}
              </Button>
              <Button
                unstyled
                type="button"
                size="small"
                className={styles.slotFilterControlButton}
                onClick={() => setEnabledCraftingSlots(new Set())}
              >
                {t('ui.common.noneAction')}
              </Button>
            </div>
            {CRAFTING_SLOT_FILTERS.map((slot) => {
              const isSlotEnabled = enabledCraftingSlots.has(slot);
              const previewItem = CRAFTING_SLOT_FILTER_PREVIEW_ITEMS.get(slot);
              return (
                <Button
                  key={slot}
                  unstyled
                  type="button"
                  size="small"
                  data-filter-button="true"
                  aria-label={formatEquipmentSlotLabel(slot)}
                  aria-pressed={isSlotEnabled}
                  className={styles.filterIconButton}
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
                  style={{ opacity: isSlotEnabled ? 1 : 0.5 }}
                >
                  <span
                    className={styles.filterIcon}
                    style={iconMaskStyle(iconForItem(previewItem, slot))}
                    data-filter-icon="true"
                    aria-hidden="true"
                  />
                </Button>
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
          <div
            ref={recipeListRef}
            className={styles.list}
            data-virtualized-list="recipe-book"
          >
            <div
              className={styles.virtualListBody}
              style={{
                height: `${recipeVirtualizer.getTotalSize()}px`,
              }}
            >
              {virtualRecipeItems.map((virtualItem, index) => {
                const {
                  actionLabel,
                  canCraft,
                  craftCount,
                  recipe,
                  recipeOutput,
                  requiredStructureLabel,
                  tintOverride,
                  tooltipLines,
                } = recipeRows[index]!;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={recipeVirtualizer.measureElement}
                    className={styles.virtualRow}
                    style={virtualRowStyle(virtualItem.start)}
                  >
                    <div
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
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
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
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
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
                                : t(
                                    'ui.recipeBook.favoriteAction.favoriteLabel',
                                  ),
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
                          onMouseLeave={
                            onHoverDetail ? onLeaveDetail : undefined
                          }
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

function virtualRowStyle(start: number): CSSProperties {
  return {
    left: 0,
    position: 'absolute',
    top: 0,
    transform: `translateY(${start}px)`,
    width: '100%',
  };
}
