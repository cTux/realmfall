import { useMemo } from 'react';
import type { AppWindowsActions } from '../AppWindows.types';

interface UseAppWindowActionsArgs {
  closeItemMenu: AppWindowsActions['tooltip']['onCloseItemMenu'];
  closeTooltip: AppWindowsActions['tooltip']['onCloseTooltip'];
  handleActivateInventoryItem: AppWindowsActions['inventory']['onActivateItem'];
  handleAssignActionBarSlot: AppWindowsActions['inventory']['onAssignActionBarSlot'];
  handleBuyTownItem: AppWindowsActions['world']['onBuyTownItem'];
  handleClaimHex: AppWindowsActions['world']['onClaimHex'];
  handleClearActionBarSlot: AppWindowsActions['inventory']['onClearActionBarSlot'];
  handleClearRecipeMaterialFilter: AppWindowsActions['recipes']['onClearMaterialFilter'];
  handleContextItem: AppWindowsActions['inventory']['onContextItem'];
  handleCraftRecipe: AppWindowsActions['inventory']['onCraftRecipe'];
  handleDropEquippedItem: AppWindowsActions['inventory']['onDropEquippedItem'];
  handleDropItem: AppWindowsActions['inventory']['onDropItem'];
  handleEnchantItem: AppWindowsActions['inventory']['onEnchantItem'];
  handleSelectHexItemModificationItem: AppWindowsActions['inventory']['onSelectHexItemModificationItem'];
  handleEquipmentHover: AppWindowsActions['tooltip']['onEquipmentHover'];
  handleEquipItem: AppWindowsActions['inventory']['onEquipItem'];
  handleEquippedContextItem: AppWindowsActions['inventory']['onEquippedContextItem'];
  handleInteract: AppWindowsActions['world']['onInteract'];
  handleOpenRecipeBookWithMaterialFilter: AppWindowsActions['recipes']['onOpenWithMaterialFilter'];
  handleCorruptItem: AppWindowsActions['inventory']['onCorruptItem'];
  handleProspect: AppWindowsActions['world']['onProspect'];
  handleProspectItem: AppWindowsActions['inventory']['onProspectItem'];
  handleReforgeItem: AppWindowsActions['inventory']['onReforgeItem'];
  handleResetSaveArea: AppWindowsActions['settings']['onResetSaveArea'];
  handleSaveSettings: AppWindowsActions['settings']['onSaveSettings'];
  handleSaveSettingsAndReload: AppWindowsActions['settings']['onSaveSettingsAndReload'];
  handleSellAll: AppWindowsActions['world']['onSellAll'];
  handleSellItem: AppWindowsActions['inventory']['onSellItem'];
  handleApplySelectedItemModification: AppWindowsActions['world']['onApplySelectedItemModification'];
  handleClearSelectedItemModification: AppWindowsActions['world']['onClearSelectedItemModification'];
  handleSelectItemModificationReforgeStat: AppWindowsActions['world']['onSelectItemModificationReforgeStat'];
  handleSetHome: AppWindowsActions['world']['onSetHome'];
  handleSetItemLocked: AppWindowsActions['inventory']['onSetItemLocked'];
  handleSort: AppWindowsActions['inventory']['onSort'];
  handleStartCombat: AppWindowsActions['world']['onStartCombat'];
  handleTakeAllLoot: AppWindowsActions['inventory']['onTakeAllLoot'];
  handleTakeLootItem: AppWindowsActions['inventory']['onTakeLootItem'];
  handleUnequip: AppWindowsActions['inventory']['onUnequip'];
  handleUseActionBarSlot: AppWindowsActions['inventory']['onUseActionBarSlot'];
  handleUseItem: AppWindowsActions['inventory']['onUseItem'];
  moveWindow: AppWindowsActions['windows']['onMoveWindow'];
  setWindowVisibility: AppWindowsActions['windows']['onSetWindowVisibility'];
  showActionBarItemTooltip: AppWindowsActions['tooltip']['onShowActionBarItemTooltip'];
  showItemTooltip: AppWindowsActions['tooltip']['onShowItemTooltip'];
  showTooltip: AppWindowsActions['tooltip']['onShowTooltip'];
  toggleItemModificationPicker: AppWindowsActions['world']['onToggleItemModificationPicker'];
  toggleDockWindow: AppWindowsActions['windows']['onToggleDockWindow'];
  toggleFilterMenu: AppWindowsActions['logs']['onToggleFilterMenu'];
  toggleLogFilter: AppWindowsActions['logs']['onToggleLogFilter'];
}

