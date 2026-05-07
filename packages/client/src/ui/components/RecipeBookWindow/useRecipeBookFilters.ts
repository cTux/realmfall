import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { recipeUsesItemKey } from '../../../game/crafting';
import { getItemConfigByKey } from '../../../game/content/items';
import {
  Skill,
  type EquipmentSlot,
  type RecipeBookEntry,
  type Tile,
} from '../../../game/stateTypes';
import { compareRecipeBookEntries } from './utils/recipeBookEntries';
import { CRAFTING_SLOT_FILTERS } from './recipeBookCraftingFilters';
import { getDefaultRecipeSkill, RECIPE_BOOK_TAB_ORDER } from './recipeBookTabs';

interface UseRecipeBookFiltersArgs {
  recipes: RecipeBookEntry[];
  currentStructure?: Tile['structure'];
  inventoryCountsByItemKey: Record<string, number>;
  preferredSkill: Skill | null;
  materialFilterItemKey: string | null;
}

export interface UseRecipeBookFiltersResult {
  enabledCraftingSlots: Set<EquipmentSlot>;
  filterItemName: string | null;
  visibleRecipes: RecipeBookEntry[];
  visibleTabs: readonly Skill[];
  activeSkill: Skill;
  setActiveSkill: Dispatch<SetStateAction<Skill>>;
  toggleCraftingSlotFilter: (slot: EquipmentSlot) => void;
  setAllCraftingSlotsEnabled: () => void;
  setNoCraftingSlotsEnabled: () => void;
}

export function useRecipeBookFilters({
  recipes,
  currentStructure,
  inventoryCountsByItemKey,
  preferredSkill,
  materialFilterItemKey,
}: UseRecipeBookFiltersArgs): UseRecipeBookFiltersResult {
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
  const [activeSkill, setActiveSkill] = useState<Skill>(() =>
    getDefaultRecipeSkill(visibleTabs, preferredSkill),
  );
  const previousPreferredSkill = useRef<Skill | null>(preferredSkill);

  useEffect(() => {
    if (visibleTabs.includes(activeSkill)) return;
    setActiveSkill(getDefaultRecipeSkill(visibleTabs, preferredSkill));
  }, [activeSkill, preferredSkill, visibleTabs]);

  useEffect(() => {
    if (previousPreferredSkill.current === preferredSkill) return;

    previousPreferredSkill.current = preferredSkill;
    if (preferredSkill === null) return;
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
      enabledCraftingSlots,
      inventoryCountsByItemKey,
      materialFilterItemKey,
      recipes,
    ],
  );

  const filterItemName = materialFilterItemKey
    ? (getItemConfigByKey(materialFilterItemKey)?.name ?? materialFilterItemKey)
    : null;

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

  const setAllCraftingSlotsEnabled = () => {
    setEnabledCraftingSlots(new Set(CRAFTING_SLOT_FILTERS));
  };

  const setNoCraftingSlotsEnabled = () => {
    setEnabledCraftingSlots(new Set());
  };

  return {
    enabledCraftingSlots,
    filterItemName,
    visibleRecipes,
    visibleTabs,
    activeSkill,
    setActiveSkill,
    toggleCraftingSlotFilter,
    setAllCraftingSlotsEnabled,
    setNoCraftingSlotsEnabled,
  };
}
