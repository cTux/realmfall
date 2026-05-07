import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@realmfall/ui';
import { Skill, type EquipmentSlot } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import { formatEquipmentSlotLabel } from '../../../i18n/labels';
import { iconForItem } from '../../icons';
import { iconMaskStyle } from '../../iconMaskStyle';
import { useRecipeBookRows } from './useRecipeBookRows';
import {
  measureElementWithFallback,
  observeElementRectWithFallback,
} from '../../virtualizer';
import {
  CRAFTING_SLOT_FILTER_PREVIEW_ITEMS,
  CRAFTING_SLOT_FILTERS,
} from './recipeBookCraftingFilters';
import { RecipeBookVirtualRow } from './RecipeBookVirtualRow';
import { useRecipeBookFilters } from './useRecipeBookFilters';
import { formatRecipeBookTabLabel } from './recipeBookTabs';
import {
  RECIPE_BOOK_VIRTUAL_INITIAL_RECT,
  RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE,
} from './recipeBookTabs';
import type { RecipeBookWindowProps } from './types';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';
import styles from './styles.module.scss';

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
  const {
    activeSkill,
    enabledCraftingSlots,
    filterItemName,
    visibleRecipes,
    visibleTabs,
    setActiveSkill,
    setAllCraftingSlotsEnabled,
    setNoCraftingSlotsEnabled,
    toggleCraftingSlotFilter,
  } = useRecipeBookFilters({
    currentStructure,
    inventoryCountsByItemKey,
    recipes,
    preferredSkill,
    materialFilterItemKey,
  });

  const recipeListRef = useRef<HTMLDivElement | null>(null);
  const recipeVirtualizer = useVirtualizer({
    count: visibleRecipes.length,
    getScrollElement: () => recipeListRef.current,
    estimateSize: () => RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE,
    overscan: 4,
    getItemKey: (index) => visibleRecipes[index]?.id ?? String(index),
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
          <CraftingSlotFilters
            enabledCraftingSlots={enabledCraftingSlots}
            onSetAllCraftingSlotsEnabled={setAllCraftingSlotsEnabled}
            onSetNoCraftingSlotsEnabled={setNoCraftingSlotsEnabled}
            onToggleSlotFilter={toggleCraftingSlotFilter}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
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
                const recipeRow = recipeRows[index];
                if (!recipeRow) return null;

                return (
                  <RecipeBookVirtualRow
                    key={virtualItem.key}
                    recipeRow={recipeRow}
                    index={virtualItem.index}
                    top={virtualItem.start}
                    measureRef={recipeVirtualizer.measureElement}
                    onCraft={onCraft}
                    onToggleFavoriteRecipe={onToggleFavoriteRecipe}
                    onHoverDetail={onHoverDetail}
                    onLeaveDetail={onLeaveDetail}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CraftingSlotFiltersProps {
  enabledCraftingSlots: Set<EquipmentSlot>;
  onSetAllCraftingSlotsEnabled: () => void;
  onSetNoCraftingSlotsEnabled: () => void;
  onToggleSlotFilter: (slot: EquipmentSlot) => void;
  onHoverDetail?: WindowDetailTooltipHandlers['onHoverDetail'];
  onLeaveDetail?: () => void;
}

function CraftingSlotFilters({
  enabledCraftingSlots,
  onSetAllCraftingSlotsEnabled,
  onSetNoCraftingSlotsEnabled,
  onToggleSlotFilter,
  onHoverDetail,
  onLeaveDetail,
}: CraftingSlotFiltersProps) {
  return (
    <div className={styles.slotFilters}>
      <div className={styles.slotFilterControls}>
        <Button
          unstyled
          type="button"
          size="small"
          className={styles.slotFilterControlButton}
          onClick={onSetAllCraftingSlotsEnabled}
        >
          {t('ui.common.allAction')}
        </Button>
        <Button
          unstyled
          type="button"
          size="small"
          className={styles.slotFilterControlButton}
          onClick={onSetNoCraftingSlotsEnabled}
        >
          {t('ui.common.noneAction')}
        </Button>
      </div>
      {CRAFTING_SLOT_FILTERS.map((slot) => {
        const isSlotEnabled = enabledCraftingSlots.has(slot);
        const previewItem = CRAFTING_SLOT_FILTER_PREVIEW_ITEMS.get(slot);
        const formattedSlot = formatEquipmentSlotLabel(slot);
        return (
          <Button
            key={slot}
            unstyled
            type="button"
            size="small"
            data-filter-button="true"
            aria-label={formattedSlot}
            aria-pressed={isSlotEnabled}
            className={styles.filterIconButton}
            onClick={() => onToggleSlotFilter(slot)}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                formattedSlot,
                [
                  {
                    kind: 'text',
                    text: t('ui.tooltip.emptyEquipmentSlot', {
                      slot: formattedSlot.toLowerCase(),
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
  );
}

export { getRecipeCraftCount } from './recipeBookAction';
