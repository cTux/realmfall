import { useMemo } from 'react';
import type { AppWindowsActions } from '../AppWindows.types';

interface UseAppWindowActionsArgs {
  closeItemMenu: AppWindowsActions['tooltip']['onCloseItemMenu'];
  closeTooltip: AppWindowsActions['tooltip']['onCloseTooltip'];
  handleActivateInventoryItem: AppWindowsActions['inventory']['onActivateItem'];
  handleAssignActionBarSlot: AppWindowsActions['inventory']['onAssignActionBarSlot'];
  handleBuyTownItem: AppWindowsActions['hex']['onBuyTownItem'];
  handleBuildOutpost: AppWindowsActions['hex']['onBuildOutpost'];
  handleClaimHex: AppWindowsActions['hex']['onClaimHex'];
  handleCreateDebugDropItem: AppWindowsActions['debug']['onCreateDropItem'];
  handleCreateDebugEquipmentItem: AppWindowsActions['debug']['onCreateEquipmentItem'];
  handleHealTerritoryNpc: AppWindowsActions['hex']['onHealTerritoryNpc'];
  handleClearActionBarSlot: AppWindowsActions['inventory']['onClearActionBarSlot'];
  handleClearRecipeMaterialFilter: AppWindowsActions['recipes']['onClearMaterialFilter'];
  handleContextItem: AppWindowsActions['inventory']['onContextItem'];
  handleCraftRecipe: AppWindowsActions['inventory']['onCraftRecipe'];
  handleDropEquippedItem: AppWindowsActions['inventory']['onDropEquippedItem'];
  handleDropItem: AppWindowsActions['inventory']['onDropItem'];
  handleEnchantItem: AppWindowsActions['inventory']['onEnchantItem'];
  handleForfeitCombat: AppWindowsActions['hex']['onForfeitCombat'];
  handleSelectHexItemModificationItem: AppWindowsActions['inventory']['onSelectHexItemModificationItem'];
  handleEquipmentHover: AppWindowsActions['tooltip']['onEquipmentHover'];
  handleEquipItem: AppWindowsActions['inventory']['onEquipItem'];
  handleEquippedContextItem: AppWindowsActions['inventory']['onEquippedContextItem'];
  handleInteract: AppWindowsActions['hex']['onInteract'];
  handleOpenRecipeBookWithMaterialFilter: AppWindowsActions['recipes']['onOpenWithMaterialFilter'];
  handleToggleFavoriteRecipe: AppWindowsActions['recipes']['onToggleFavoriteRecipe'];
  handleCorruptItem: AppWindowsActions['inventory']['onCorruptItem'];
  handleProspect: AppWindowsActions['hex']['onProspect'];
  handleProspectItem: AppWindowsActions['inventory']['onProspectItem'];
  handleReforgeItem: AppWindowsActions['inventory']['onReforgeItem'];
  handleResetSaveArea: AppWindowsActions['settings']['onResetSaveArea'];
  handleSetDebugMorning: AppWindowsActions['debug']['onSetMorning'];
  handleSetDebugNight: AppWindowsActions['debug']['onSetNight'];
  handleSaveSettings: AppWindowsActions['settings']['onSaveSettings'];
  handleSaveSettingsAndReload: AppWindowsActions['settings']['onSaveSettingsAndReload'];
  handleSellAll: AppWindowsActions['hex']['onSellAll'];
  handleSellItem: AppWindowsActions['inventory']['onSellItem'];
  handleSpawnDebugEnemyNearby: AppWindowsActions['debug']['onSpawnEnemyNearby'];
  handleApplySelectedItemModification: AppWindowsActions['hex']['onApplySelectedItemModification'];
  handleClearSelectedItemModification: AppWindowsActions['hex']['onClearSelectedItemModification'];
  handleSelectItemModificationReforgeStat: AppWindowsActions['hex']['onSelectItemModificationReforgeStat'];
  handleSetHome: AppWindowsActions['hex']['onSetHome'];
  handleSetItemLocked: AppWindowsActions['inventory']['onSetItemLocked'];
  handleSort: AppWindowsActions['inventory']['onSort'];
  handleTakeAllLoot: AppWindowsActions['inventory']['onTakeAllLoot'];
  handleTakeLootItem: AppWindowsActions['inventory']['onTakeLootItem'];
  handleTriggerDebugBloodMoon: AppWindowsActions['debug']['onTriggerBloodMoon'];
  handleTriggerDebugEarthquake: AppWindowsActions['debug']['onTriggerEarthquake'];
  handleTriggerDebugHarvestMoon: AppWindowsActions['debug']['onTriggerHarvestMoon'];
  handleUnequip: AppWindowsActions['inventory']['onUnequip'];
  handleUseActionBarSlot: AppWindowsActions['inventory']['onUseActionBarSlot'];
  handleUseItem: AppWindowsActions['inventory']['onUseItem'];
  moveWindow: AppWindowsActions['windows']['onMoveWindow'];
  setWindowVisibility: AppWindowsActions['windows']['onSetWindowVisibility'];
  showActionBarItemTooltip: AppWindowsActions['tooltip']['onShowActionBarItemTooltip'];
  showItemTooltip: AppWindowsActions['tooltip']['onShowItemTooltip'];
  showTooltip: AppWindowsActions['tooltip']['onShowTooltip'];
  toggleItemModificationPicker: AppWindowsActions['hex']['onToggleItemModificationPicker'];
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
  handleBuildOutpost,
  handleClaimHex,
  handleCreateDebugDropItem,
  handleCreateDebugEquipmentItem,
  handleHealTerritoryNpc,
  handleClearActionBarSlot,
  handleClearRecipeMaterialFilter,
  handleContextItem,
  handleCraftRecipe,
  handleDropEquippedItem,
  handleDropItem,
  handleEnchantItem,
  handleForfeitCombat,
  handleSelectHexItemModificationItem,
  handleEquipmentHover,
  handleEquipItem,
  handleEquippedContextItem,
  handleInteract,
  handleOpenRecipeBookWithMaterialFilter,
  handleToggleFavoriteRecipe,
  handleCorruptItem,
  handleProspect,
  handleProspectItem,
  handleReforgeItem,
  handleResetSaveArea,
  handleSetDebugMorning,
  handleSetDebugNight,
  handleSaveSettings,
  handleSaveSettingsAndReload,
  handleSellAll,
  handleSellItem,
  handleSpawnDebugEnemyNearby,
  handleApplySelectedItemModification,
  handleClearSelectedItemModification,
  handleSelectItemModificationReforgeStat,
  handleSetHome,
  handleSetItemLocked,
  handleSort,
  handleTakeAllLoot,
  handleTakeLootItem,
  handleTriggerDebugBloodMoon,
  handleTriggerDebugEarthquake,
  handleTriggerDebugHarvestMoon,
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

