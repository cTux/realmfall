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
  claimCurrentHex,
  craftRecipe,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  getCurrentTile,
  interactWithStructure,
  isEquippableItem,
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
import type { GraphicsSettings } from '../graphicsSettings';
import type { ItemContextMenuState, TooltipItem, TooltipState } from './types';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { getInventoryItemAction } from './utils/getInventoryItemAction';
import type { TooltipLine } from '../../ui/tooltips';
import { setTooltipState } from './tooltipStore';
import { getTooltipPlacementForRect } from '../../ui/tooltipPlacement';

interface UseAppControllersOptions {
  gameRef: MutableRefObject<GameState>;
  initialGraphicsSettings: GraphicsSettings;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppControllers({
  gameRef,
  initialGraphicsSettings,
  setGame,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions) {
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
    DEFAULT_WINDOW_VISIBILITY,
  );
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(
    initialGraphicsSettings,
  );
  const [logFilters, setLogFilters] =
    useState<Record<LogKind, boolean>>(DEFAULT_LOG_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);
  const [recipeMaterialFilterItemKey, setRecipeMaterialFilterItemKey] =
    useState<string | null>(null);

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

  const closeAllWindows = useCallback(() => {
    setWindowShown(() => ({
      worldTime: false,
      hero: false,
      skills: false,
      recipes: false,
      hexInfo: false,
      equipment: false,
      inventory: false,
      loot: false,
      log: false,
      combat: false,
      settings: false,
    }));
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
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        unequipItem(current, slot),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleSort = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, sortInventory);
  }, [setGame, worldTimeMsRef]);

  const handleProspect = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, prospectInventory);
  }, [setGame, worldTimeMsRef]);

  const handleSellAll = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, sellAllItems);
  }, [setGame, worldTimeMsRef]);

  const handleProspectItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        prospectInventoryItem(current, itemId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleSellItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        sellInventoryItem(current, itemId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleInteract = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, interactWithStructure);
  }, [setGame, worldTimeMsRef]);

  const handleClaimHex = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, claimCurrentHex);
  }, [setGame, worldTimeMsRef]);

  const handleBuyTownItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        buyTownItem(current, itemId),
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
      if (action === 'use') {
        applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
          applyItemUse(current, itemId),
        );
        return;
      }
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        equipItem(current, itemId),
      );
    },
    [gameRef, setGame, worldTimeMsRef],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        applyItemUse(current, itemId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        craftRecipe(current, recipeId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleDropItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        dropInventoryItem(current, itemId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        dropEquippedItem(current, slot),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      const currentStructure = getCurrentTile(gameRef.current).structure;
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        canProspect:
          currentStructure === 'forge' && isEquippableItem(item) && !item.locked,
        canSell:
          currentStructure === 'town' && isEquippableItem(item) && !item.locked,
      });
    },
    [gameRef],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: Parameters<typeof unequipItem>[1],
    ) => {
      event.preventDefault();
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        slot,
        canProspect: false,
        canSell: false,
      });
    },
    [],
  );

  const handleTakeLootItem = useCallback(
    (itemId: string) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        takeTileItem(current, itemId),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleTakeAllLoot = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, takeAllTileItems);
  }, [setGame, worldTimeMsRef]);

  const handleSetItemLocked = useCallback(
    (itemId: string, locked: boolean) => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        setInventoryItemLocked(current, itemId, locked),
      );
    },
    [setGame, worldTimeMsRef],
  );

  const handleOpenRecipeBookWithMaterialFilter = useCallback(
    (itemKey: string) => {
      setRecipeMaterialFilterItemKey(itemKey);
      setWindowShown((current) => ({ ...current, recipes: true }));
    },
    [],
  );

  const handleClearRecipeMaterialFilter = useCallback(() => {
    setRecipeMaterialFilterItemKey(null);
  }, []);

  const handleStartCombat = useCallback(() => {
    applyTimedGameTransition(setGame, worldTimeMsRef, startCombat);
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
    closeAllWindows,
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
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    itemMenu,
    logFilters,
    moveWindow,
    graphicsSettings,
    showTooltip,
    setGraphicsSettings,
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
    recipeMaterialFilterItemKey,
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
