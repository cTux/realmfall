import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '@realmfall/core/game/stateTypes';
import type { WindowVisibilityState } from '../../constants';

export function useCombatHexInfoPersistence({
  combat,
  setWindowShown,
  windowShownCombat,
  windowShownHexInfo,
}: {
  combat: GameState['combat'];
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShownCombat: boolean;
  windowShownHexInfo: boolean;
}) {
  const postCombatVisibleSettledRef = useRef(false);

  useEffect(() => {
    if (combat != null) {
      postCombatVisibleSettledRef.current = false;
      if (!windowShownHexInfo || windowShownCombat) {
        return;
      }

      setWindowShown((current) =>
        current.combat
          ? current
          : {
              ...current,
              combat: true,
            },
      );
      return;
    }

    if (!windowShownCombat) {
      return;
    }

    if (windowShownHexInfo) {
      postCombatVisibleSettledRef.current = true;
      return;
    }

    if (!postCombatVisibleSettledRef.current) {
      setWindowShown((current) => ({
        ...current,
        hexInfo: true,
        combat: true,
      }));
      return;
    }

    setWindowShown((current) =>
      current.combat
        ? {
            ...current,
            combat: false,
          }
        : current,
    );
  }, [combat, setWindowShown, windowShownCombat, windowShownHexInfo]);
}
