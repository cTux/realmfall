import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { WindowVisibilityState } from '../../constants';

type SetWindowShown = Dispatch<SetStateAction<WindowVisibilityState>>;

export function useRecipeMaterialFilter(
  setWindowShown: SetWindowShown,
) {
  const [recipeMaterialFilterItemKey, setRecipeMaterialFilterItemKey] =
    useState<string | null>(null);

  const handleOpenRecipeBookWithMaterialFilter = useCallback(
    (itemKey: string) => {
      setRecipeMaterialFilterItemKey(itemKey);
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
    recipeMaterialFilterItemKey,
  };
}
