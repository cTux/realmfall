import {
  useCallback,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  buyTownItem,
  craftRecipe,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  interactWithStructure,
  prospectInventory,
  sellAllItems,
  sortInventory,
  startCombat,
  takeAllTileItems,
  takeTileItem,
  unequipItem,
  useItem as applyItemUse,
  type GameState,
  type LogKind,
} from '../../game/state';
import { itemTooltipLines } from '../../ui/tooltips';
import { rarityColor } from '../../ui/rarity';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import type { ItemContextMenuState, TooltipItem, TooltipState } from './types';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { getInventoryItemAction } from './appHelpers';
import type { TooltipLine } from '../../ui/tooltips';
import { setTooltipState } from './tooltipStore';

interface UseAppControllersOptions {
  gameRef: MutableRefObject<GameState>;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppControllers({
  gameRef,
  setGame,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions) {
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
    DEFAULT_WINDOW_VISIBILITY,
  );
  const [logFilters, setLogFilters] =
    useState<Record<LogKind, boolean>>(DEFAULT_LOG_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);

  const moveWindow = useCallback(
    (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => {
      setWindows((current) => ({ ...current, [key]: position }));
    },
    [],
  );

  const setWindowVisibility = useCallback(
    (key: keyof WindowVisibilityState, shown: boolean) => {
      setWindowShown((current) => ({ ...current, [key]: shown }));
    },
    [],
  );

  const toggleDockWindow = useCallback((key: keyof WindowVisibilityState) => {
    setWindowShown((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const closeTooltip = useCallback(() => {
    tooltipPositionRef.current = null;
    setTooltipState(null);
  }, [tooltipPositionRef]);

  const closeItemMenu = useCallback(() => {
    setItemMenu(null);
  }, []);

  const showItemTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      equipped?: TooltipItem,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const position = {
        x: rect.right + 12,
        y: rect.top,
      };
      tooltipPositionRef.current = position;
      setTooltipState({
        title: item.name,
        lines: itemTooltipLines(item, equipped),
        x: position.x,
        y: position.y,
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
      const position = {
        x: rect.right + 12,
        y: rect.top,
      };
      tooltipPositionRef.current = position;
      setTooltipState({
        title,
        lines,
        x: position.x,
        y: position.y,
        borderColor,
      });
    },
    [tooltipPositionRef],
  );

  const handleUnequip = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) =>
        unequipItem({ ...current, worldTimeMs: worldTimeMsRef.current }, slot),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleSort = useCallback(() => {
    setGame((current) =>
      sortInventory({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, [setGame, worldTimeMsRef]);

  const handleProspect = useCallback(() => {
    setGame((current) =>
      prospectInventory({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, [setGame, worldTimeMsRef]);

  const handleSellAll = useCallback(() => {
    setGame((current) =>
      sellAllItems({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, [setGame, worldTimeMsRef]);

  const handleInteract = useCallback(() => {
    setGame((current) =>
      interactWithStructure({
        ...current,
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [setGame, worldTimeMsRef]);

  const handleBuyTownItem = useCallback(
    (itemId: string) => {
      setGame((current) =>
        buyTownItem(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          itemId,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleEquip = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      const action = getInventoryItemAction(item);
      if (action === 'open-recipes') {
        setWindowVisibility('recipes', true);
        return;
      }
      if (action === 'use') {
        setGame((current) =>
          applyItemUse(
            { ...current, worldTimeMs: worldTimeMsRef.current },
            itemId,
          ),
        );
        return;
      }
      setGame((current) =>
        equipItem({ ...current, worldTimeMs: worldTimeMsRef.current }, itemId),
      );
    },
    [gameRef, setGame, setWindowVisibility, worldTimeMsRef],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      if (getInventoryItemAction(item) === 'open-recipes') {
        setWindowVisibility('recipes', true);
        return;
      }
      setGame((current) =>
        applyItemUse(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          itemId,
        ),
      );
    },
    [gameRef, setGame, setWindowVisibility, worldTimeMsRef],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string) => {
      setGame((current) =>
        craftRecipe(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          recipeId,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleDropItem = useCallback(
    (itemId: string) => {
      setGame((current) =>
        dropInventoryItem(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          itemId,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) =>
        dropEquippedItem(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          slot,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      setItemMenu({ item, x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: Parameters<typeof unequipItem>[1],
    ) => {
      event.preventDefault();
      setItemMenu({ item, x: event.clientX, y: event.clientY, slot });
    },
    [],
  );

  const handleTakeLootItem = useCallback(
    (itemId: string) => {
      setGame((current) =>
        takeTileItem(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          itemId,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleTakeAllLoot = useCallback(() => {
    setGame((current) =>
      takeAllTileItems({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, [setGame, worldTimeMsRef]);

  const handleStartCombat = useCallback(() => {
    setGame((current) =>
      startCombat({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, [setGame, worldTimeMsRef]);

  const toggleFilterMenu = useCallback(() => {
    setShowFilterMenu((current) => !current);
  }, []);

  const toggleLogFilter = useCallback((kind: LogKind) => {
    setLogFilters((current) => ({ ...current, [kind]: !current[kind] }));
  }, []);

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
    showTooltip,
    setLogFilters,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    showFilterMenu,
    showItemTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
  };
}
