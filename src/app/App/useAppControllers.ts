import {
  useCallback,
  useEffect,
  useRef,
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
  isRecipePage,
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
  type Item,
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
import type { AudioSettings } from '../audioSettings';
import type { GraphicsSettings } from '../graphicsSettings';
import type { ItemContextMenuState, TooltipItem, TooltipState } from './types';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { getInventoryItemAction } from './utils/getInventoryItemAction';
import type { TooltipLine } from '../../ui/tooltips';
import { setTooltipState } from './tooltipStore';
import { getTooltipPlacementForRect } from '../../ui/tooltipPlacement';
import {
  createDefaultActionBarSlots,
  findActionBarItem,
  reconcileActionBarSlots,
  type ActionBarSlots,
} from './actionBar';

interface UseAppControllersOptions {
  inventory: Item[];
  gameRef: MutableRefObject<GameState>;
  initialAudioSettings: AudioSettings;
  initialGraphicsSettings: GraphicsSettings;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppControllers({
  inventory,
  gameRef,
  initialAudioSettings,
  initialGraphicsSettings,
  setGame,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions) {
  const itemTooltipLinesCacheRef = useRef(
    new WeakMap<
      TooltipItem,
      {
        withoutEquipped: TooltipLine[] | null;
        withoutEquippedRecipeLearned: TooltipLine[] | null;
        withEquipped: WeakMap<
          TooltipItem,
          {
            recipeUnknown: TooltipLine[] | null;
            recipeLearned: TooltipLine[] | null;
          }
        >;
      }
    >(),
  );
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
    DEFAULT_WINDOW_VISIBILITY,
  );
  const [audioSettings, setAudioSettings] =
    useState<AudioSettings>(initialAudioSettings);
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(
    initialGraphicsSettings,
  );
  const [logFilters, setLogFilters] =
    useState<Record<LogKind, boolean>>(DEFAULT_LOG_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);
  const [actionBarSlots, setActionBarSlots] = useState<ActionBarSlots>(
    createDefaultActionBarSlots,
  );
  const [recipeMaterialFilterItemKey, setRecipeMaterialFilterItemKey] =
    useState<string | null>(null);

  useEffect(() => {
    setActionBarSlots((current) => reconcileActionBarSlots(inventory, current));
  }, [inventory]);

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
      const recipeLearned =
        isRecipePage(item) &&
        item.recipeId != null &&
        gameRef.current.player.learnedRecipeIds.includes(item.recipeId);
      tooltipPositionRef.current = position;
      setTooltipState({
        title: item.name,
        lines: getCachedItemTooltipLines(
          itemTooltipLinesCacheRef.current,
          item,
          equipped,
          recipeLearned,
        ),
        contentKey: getItemTooltipContentKey(item, equipped, recipeLearned),
        x: position.x,
        y: position.y,
        placement: position.placement,
        borderColor: rarityColor(item.rarity),
      });
    },
    [gameRef, tooltipPositionRef],
  );

  const showActionBarItemTooltip = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const recipeLearned =
        isRecipePage(item) &&
        item.recipeId != null &&
        gameRef.current.player.learnedRecipeIds.includes(item.recipeId);
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
      tooltipPositionRef.current = position;
      setTooltipState({
        title: item.name,
        lines: getCachedItemTooltipLines(
          itemTooltipLinesCacheRef.current,
          item,
          undefined,
          recipeLearned,
        ),
        contentKey: getItemTooltipContentKey(item, undefined, recipeLearned),
        x: position.x,
        y: position.y,
        placement: 'top',
        borderColor: rarityColor(item.rarity),
      });
    },
    [gameRef, tooltipPositionRef],
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
        contentKey: undefined,
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
      const action = getInventoryItemAction(
        item,
        gameRef.current.player.learnedRecipeIds,
      );
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

  const handleAssignActionBarSlot = useCallback(
    (slotIndex: number, item: Item) => {
      setActionBarSlots((current) => {
        const next = [...current];
        next[slotIndex] = { item: { ...item } };
        return next;
      });
    },
    [],
  );

  const handleClearActionBarSlot = useCallback((slotIndex: number) => {
    setActionBarSlots((current) => {
      if (!current[slotIndex]) return current;

      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  const handleUseActionBarSlot = useCallback(
    (slotIndex: number) => {
      const assigned = actionBarSlots[slotIndex];
      const item = findActionBarItem(
        gameRef.current.player.inventory,
        assigned,
      );
      if (!item) return;

      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        applyItemUse(current, item.id),
      );
    },
    [actionBarSlots, gameRef, setGame, worldTimeMsRef],
  );

  const handleCraftRecipe = useCallback(
    (recipeId: string, count?: number | 'max') => {
      applyTimedGameTransition(setGame, worldTimeMsRef, (current) =>
        craftRecipe(current, recipeId, count),
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
        canProspectInventoryEquipment:
          currentStructure === 'forge' &&
          isEquippableItem(item) &&
          !item.locked,
        canSellInventoryEquipment:
          currentStructure === 'town' &&
          (isEquippableItem(item) || isRecipePage(item)) &&
          !item.locked,
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
        canProspectInventoryEquipment: false,
        canSellInventoryEquipment: false,
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
    handleAssignActionBarSlot,
    handleClearActionBarSlot,
    handleUseActionBarSlot,
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    actionBarSlots,
    audioSettings,
    itemMenu,
    logFilters,
    moveWindow,
    graphicsSettings,
    showTooltip,
    setAudioSettings,
    setActionBarSlots,
    setGraphicsSettings,
    setLogFilters,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    showFilterMenu,
    showActionBarItemTooltip,
    showItemTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
    recipeMaterialFilterItemKey,
  };
}

function getCachedItemTooltipLines(
  cache: WeakMap<
    TooltipItem,
    {
      withoutEquipped: TooltipLine[] | null;
      withoutEquippedRecipeLearned: TooltipLine[] | null;
      withEquipped: WeakMap<
        TooltipItem,
        {
          recipeUnknown: TooltipLine[] | null;
          recipeLearned: TooltipLine[] | null;
        }
      >;
    }
  >,
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  recipeLearned: boolean,
) {
  let itemCache = cache.get(item);
  if (!itemCache) {
    itemCache = {
      withoutEquipped: null,
      withoutEquippedRecipeLearned: null,
      withEquipped: new WeakMap(),
    };
    cache.set(item, itemCache);
  }

  if (!equipped) {
    const cacheKey = recipeLearned
      ? 'withoutEquippedRecipeLearned'
      : 'withoutEquipped';
    const cachedLines = itemCache[cacheKey];
    if (cachedLines) {
      return cachedLines;
    }

    const lines = itemTooltipLines(item, undefined, { recipeLearned });
    itemCache[cacheKey] = lines;
    return lines;
  }

  let equippedCache = itemCache.withEquipped.get(equipped);
  if (!equippedCache) {
    equippedCache = {
      recipeUnknown: null,
      recipeLearned: null,
    };
    itemCache.withEquipped.set(equipped, equippedCache);
  }

  const cacheKey = recipeLearned ? 'recipeLearned' : 'recipeUnknown';
  const cachedLines = equippedCache[cacheKey];
  if (cachedLines) {
    return cachedLines;
  }

  const lines = itemTooltipLines(item, equipped, { recipeLearned });
  equippedCache[cacheKey] = lines;
  return lines;
}

function getItemTooltipContentKey(
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  recipeLearned: boolean,
) {
  return [
    'item',
    item.id,
    equipped?.id ?? 'none',
    recipeLearned ? 'learned' : 'unknown',
  ].join(':');
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
