import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  activateInventoryItem,
  buyTownItem,
  claimCurrentHex,
  craftRecipe,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  interactWithStructure,
  prospectInventoryItem,
  prospectInventory,
  sellInventoryItem,
  sellAllItems,
  setInventoryItemLocked,
  sortInventory,
  startCombat,
  takeAllTileItems,
  takeTileItem,
  unequipItem,
  useItem as applyItemUse,
  type GameState,
} from '../../../game/state';

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

  const handleUnequip = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyGameTransition((current) => unequipItem(current, slot));
    },
    [applyGameTransition],
  );

  const handleSort = useCallback(() => {
    applyGameTransition(sortInventory);
  }, [applyGameTransition]);

  const handleProspect = useCallback(() => {
    applyGameTransition(prospectInventory);
  }, [applyGameTransition]);

  const handleSellAll = useCallback(() => {
    applyGameTransition(sellAllItems);
  }, [applyGameTransition]);

  const handleProspectItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => prospectInventoryItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleSellItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => sellInventoryItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleInteract = useCallback(() => {
    applyGameTransition(interactWithStructure);
  }, [applyGameTransition]);

  const handleClaimHex = useCallback(() => {
    applyGameTransition(claimCurrentHex);
  }, [applyGameTransition]);

  const handleBuyTownItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => buyTownItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleActivateInventoryItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => activateInventoryItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleEquipItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => equipItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => applyItemUse(current, itemId));
    },
    [applyGameTransition],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string, count?: number | 'max') => {
      applyGameTransition((current) => craftRecipe(current, recipeId, count));
    },
    [applyGameTransition],
  );

  const handleDropItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => dropInventoryItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyGameTransition((current) => dropEquippedItem(current, slot));
    },
    [applyGameTransition],
  );

  const handleTakeLootItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => takeTileItem(current, itemId));
    },
    [applyGameTransition],
  );

  const handleTakeAllLoot = useCallback(() => {
    applyGameTransition(takeAllTileItems);
  }, [applyGameTransition]);

  const handleSetItemLocked = useCallback(
    (itemId: string, locked: boolean) => {
      applyGameTransition((current) =>
        setInventoryItemLocked(current, itemId, locked),
      );
    },
    [applyGameTransition],
  );

  const handleStartCombat = useCallback(() => {
    applyGameTransition(startCombat);
  }, [applyGameTransition]);

  return {
    applyGameTransition,
    handleActivateInventoryItem,
    handleBuyTownItem,
    handleClaimHex,
    handleCraftRecipe,
    handleDropEquippedItem,
    handleDropItem,
    handleEquipItem,
    handleInteract,
    handleProspect,
    handleProspectItem,
    handleSellAll,
    handleSellItem,
    handleSetItemLocked,
    handleSort,
    handleStartCombat,
    handleTakeAllLoot,
    handleTakeLootItem,
    handleUnequip,
    handleUseItem,
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
