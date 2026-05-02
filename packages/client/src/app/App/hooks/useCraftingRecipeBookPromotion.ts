import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { getRecipeSkillForStructure } from '../../../game/crafting';
import { hexKey } from '../../../game/hex';
import type { GameState, Skill, Tile } from '../../../game/stateTypes';
import type { WindowVisibilityState } from '../../constants';

interface UseCraftingRecipeBookPromotionArgs {
  currentStructure: Tile['structure'];
  playerCoord: GameState['player']['coord'];
  setPreferredRecipeSkill: Dispatch<SetStateAction<Skill | null>>;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  suppressAutoOpen: boolean;
}

export function useCraftingRecipeBookPromotion({
  currentStructure,
  playerCoord,
  setPreferredRecipeSkill,
  setWindowShown,
  suppressAutoOpen,
}: UseCraftingRecipeBookPromotionArgs) {
  const currentHexKey = hexKey(playerCoord);
  const previousHexKeyRef = useRef(currentHexKey);
  const previousSuppressedRef = useRef(suppressAutoOpen);

  useEffect(() => {
    const previousHexKey = previousHexKeyRef.current;
    const previousSuppressed = previousSuppressedRef.current;
    previousHexKeyRef.current = currentHexKey;
    previousSuppressedRef.current = suppressAutoOpen;

    if (
      suppressAutoOpen ||
      (previousHexKey === currentHexKey && !previousSuppressed)
    ) {
      return;
    }

    const preferredSkill = getRecipeSkillForStructure(currentStructure);
    if (!preferredSkill) {
      return;
    }

    setPreferredRecipeSkill(preferredSkill);
    setWindowShown((current) =>
      current.recipes ? current : { ...current, recipes: true },
    );
  }, [
    currentHexKey,
    currentStructure,
    setPreferredRecipeSkill,
    setWindowShown,
    suppressAutoOpen,
  ]);
}