export function useAppWindowActions({
  closeItemMenu,
  closeTooltip,
  handleActivateInventoryItem,
  handleAssignActionBarSlot,
  handleBuyTownItem,
  handleClaimHex,
  handleClearActionBarSlot,
  handleClearRecipeMaterialFilter,
  handleContextItem,
  handleCraftRecipe,
  handleDropEquippedItem,
  handleDropItem,
  handleEnchantItem,
  handleSelectHexItemModificationItem,
  handleEquipmentHover,
  handleEquipItem,
  handleEquippedContextItem,
  handleInteract,
  handleOpenRecipeBookWithMaterialFilter,
  handleCorruptItem,
  handleProspect,
  handleProspectItem,
  handleReforgeItem,
  handleResetSaveArea,
  handleSaveSettings,
  handleSaveSettingsAndReload,
  handleSellAll,
  handleSellItem,
  handleApplySelectedItemModification,
  handleClearSelectedItemModification,
  handleSelectItemModificationReforgeStat,
  handleSetHome,
  handleSetItemLocked,
  handleSort,
  handleStartCombat,
  handleTakeAllLoot,
  handleTakeLootItem,
  handleUnequip,
  handleUseActionBarSlot,
  handleUseItem,
  moveWindow,
  setWindowVisibility,
  showActionBarItemTooltip,
  showItemTooltip,
  showTooltip,
  toggleItemModificationPicker,
  toggleDockWindow,
  toggleFilterMenu,
  toggleLogFilter,
}: UseAppWindowActionsArgs): AppWindowsActions {
  const windows = useMemo(
    () => ({
      onMoveWindow: moveWindow,
      onSetWindowVisibility: setWindowVisibility,
      onToggleDockWindow: toggleDockWindow,
    }),
    [moveWindow, setWindowVisibility, toggleDockWindow],
  );

  const tooltip = useMemo(
    () => ({
      onShowActionBarItemTooltip: showActionBarItemTooltip,
      onShowItemTooltip: showItemTooltip,
      onShowTooltip: showTooltip,
      onCloseTooltip: closeTooltip,
      onCloseItemMenu: closeItemMenu,
      onEquipmentHover: handleEquipmentHover,
    }),
    [
      closeItemMenu,
      closeTooltip,
      handleEquipmentHover,
      showActionBarItemTooltip,
      showItemTooltip,
      showTooltip,
    ],
  );

  const inventory = useMemo(
    () => ({
      onUnequip: handleUnequip,
      onSort: handleSort,
      onActivateItem: handleActivateInventoryItem,
      onEquipItem: handleEquipItem,
      onUseItem: handleUseItem,
      onAssignActionBarSlot: handleAssignActionBarSlot,
      onClearActionBarSlot: handleClearActionBarSlot,
      onUseActionBarSlot: handleUseActionBarSlot,
      onCraftRecipe: handleCraftRecipe,
      onDropItem: handleDropItem,
      onDropEquippedItem: handleDropEquippedItem,
      onEnchantItem: handleEnchantItem,
      onCorruptItem: handleCorruptItem,
      onSelectHexItemModificationItem: handleSelectHexItemModificationItem,
      onProspectItem: handleProspectItem,
      onReforgeItem: handleReforgeItem,
      onSellItem: handleSellItem,
      onSetItemLocked: handleSetItemLocked,
      onContextItem: handleContextItem,
      onEquippedContextItem: handleEquippedContextItem,
      onTakeLootItem: handleTakeLootItem,
      onTakeAllLoot: handleTakeAllLoot,
    }),
    [
      handleActivateInventoryItem,
      handleAssignActionBarSlot,
      handleClearActionBarSlot,
      handleContextItem,
      handleCraftRecipe,
      handleDropEquippedItem,
      handleDropItem,
      handleEnchantItem,
      handleEquipItem,
      handleEquippedContextItem,
      handleCorruptItem,
      handleProspectItem,
      handleReforgeItem,
      handleSelectHexItemModificationItem,
      handleSellItem,
      handleSetItemLocked,
      handleSort,
      handleTakeAllLoot,
      handleTakeLootItem,
      handleUnequip,
      handleUseActionBarSlot,
      handleUseItem,
    ],
  );

  const world = useMemo(
    () => ({
      onStartCombat: handleStartCombat,
      onInteract: handleInteract,
      onProspect: handleProspect,
      onSellAll: handleSellAll,
      onBuyTownItem: handleBuyTownItem,
      onClaimHex: handleClaimHex,
      onApplySelectedItemModification: handleApplySelectedItemModification,
      onClearSelectedItemModification: handleClearSelectedItemModification,
      onSelectItemModificationReforgeStat:
        handleSelectItemModificationReforgeStat,
      onToggleItemModificationPicker: toggleItemModificationPicker,
      onSetHome: handleSetHome,
    }),
    [
      handleApplySelectedItemModification,
      handleBuyTownItem,
      handleClaimHex,
      handleClearSelectedItemModification,
      handleInteract,
      handleProspect,
      handleSellAll,
      handleSelectItemModificationReforgeStat,
      handleSetHome,
      handleStartCombat,
      toggleItemModificationPicker,
    ],
  );

  const recipes = useMemo(
    () => ({
      onOpenWithMaterialFilter: handleOpenRecipeBookWithMaterialFilter,
      onClearMaterialFilter: handleClearRecipeMaterialFilter,
    }),
    [handleClearRecipeMaterialFilter, handleOpenRecipeBookWithMaterialFilter],
  );

  const logs = useMemo(
    () => ({
      onToggleFilterMenu: toggleFilterMenu,
      onToggleLogFilter: toggleLogFilter,
    }),
    [toggleFilterMenu, toggleLogFilter],
  );

  const settings = useMemo(
    () => ({
      onResetSaveArea: handleResetSaveArea,
      onSaveSettings: handleSaveSettings,
      onSaveSettingsAndReload: handleSaveSettingsAndReload,
    }),
    [handleResetSaveArea, handleSaveSettings, handleSaveSettingsAndReload],
  );

  return useMemo(
    () => ({
      windows,
      tooltip,
      inventory,
      world,
      recipes,
      logs,
      settings,
    }),
    [inventory, logs, recipes, settings, tooltip, windows, world],
  );
}
