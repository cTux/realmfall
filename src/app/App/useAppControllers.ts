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
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

type ItemTooltipLinesBuilder =
  typeof import('../../ui/tooltips').itemTooltipLines;

let itemTooltipModulePromise: Promise<
  typeof import('../../ui/tooltips') | null
> | null = null;

export function useAppControllers({
  inventory,
  gameRef,
  initialAudioSettings,
  initialGraphicsSettings,
  paused,
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
  const tooltipRequestIdRef = useRef(0);
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
  const applyGameTransition = useCallback(
    (transition: (state: GameState) => GameState) => {
      if (paused) {
        return;
      }

      applyTimedGameTransition(setGame, worldTimeMsRef, transition);
    },
    [paused, setGame, worldTimeMsRef],
  );

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
    tooltipRequestIdRef.current += 1;
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
      const requestId = ++tooltipRequestIdRef.current;

      void loadItemTooltipModule().then((tooltipModule) => {
        if (tooltipRequestIdRef.current !== requestId) {
          return;
        }

        if (!tooltipModule) {
          tooltipPositionRef.current = null;
          setTooltipState(null);
          return;
        }

        const { itemTooltipLines } = tooltipModule;

        tooltipPositionRef.current = position;
        setTooltipState({
          title: item.name,
          lines: getCachedItemTooltipLines(
            itemTooltipLinesCacheRef.current,
            itemTooltipLines,
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
      const position = getTooltipPlacementForRect(rect, {
        preferredPlacements: ['top', 'right', 'left', 'bottom'],
      });
      const requestId = ++tooltipRequestIdRef.current;

      void loadItemTooltipModule().then((tooltipModule) => {
        if (tooltipRequestIdRef.current !== requestId) {
          return;
        }

        if (!tooltipModule) {
          tooltipPositionRef.current = null;
          setTooltipState(null);
          return;
        }

        const { itemTooltipLines } = tooltipModule;

        tooltipPositionRef.current = position;
        setTooltipState({
          title: item.name,
          lines: getCachedItemTooltipLines(
            itemTooltipLinesCacheRef.current,
            itemTooltipLines,
            item,
            undefined,
            recipeLearned,
          ),
          contentKey: getItemTooltipContentKey(item, undefined, recipeLearned),
          x: position.x,
          y: position.y,
          placement: position.placement,
          borderColor: rarityColor(item.rarity),
        });
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
        applyGameTransition((current) => applyItemUse(current, itemId));
        return;
      }
      applyGameTransition((current) => equipItem(current, itemId));
    },
    [applyGameTransition, gameRef],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      applyGameTransition((current) => applyItemUse(current, itemId));
    },
    [applyGameTransition],
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

      applyGameTransition((current) => applyItemUse(current, item.id));
    },
    [actionBarSlots, applyGameTransition, gameRef],
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
    applyGameTransition(startCombat);
  }, [applyGameTransition]);

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
  buildItemTooltipLines: ItemTooltipLinesBuilder,
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

    const lines = buildItemTooltipLines(item, undefined, { recipeLearned });
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

  const lines = buildItemTooltipLines(item, equipped, { recipeLearned });
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

function loadItemTooltipModule() {
  itemTooltipModulePromise ??= import('../../ui/tooltips').catch(() => {
    itemTooltipModulePromise = null;
    return null;
  });
  return itemTooltipModulePromise;
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