  const hex = useMemo(
    () => ({
      onForfeitCombat: handleForfeitCombat,
      onInteract: handleInteract,
      onProspect: handleProspect,
      onSellAll: handleSellAll,
      onBuyTownItem: handleBuyTownItem,
      onBuildOutpost: handleBuildOutpost,
      onClaimHex: handleClaimHex,
      onHealTerritoryNpc: handleHealTerritoryNpc,
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
      handleBuildOutpost,
      handleClaimHex,
      handleHealTerritoryNpc,
      handleClearSelectedItemModification,
      handleForfeitCombat,
      handleInteract,
      handleProspect,
      handleSellAll,
      handleSelectItemModificationReforgeStat,
      handleSetHome,
      toggleItemModificationPicker,
    ],
  );

  const recipes = useMemo(
    () => ({
      onOpenWithMaterialFilter: handleOpenRecipeBookWithMaterialFilter,
      onClearMaterialFilter: handleClearRecipeMaterialFilter,
      onToggleFavoriteRecipe: handleToggleFavoriteRecipe,
    }),
    [
      handleClearRecipeMaterialFilter,
      handleOpenRecipeBookWithMaterialFilter,
      handleToggleFavoriteRecipe,
    ],
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

  const debug = useMemo(
    () => ({
      onCreateEquipmentItem: handleCreateDebugEquipmentItem,
      onCreateDropItem: handleCreateDebugDropItem,
      onSpawnEnemyNearby: handleSpawnDebugEnemyNearby,
      onTriggerBloodMoon: handleTriggerDebugBloodMoon,
      onTriggerHarvestMoon: handleTriggerDebugHarvestMoon,
      onTriggerEarthquake: handleTriggerDebugEarthquake,
      onSetMorning: handleSetDebugMorning,
      onSetNight: handleSetDebugNight,
    }),
    [
      handleCreateDebugDropItem,
      handleCreateDebugEquipmentItem,
      handleSetDebugMorning,
      handleSetDebugNight,
      handleSpawnDebugEnemyNearby,
      handleTriggerDebugBloodMoon,
      handleTriggerDebugEarthquake,
      handleTriggerDebugHarvestMoon,
    ],
  );

  return useMemo(
    () => ({
      windows,
      tooltip,
      inventory,
      hex,
      recipes,
      logs,
      settings,
      debug,
    }),
    [debug, hex, inventory, logs, recipes, settings, tooltip, windows],
  );
}
