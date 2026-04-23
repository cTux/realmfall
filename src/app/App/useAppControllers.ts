import {
  useCallback,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { GameState, Item } from '../../game/stateTypes';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
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
import { useRecipeMaterialFilter } from './hooks/useRecipeMaterialFilter';

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
    setWindowShown,
    windowShown,
  });
  const {
    handleClearRecipeMaterialFilter,
    handleOpenRecipeBookWithMaterialFilter,
    recipeMaterialFilterItemKey,
  } = useRecipeMaterialFilter(setWindowShown);

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
