import {
  useCallback,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { TooltipPosition } from '@realmfall/ui';
import type { GameState, Item } from '../../game/stateTypes';
import type { AudioSettings } from '../audioSettings';
import type { GraphicsSettings } from '../graphicsSettings';
import type { TooltipItem } from './types';
import { useActionBarController } from './hooks/useActionBarController';
import { useAppLogFilters } from './hooks/useAppLogFilters';
import { useAppSettingsState } from './hooks/useAppSettingsState';
import { useAppWindowState } from './hooks/useAppWindowState';
import { useGameActionHandlers } from './hooks/useGameActionHandlers';
import { useHexInfoWindowPromotion } from './hooks/useHexInfoWindowPromotion';
import { useHexItemModificationController } from './hooks/useHexItemModificationController';
import { useItemContextMenuController } from './hooks/useItemContextMenuController';
import { useItemTooltipController } from './hooks/useItemTooltipController';
import { useCraftingRecipeBookPromotion } from './hooks/useCraftingRecipeBookPromotion';
import { useRecipeMaterialFilter } from './hooks/useRecipeMaterialFilter';

interface UseAppControllersOptions {
  combat: GameState['combat'];
  currentTileItemsLength: number;
  currentStructure?: GameState['tiles'][string]['structure'];
  equipment: GameState['player']['equipment'];
  inventory: Item[];
  playerCoord: GameState['player']['coord'];
  gameRef: MutableRefObject<GameState>;
  initialAudioSettings: AudioSettings;
  initialGraphicsSettings: GraphicsSettings;
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMsRef: MutableRefObject<number>;
}

export interface AppControllers {
  state: {
    actionBarSlots: ReturnType<typeof useActionBarController>['actionBarSlots'];
    audioSettings: AudioSettings;
    graphicsSettings: GraphicsSettings;
    hexItemModificationPickerActive: boolean;
    itemMenu: ReturnType<typeof useItemContextMenuController>['itemMenu'];
    logFilters: ReturnType<typeof useAppLogFilters>['logFilters'];
    preferredRecipeSkill: ReturnType<
      typeof useRecipeMaterialFilter
    >['preferredRecipeSkill'];
    recipeMaterialFilterItemKey: string | null;
    selectedHexItemModificationItem: Item | null;
    selectedHexItemReforgeStatIndex: number | null;
    showFilterMenu: ReturnType<typeof useAppLogFilters>['showFilterMenu'];
    windowShown: ReturnType<typeof useAppWindowState>['windowShown'];
    windows: ReturnType<typeof useAppWindowState>['windows'];
  };
  actions: Omit<
    ReturnType<typeof useGameActionHandlers>,
    'applyGameTransition'
  > & {
    applySelectedItemModification: ReturnType<
      typeof useHexItemModificationController
    >['applySelectedItemModification'];
    clearSelectedItem: ReturnType<
      typeof useHexItemModificationController
    >['clearSelectedItem'];
    closeAllWindows: ReturnType<typeof useAppWindowState>['closeAllWindows'];
    closeItemMenu: ReturnType<
      typeof useItemContextMenuController
    >['closeItemMenu'];
    closeTooltip: ReturnType<typeof useItemTooltipController>['closeTooltip'];
    handleAssignActionBarSlot: ReturnType<
      typeof useActionBarController
    >['handleAssignActionBarSlot'];
    handleClearActionBarSlot: ReturnType<
      typeof useActionBarController
    >['handleClearActionBarSlot'];
    handleClearRecipeMaterialFilter: ReturnType<
      typeof useRecipeMaterialFilter
    >['handleClearRecipeMaterialFilter'];
    handleContextItem: ReturnType<
      typeof useItemContextMenuController
    >['handleContextItem'];
    handleEquipmentHover: (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
    ) => void;
    handleEquippedContextItem: ReturnType<
      typeof useItemContextMenuController
    >['handleEquippedContextItem'];
    handleOpenRecipeBookWithMaterialFilter: ReturnType<
      typeof useRecipeMaterialFilter
    >['handleOpenRecipeBookWithMaterialFilter'];
    handleSelectHexModificationInventoryItem: ReturnType<
      typeof useHexItemModificationController
    >['selectInventoryItem'];
    handleUseActionBarSlot: ReturnType<
      typeof useActionBarController
    >['handleUseActionBarSlot'];
    showActionBarItemTooltip: ReturnType<
      typeof useItemTooltipController
    >['showActionBarItemTooltip'];
    showItemTooltip: ReturnType<
      typeof useItemTooltipController
    >['showItemTooltip'];
    showTooltip: ReturnType<typeof useItemTooltipController>['showTooltip'];
    toggleDockWindow: ReturnType<typeof useAppWindowState>['toggleDockWindow'];
    toggleFilterMenu: ReturnType<typeof useAppLogFilters>['toggleFilterMenu'];
    toggleHexItemModificationPicker: ReturnType<
      typeof useHexItemModificationController
    >['togglePicker'];
    toggleLogFilter: ReturnType<typeof useAppLogFilters>['toggleLogFilter'];
  };
  mutators: {
    moveWindow: ReturnType<typeof useAppWindowState>['moveWindow'];
    setActionBarSlots: ReturnType<
      typeof useActionBarController
    >['setActionBarSlots'];
    setAudioSettings: ReturnType<
      typeof useAppSettingsState
    >['setAudioSettings'];
    setGraphicsSettings: ReturnType<
      typeof useAppSettingsState
    >['setGraphicsSettings'];
    setLogFilters: ReturnType<typeof useAppLogFilters>['setLogFilters'];
    setSelectedHexItemReforgeStatIndex: ReturnType<
      typeof useHexItemModificationController
    >['setSelectedReforgeStatIndex'];
    setTooltip: ReturnType<typeof useItemTooltipController>['setTooltip'];
    setWindowShown: ReturnType<typeof useAppWindowState>['setWindowShown'];
    setWindowVisibility: ReturnType<
      typeof useAppWindowState
    >['setWindowVisibility'];
    setWindows: ReturnType<typeof useAppWindowState>['setWindows'];
  };
}

export function useAppControllers({
  combat,
  currentTileItemsLength,
  currentStructure,
  equipment,
  inventory,
  playerCoord,
  gameRef,
  initialAudioSettings,
  initialGraphicsSettings,
  paused,
  setGame,
  tooltipPositionRef,
  worldTimeMsRef,
}: UseAppControllersOptions): AppControllers {
  const {
    audioSettings,
    graphicsSettings,
    setAudioSettings,
    setGraphicsSettings,
  } = useAppSettingsState(initialAudioSettings, initialGraphicsSettings);
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
  useHexInfoWindowPromotion({
    combatActive: combat != null,
    currentLootAvailable: currentTileItemsLength > 0,
    currentStructure: currentStructure != null,
    setWindowShown,
    windowShown,
  });
  const {
    handleClearRecipeMaterialFilter,
    handleOpenRecipeBookWithMaterialFilter,
    preferredRecipeSkill,
    recipeMaterialFilterItemKey,
    setPreferredRecipeSkill,
  } = useRecipeMaterialFilter(setWindowShown);
  useCraftingRecipeBookPromotion({
    currentStructure,
    playerCoord,
    setPreferredRecipeSkill,
    setWindowShown,
  });

  const handleEquipmentHover = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      showItemTooltip(event, item);
    },
    [showItemTooltip],
  );

  return {
    state: {
      actionBarSlots,
      audioSettings,
      graphicsSettings,
      hexItemModificationPickerActive,
      itemMenu,
      logFilters,
      preferredRecipeSkill,
      recipeMaterialFilterItemKey,
      selectedHexItemModificationItem,
      selectedHexItemReforgeStatIndex,
      showFilterMenu,
      windowShown,
      windows,
    },
    actions: {
      ...gameActionHandlers,
      applySelectedItemModification,
      clearSelectedItem,
      closeAllWindows,
      closeItemMenu,
      closeTooltip,
      handleAssignActionBarSlot,
      handleClearActionBarSlot,
      handleClearRecipeMaterialFilter,
      handleContextItem,
      handleEquipmentHover,
      handleEquippedContextItem,
      handleOpenRecipeBookWithMaterialFilter,
      handleSelectHexModificationInventoryItem,
      handleUseActionBarSlot,
      showActionBarItemTooltip,
      showItemTooltip,
      showTooltip,
      toggleDockWindow,
      toggleFilterMenu,
      toggleHexItemModificationPicker,
      toggleLogFilter,
    },
    mutators: {
      moveWindow,
      setActionBarSlots,
      setAudioSettings,
      setGraphicsSettings,
      setLogFilters,
      setSelectedHexItemReforgeStatIndex,
      setTooltip,
      setWindowShown,
      setWindowVisibility,
      setWindows,
    },
  };
}
