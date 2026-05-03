import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { getRecipeSkillForStructure } from '../../../game/crafting';
import type { Tile } from '../../../game/stateTypes';
import type { WindowVisibilityState } from '../../constants';

interface UseHexInfoWindowPromotionArgs {
  combatActive: boolean;
  currentLootAvailable: boolean;
  currentStructure?: Tile['structure'];
  suppressAutoOpen: boolean;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShown: WindowVisibilityState;
}

export function useHexInfoWindowPromotion({
  combatActive,
  currentLootAvailable,
  currentStructure,
  suppressAutoOpen,
  setWindowShown,
  windowShown,
}: UseHexInfoWindowPromotionArgs) {
  useEffect(() => {
    if (suppressAutoOpen) {
      return;
    }

    setWindowShown((current) => {
      const shouldAutoOpenStructureInfo =
        currentStructure != null &&
        getRecipeSkillForStructure(currentStructure) == null;
      const shouldShowHexInfo =
        shouldAutoOpenStructureInfo ||
        currentLootAvailable ||
        combatActive ||
        current.loot ||
        current.combat;

      if (
        current.hexInfo === shouldShowHexInfo &&
        !current.loot &&
        !current.combat
      ) {
        return current;
      }

      return {
        ...current,
        hexInfo: shouldShowHexInfo,
        loot: false,
        combat: false,
      };
    });
  }, [
    combatActive,
    currentLootAvailable,
    currentStructure,
    suppressAutoOpen,
    setWindowShown,
    windowShown.combat,
    windowShown.loot,
  ]);
}
