import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { WindowVisibilityState } from '../../constants';

interface UseHexInfoWindowPromotionArgs {
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  windowShown: WindowVisibilityState;
}

export function useHexInfoWindowPromotion({
  setWindowShown,
  windowShown,
}: UseHexInfoWindowPromotionArgs) {
  useEffect(() => {
    if (!windowShown.loot && !windowShown.combat) {
      return;
    }

    setWindowShown((current) => {
      if (!current.loot && !current.combat) {
        return current;
      }

      return {
        ...current,
        hexInfo: current.hexInfo || current.loot || current.combat,
        loot: false,
        combat: false,
      };
    });
  }, [setWindowShown, windowShown.combat, windowShown.loot]);
}
