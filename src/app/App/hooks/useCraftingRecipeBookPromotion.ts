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
}

export function useCraftingRecipeBookPromotion({
  currentStructure,
  playerCoord,
  setPreferredRecipeSkill,
  setWindowShown,
}: UseCraftingRecipeBookPromotionArgs) {
  const currentHexKey = hexKey(playerCoord);
  const previousHexKeyRef = useRef(currentHexKey);

  useEffect(() => {
    const previousHexKey = previousHexKeyRef.current;
    previousHexKeyRef.current = currentHexKey;

    if (previousHexKey === currentHexKey) return;

    const preferredSkill = getRecipeSkillForStructure(currentStructure);
    if (!preferredSkill) return;

    setPreferredRecipeSkill(preferredSkill);
    setWindowShown((current) =>
      current.recipes ? current : { ...current, recipes: true },
    );
  }, [
    currentHexKey,
    currentStructure,
    setPreferredRecipeSkill,
    setWindowShown,
  ]);
}
