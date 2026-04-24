import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Skill } from '../../../game/stateTypes';
import type { WindowVisibilityState } from '../../constants';

type SetWindowShown = Dispatch<SetStateAction<WindowVisibilityState>>;

export function useRecipeMaterialFilter(setWindowShown: SetWindowShown) {
  const [recipeMaterialFilterItemKey, setRecipeMaterialFilterItemKey] =
    useState<string | null>(null);
  const [preferredRecipeSkill, setPreferredRecipeSkill] =
    useState<Skill | null>(null);

  const handleOpenRecipeBookWithMaterialFilter = useCallback(
    (itemKey: string) => {
      setRecipeMaterialFilterItemKey(itemKey);
      setPreferredRecipeSkill(null);
      setWindowShown((current) => ({ ...current, recipes: true }));
    },
    [setWindowShown],
  );

  const handleClearRecipeMaterialFilter = useCallback(() => {
    setRecipeMaterialFilterItemKey(null);
  }, []);

  return {
    handleClearRecipeMaterialFilter,
    handleOpenRecipeBookWithMaterialFilter,
    preferredRecipeSkill,
    recipeMaterialFilterItemKey,
    setPreferredRecipeSkill,
  };
}
