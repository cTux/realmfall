import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { getRecipeSkillForStructure } from '../../../game/crafting';
import { isEnemyInitiatedCombat } from '../../../game/stateCombatEngagement';
import type { GameState, Tile } from '../../../game/stateTypes';
import type { WindowVisibilityState } from '../../constants';

interface UseHexInfoWindowPromotionArgs {
  combat: GameState['combat'];
  currentLootAvailable: boolean;
  currentStructure?: Tile['structure'];
  suppressAutoOpen: boolean;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShown: WindowVisibilityState;
}

export function useHexInfoWindowPromotion({
  combat,
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
      const shouldAutoOpenCombatInfo =
        combat != null && !isEnemyInitiatedCombat(combat);
      const shouldShowHexInfo =
        shouldAutoOpenStructureInfo ||
        currentLootAvailable ||
        shouldAutoOpenCombatInfo ||
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
    combat,
    currentLootAvailable,
    currentStructure,
    suppressAutoOpen,
    setWindowShown,
    windowShown.combat,
    windowShown.loot,
  ]);
}
