import {
  useLayoutEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
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
  const previousCombatRef = useRef(combat);
  const previousHexInfoShownRef = useRef(windowShown.hexInfo);
  const previousAutoOpenReasonRef = useRef(
    hasAutoHexInfoReason({
      combat,
      currentLootAvailable,
      currentStructure,
      windowShownCombat: windowShown.combat,
      windowShownLoot: windowShown.loot,
    }),
  );
  const manualHexInfoPinnedRef = useRef(
    windowShown.hexInfo && !previousAutoOpenReasonRef.current,
  );

  useLayoutEffect(() => {
    const hadCombat = previousCombatRef.current != null;
    const previousHexInfoShown = previousHexInfoShownRef.current;
    const previousAutoOpenReason = previousAutoOpenReasonRef.current;
    const autoOpenReason = hasAutoHexInfoReason({
      combat,
      currentLootAvailable,
      currentStructure,
      windowShownCombat: windowShown.combat,
      windowShownLoot: windowShown.loot,
    });

    if (windowShown.hexInfo) {
      if (
        !autoOpenReason &&
        (!previousAutoOpenReason ||
          previousHexInfoShown !== windowShown.hexInfo)
      ) {
        manualHexInfoPinnedRef.current = true;
      }
    } else if (previousHexInfoShown !== windowShown.hexInfo) {
      manualHexInfoPinnedRef.current = false;
    }

    if (suppressAutoOpen) {
      previousCombatRef.current = combat;
      previousHexInfoShownRef.current = windowShown.hexInfo;
      previousAutoOpenReasonRef.current = autoOpenReason;
      return;
    }

    setWindowShown((current) => {
      const shouldPreserveOpenAfterCombat =
        combat == null && hadCombat && current.combat;
      const shouldShowHexInfo =
        manualHexInfoPinnedRef.current ||
        shouldPreserveOpenAfterCombat ||
        hasAutoHexInfoReason({
          combat,
          currentLootAvailable,
          currentStructure,
          windowShownCombat: current.combat,
          windowShownLoot: current.loot,
        });

      if (current.hexInfo === shouldShowHexInfo && !current.loot) {
        return current;
      }

      return {
        ...current,
        hexInfo: shouldShowHexInfo,
        loot: false,
        combat: current.combat,
      };
    });

    previousCombatRef.current = combat;
    previousHexInfoShownRef.current = windowShown.hexInfo;
    previousAutoOpenReasonRef.current = autoOpenReason;
  }, [
    combat,
    currentLootAvailable,
    currentStructure,
    suppressAutoOpen,
    setWindowShown,
    windowShown.combat,
    windowShown.hexInfo,
    windowShown.loot,
  ]);
}

function hasAutoHexInfoReason({
  combat,
  currentLootAvailable,
  currentStructure,
  windowShownCombat,
  windowShownLoot,
}: {
  combat: GameState['combat'];
  currentLootAvailable: boolean;
  currentStructure?: Tile['structure'];
  windowShownCombat: boolean;
  windowShownLoot: boolean;
}) {
  const shouldAutoOpenStructureInfo =
    currentStructure != null &&
    getRecipeSkillForStructure(currentStructure) == null;
  const shouldAutoOpenCombatInfo =
    combat != null && !isEnemyInitiatedCombat(combat);

  return (
    shouldAutoOpenStructureInfo ||
    currentLootAvailable ||
    shouldAutoOpenCombatInfo ||
    windowShownLoot ||
    windowShownCombat
  );
}
