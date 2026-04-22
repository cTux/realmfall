import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { GameState, Item } from '../../game/state';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { AudioSettings } from '../audioSettings';
import type { GraphicsSettings } from '../graphicsSettings';
import type { TooltipItem } from './types';
import { useActionBarController } from './hooks/useActionBarController';
import { useAppLogFilters } from './hooks/useAppLogFilters';
import { useAppWindowState } from './hooks/useAppWindowState';
import { useGameActionHandlers } from './hooks/useGameActionHandlers';
import { useHexItemModificationController } from './hooks/useHexItemModificationController';
import { useItemContextMenuController } from './hooks/useItemContextMenuController';
import { useItemTooltipController } from './hooks/useItemTooltipController';

interface UseAppControllersOptions {
  currentStructure?: GameState['tiles'][string]['structure'];
  equipment: GameState['player']['equipment'];
  inventory: Item[];
  gameRef: MutableRefObject<GameState>;
  initialAudioSettings: AudioSettings;
  initialGraphicsSettings: GraphicsSettings;
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppControllers({
  currentStructure,
  equipment,
  inventory,
  gameRef,
  initialAudioSettings,
  initialGraphicsSettings,
  paused,
  setGame,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions) {
  const [audioSettings, setAudioSettings] =
    useState<AudioSettings>(initialAudioSettings);
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(
    initialGraphicsSettings,
  );
  const [recipeMaterialFilterItemKey, setRecipeMaterialFilterItemKey] =
    useState<string | null>(null);
  const {
    closeAllWindows,
    moveWindow,
    setWindowShown,
    setWindows,
    setWindowVisibility,
    toggleDockWindow,
    windowShown,
    windows,
  } = useAppWindowState();
  const {
    logFilters,
    setLogFilters,
    showFilterMenu,
    toggleFilterMenu,
    toggleLogFilter,
  } = useAppLogFilters();
  const { applyGameTransition, ...gameActionHandlers } = useGameActionHandlers({
    paused,
    setGame,
    worldTimeMsRef,
  });
  const {
    applySelectedItemModification,
    clearSelectedItem,
    pickerActive: hexItemModificationPickerActive,
    resolvedReforgeStatIndex: selectedHexItemReforgeStatIndex,
    selectInventoryItem: handleSelectHexModificationInventoryItem,
    selectedItem: selectedHexItemModificationItem,
    setSelectedReforgeStatIndex: setSelectedHexItemReforgeStatIndex,
    togglePicker: toggleHexItemModificationPicker,
  } = useHexItemModificationController({
    currentStructure,
    equipment,
    inventory,
    onCorruptItem: gameActionHandlers.handleCorruptItem,
    onEnchantItem: gameActionHandlers.handleEnchantItem,
    onReforgeItem: gameActionHandlers.handleReforgeItem,
  });
  const {
    actionBarSlots,
    handleAssignActionBarSlot,
    handleClearActionBarSlot,
    handleUseActionBarSlot,
    setActionBarSlots,
  } = useActionBarController({
    applyGameTransition,
    gameRef,
    inventory,
  });
  const {
    closeItemMenu,
    handleContextItem,
    handleEquippedContextItem,
    itemMenu,
  } = useItemContextMenuController({
    gameRef,
  });
  const {
    closeTooltip,
    setTooltip,
    showActionBarItemTooltip,
    showItemTooltip,
    showTooltip,
  } = useItemTooltipController({
    gameRef,
    tooltipPositionRef,
  });
  useEffect(() => {
    if (!windowShown.loot && !windowShown.combat) {
      return;
    }

    setWindowShown((current) => {
      if (!current.loot && !current.combat) {
        return current;
      }

      return {
        ...current,
        hexInfo: current.hexInfo || current.loot || current.combat,
        loot: false,
        combat: false,
      };
    });
  }, [setWindowShown, windowShown.combat, windowShown.loot]);
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

  const handleEquipmentHover = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      showItemTooltip(event, item);
    },
    [showItemTooltip],
  );

  return {
    closeItemMenu,
    closeAllWindows,
    closeTooltip,
    ...gameActionHandlers,
    handleContextItem,
    handleEquipmentHover,
    handleEquippedContextItem,
    handleAssignActionBarSlot,
    handleClearActionBarSlot,
    handleUseActionBarSlot,
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    actionBarSlots,
    audioSettings,
    applySelectedItemModification,
    clearSelectedItem,
    itemMenu,
    logFilters,
    moveWindow,
    graphicsSettings,
    hexItemModificationPickerActive,
    selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex,
    showTooltip,
    setAudioSettings,
    setActionBarSlots,
    setGraphicsSettings,
    setLogFilters,
    setSelectedHexItemReforgeStatIndex,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    handleSelectHexModificationInventoryItem,
    showFilterMenu,
    showActionBarItemTooltip,
    showItemTooltip,
    toggleHexItemModificationPicker,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
    recipeMaterialFilterItemKey,
  };
}
