import {
  useCallback,
  useMemo,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { GameState } from '@realmfall/core/game/stateTypes';
import {
  buildDebugCommandHandlers,
  buildEquipmentSlotCommandHandlers,
  buildInventoryItemCommandHandlers,
  buildStaticCommandHandlers,
  buildTownStockItemCommandHandlers,
  createToggleFavoriteRecipeHandler,
} from './gameActionHandlers/descriptorHandlers';

interface UseGameActionHandlersOptions {
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useGameActionHandlers({
  paused,
  setGame,
  worldTimeMsRef,
}: UseGameActionHandlersOptions) {
  const applyGameTransition = useCallback(
    (transition: (state: GameState) => GameState) => {
      if (paused) {
        return;
      }

      applyTimedGameTransition(setGame, worldTimeMsRef, transition);
    },
    [paused, setGame, worldTimeMsRef],
  );

  const inventoryItemHandlers = useMemo(
    () => buildInventoryItemCommandHandlers(applyGameTransition),
    [applyGameTransition],
  );

  const townStockItemHandlers = useMemo(
    () => buildTownStockItemCommandHandlers(applyGameTransition),
    [applyGameTransition],
  );

  const staticHandlers = useMemo(
    () => buildStaticCommandHandlers(applyGameTransition),
    [applyGameTransition],
  );

  const equipmentSlotHandlers = useMemo(
    () => buildEquipmentSlotCommandHandlers(applyGameTransition),
    [applyGameTransition],
  );

  const debugHandlers = useMemo(
    () => buildDebugCommandHandlers(applyGameTransition),
    [applyGameTransition],
  );

  const handleToggleFavoriteRecipe = useMemo(
    () => createToggleFavoriteRecipeHandler(applyGameTransition),
    [applyGameTransition],
  );

  return {
    applyGameTransition,
    ...inventoryItemHandlers,
    ...townStockItemHandlers,
    ...staticHandlers,
    ...equipmentSlotHandlers,
    ...debugHandlers,
    handleToggleFavoriteRecipe,
  };
}

function applyTimedGameTransition(
  setGame: Dispatch<SetStateAction<GameState>>,
  worldTimeMsRef: MutableRefObject<number>,
  transition: (state: GameState) => GameState,
) {
  setGame((current) =>
    transition({ ...current, worldTimeMs: worldTimeMsRef.current }),
  );
}
