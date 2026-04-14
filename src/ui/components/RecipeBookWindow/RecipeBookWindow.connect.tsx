import { useCallback } from 'react';
import { describeStructure } from '../../../game/state';
import { uiActions } from '../../../app/store/uiSlice';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectCurrentTile,
  selectInventoryCounts,
  selectRecipeBookKnown,
  selectRecipes,
  selectGameWorldTimeMs,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { RecipeBookWindow } from './RecipeBookWindow';
import type { RecipeBookWindowProps } from './types';

export type RecipeBookWindowConnectedProps = Pick<
  RecipeBookWindowProps,
  'onHoverDetail' | 'onLeaveDetail'
>;

export function RecipeBookWindowConnected(
  props: RecipeBookWindowConnectedProps,
) {
  const dispatch = useAppDispatch();
  const currentTile = useAppSelector(selectCurrentTile);
  const hasRecipeBook = useAppSelector(selectRecipeBookKnown);
  const inventoryCounts = useAppSelector(selectInventoryCounts);
  const recipes = useAppSelector(selectRecipes);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleMove = useCallback(
    (position: RecipeBookWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'recipes', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'recipes', shown: false }));
  }, [dispatch]);

  const handleCraft = useCallback(
    (recipeId: string) => {
      dispatch(gameActions.craftRecipeAtTime({ recipeId, worldTimeMs }));
    },
    [dispatch, worldTimeMs],
  );

  return (
    <RecipeBookWindow
      position={windows.recipes}
      onMove={handleMove}
      visible={windowShown.recipes}
      onClose={handleClose}
      hasRecipeBook={hasRecipeBook}
      currentStructure={describeStructure(currentTile.structure)}
      recipes={recipes}
      inventoryCounts={inventoryCounts}
      onCraft={handleCraft}
      onHoverDetail={props.onHoverDetail}
      onLeaveDetail={props.onLeaveDetail}
    />
  );
}
