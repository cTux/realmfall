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
  playerCoord: GameState['player']['coord'];
  currentStructure?: Tile['structure'];
  suppressAutoOpen: boolean;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShown: WindowVisibilityState;
}

export function useHexInfoWindowPromotion({
  combat,
  currentLootAvailable,
  playerCoord,
  currentStructure,
  suppressAutoOpen,
  setWindowShown,
  windowShown,
}: UseHexInfoWindowPromotionArgs) {
  const previousCombatRef = useRef(combat);
  const previousHexInfoShownRef = useRef(windowShown.hexInfo);
  const manualHexInfoOverrideRef = useRef<{
    contextKey: string;
    visible: boolean;
  } | null>(null);
  const syncedHexInfoVisibilityRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const hadCombat = previousCombatRef.current != null;
    const contextKey = createHexInfoContextKey({
      combat,
      currentLootAvailable,
      currentStructure,
      playerCoord,
    });
    const previousHexInfoShown = previousHexInfoShownRef.current;
    const visibilityChanged = previousHexInfoShown !== windowShown.hexInfo;

    if (manualHexInfoOverrideRef.current?.contextKey !== contextKey) {
      manualHexInfoOverrideRef.current = null;
    }

    if (visibilityChanged) {
      if (syncedHexInfoVisibilityRef.current === windowShown.hexInfo) {
        syncedHexInfoVisibilityRef.current = null;
      } else {
        manualHexInfoOverrideRef.current = {
          contextKey,
          visible: windowShown.hexInfo,
        };
      }
    }

    if (suppressAutoOpen) {
      previousCombatRef.current = combat;
      previousHexInfoShownRef.current = windowShown.hexInfo;
      return;
    }

    setWindowShown((current) => {
      const currentContextKey = createHexInfoContextKey({
        combat,
        currentLootAvailable,
        currentStructure,
        playerCoord,
      });
      const manualOverrideVisible =
        manualHexInfoOverrideRef.current?.contextKey === currentContextKey
          ? manualHexInfoOverrideRef.current.visible
          : null;
      const shouldPreserveOpenAfterCombat =
        combat == null && hadCombat && current.combat;
      const shouldShowHexInfo =
        manualOverrideVisible ??
        (shouldPreserveOpenAfterCombat ||
          hasAutoHexInfoReason({
            combat,
            currentLootAvailable,
            currentStructure,
            windowShownCombat: current.combat,
            windowShownLoot: current.loot,
          }));

      if (current.hexInfo === shouldShowHexInfo && !current.loot) {
        return current;
      }

      syncedHexInfoVisibilityRef.current = shouldShowHexInfo;
      return {
        ...current,
        hexInfo: shouldShowHexInfo,
        loot: false,
        combat: current.combat,
      };
    });

    previousCombatRef.current = combat;
    previousHexInfoShownRef.current = windowShown.hexInfo;
  }, [
    combat,
    currentLootAvailable,
    currentStructure,
    playerCoord,
    suppressAutoOpen,
    setWindowShown,
    windowShown.combat,
    windowShown.hexInfo,
    windowShown.loot,
  ]);
}

function createHexInfoContextKey({
  combat,
  currentLootAvailable,
  currentStructure,
  playerCoord,
}: {
  combat: GameState['combat'];
  currentLootAvailable: boolean;
  currentStructure?: Tile['structure'];
  playerCoord: GameState['player']['coord'];
}) {
  return [
    playerCoord.q,
    playerCoord.r,
    currentStructure ?? 'none',
    currentLootAvailable ? 'loot' : 'no-loot',
    combat ? 'combat' : 'no-combat',
  ].join('|');
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
