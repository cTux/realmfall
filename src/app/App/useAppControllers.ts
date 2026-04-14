import {
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import type { EquipmentSlot, GameState } from '../../game/state';
import { itemTooltipLines, type TooltipLine } from '../../ui/tooltips';
import { rarityColor } from '../../ui/rarity';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { getTooltipPlacementForRect } from '../../ui/tooltipPlacement';
import { getInventoryItemAction } from './appHelpers';
import { setTooltipState } from './tooltipStore';
import type { TooltipItem, TooltipState } from './types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { gameActions } from '../store/gameSlice';
import { uiActions } from '../store/uiSlice';
import {
  selectItemMenu,
  selectLogFilters,
  selectShowFilterMenu,
  selectWindowShown,
  selectWindows,
} from '../store/selectors/uiSelectors';

interface UseAppControllersOptions {
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppControllers({
  gameRef,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions) {
  const dispatch = useAppDispatch();
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const logFilters = useAppSelector(selectLogFilters);
  const showFilterMenu = useAppSelector(selectShowFilterMenu);
  const itemMenu = useAppSelector(selectItemMenu);

  const moveWindow = useCallback(
    (
      key: keyof typeof windows,
      position: (typeof windows)[keyof typeof windows],
    ) => {
      dispatch(uiActions.moveWindow({ key, position }));
    },
    [dispatch],
  );

  const setWindowVisibility = useCallback(
    (key: keyof typeof windowShown, shown: boolean) => {
      dispatch(uiActions.setWindowVisibility({ key, shown }));
    },
    [dispatch],
  );

  const toggleDockWindow = useCallback(
    (key: keyof typeof windowShown) => {
      dispatch(uiActions.toggleDockWindow(key));
    },
    [dispatch],
  );

  const closeTooltip = useCallback(() => {
    tooltipPositionRef.current = null;
    setTooltipState(null);
  }, [tooltipPositionRef]);

  const closeItemMenu = useCallback(() => {
    dispatch(uiActions.closeItemMenu());
  }, [dispatch]);

  const showItemTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      equipped?: TooltipItem,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const position = getTooltipPlacementForRect(rect);
      tooltipPositionRef.current = position;
      setTooltipState({
        title: item.name,
        lines: itemTooltipLines(item, equipped),
        x: position.x,
        y: position.y,
        placement: position.placement,
        borderColor: rarityColor(item.rarity),
      });
    },
    [tooltipPositionRef],
  );

  const showTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      title: string,
      lines: TooltipLine[],
      borderColor?: string,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const position = getTooltipPlacementForRect(rect);
      tooltipPositionRef.current = position;
      setTooltipState({
        title,
        lines,
        x: position.x,
        y: position.y,
        placement: position.placement,
        borderColor,
      });
    },
    [tooltipPositionRef],
  );

  const handleUnequip = useCallback(
    (slot: EquipmentSlot) => {
      dispatch(
        gameActions.unequipItemAtTime({
          slot,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleSort = useCallback(() => {
    dispatch(
      gameActions.sortInventoryAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleProspect = useCallback(() => {
    dispatch(
      gameActions.prospectInventoryAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleSellAll = useCallback(() => {
    dispatch(
      gameActions.sellAllItemsAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleInteract = useCallback(() => {
    dispatch(
      gameActions.interactWithStructureAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleClaimHex = useCallback(() => {
    dispatch(
      gameActions.claimCurrentHexAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleBuyTownItem = useCallback(
    (itemId: string) => {
      dispatch(
        gameActions.buyTownItemAtTime({
          itemId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleEquip = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      const action = getInventoryItemAction(item);
      if (action === 'open-recipes') {
        dispatch(
          uiActions.setWindowVisibility({
            key: 'recipes',
            shown: true,
          }),
        );
        return;
      }
      if (action === 'use') {
        dispatch(
          gameActions.useItemAtTime({
            itemId,
            worldTimeMs: worldTimeMsRef.current,
          }),
        );
        return;
      }

      dispatch(
        gameActions.equipItemAtTime({
          itemId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, gameRef, worldTimeMsRef],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      if (getInventoryItemAction(item) === 'open-recipes') {
        dispatch(
          uiActions.setWindowVisibility({
            key: 'recipes',
            shown: true,
          }),
        );
        return;
      }

      dispatch(
        gameActions.useItemAtTime({
          itemId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, gameRef, worldTimeMsRef],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string) => {
      dispatch(
        gameActions.craftRecipeAtTime({
          recipeId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleDropItem = useCallback(
    (itemId: string) => {
      dispatch(
        gameActions.dropInventoryItemAtTime({
          itemId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleDropEquippedItem = useCallback(
    (slot: EquipmentSlot) => {
      dispatch(
        gameActions.dropEquippedItemAtTime({
          slot,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      dispatch(
        uiActions.openItemMenu({
          item,
          x: event.clientX,
          y: event.clientY,
        }),
      );
    },
    [dispatch],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: EquipmentSlot,
    ) => {
      event.preventDefault();
      dispatch(
        uiActions.openItemMenu({
          item,
          x: event.clientX,
          y: event.clientY,
          slot,
        }),
      );
    },
    [dispatch],
  );

  const handleTakeLootItem = useCallback(
    (itemId: string) => {
      dispatch(
        gameActions.takeTileItemAtTime({
          itemId,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch, worldTimeMsRef],
  );

  const handleTakeAllLoot = useCallback(() => {
    dispatch(
      gameActions.takeAllTileItemsAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const handleStartCombat = useCallback(() => {
    dispatch(
      gameActions.startCombatAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMsRef]);

  const toggleFilterMenu = useCallback(() => {
    dispatch(uiActions.toggleFilterMenu());
  }, [dispatch]);

  const toggleLogFilter = useCallback(
    (kind: keyof typeof logFilters) => {
      dispatch(uiActions.toggleLogFilter(kind));
    },
    [dispatch],
  );

  const handleEquipmentHover = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      showItemTooltip(event, item);
    },
    [showItemTooltip],
  );

  const setTooltip = useCallback((nextTooltip: TooltipState | null) => {
    setTooltipState(nextTooltip);
  }, []);

  return {
    closeItemMenu,
    closeTooltip,
    handleBuyTownItem,
    handleClaimHex,
    handleContextItem,
    handleCraftRecipe,
    handleDropEquippedItem,
    handleDropItem,
    handleEquipmentHover,
    handleEquip,
    handleEquippedContextItem,
    handleInteract,
    handleProspect,
    handleSellAll,
    handleSort,
    handleStartCombat,
    handleTakeAllLoot,
    handleTakeLootItem,
    handleUnequip,
    handleUseItem,
    itemMenu,
    logFilters,
    moveWindow,
    setWindowVisibility,
    setTooltip,
    showFilterMenu,
    showItemTooltip,
    showTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
  };
}
