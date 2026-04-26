import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { WindowVisibilityState } from '../../constants';

interface UseHexInfoWindowPromotionArgs {
  combatActive: boolean;
  currentLootAvailable: boolean;
  currentStructure: boolean;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShown: WindowVisibilityState;
}

export function useHexInfoWindowPromotion({
  combatActive,
  currentLootAvailable,
  currentStructure,
  setWindowShown,
  windowShown,
}: UseHexInfoWindowPromotionArgs) {
  useEffect(() => {
    setWindowShown((current) => {
      const shouldShowHexInfo =
        currentStructure ||
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
    setWindowShown,
    windowShown.combat,
    windowShown.loot,
  ]);
}
