import { useEffect } from 'react';
import { getCurrentTile } from '../../game/stateSelectors';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { AppShell } from './components/AppShell';
import { useAppBootstrapState } from './hooks/useAppBootstrapState';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useCombatAttentionWindow } from './hooks/useCombatAttentionWindow';
import { useAppShortcutBindings } from './hooks/useAppShortcutBindings';
import { useAppSettingsActions } from './hooks/useAppSettingsActions';
import { useAppWindowActions } from './hooks/useAppWindowActions';
import { useAppWindowViews } from './hooks/useAppWindowViews';
import { useAppWindowsProps } from './hooks/useAppWindowsProps';
import { useAppWorldClock } from './hooks/useAppWorldClock';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { setWorldClockTime } from './worldClockStore';

export function App() {
  const bootstrap = useAppBootstrapState();
  const controllers = useAppControllers({
    currentStructure: getCurrentTile(bootstrap.game).structure,
    equipment: bootstrap.game.player.equipment,
    inventory: bootstrap.game.player.inventory,
    gameRef: bootstrap.gameRef,
    initialAudioSettings: bootstrap.initialAudioSettings,
    initialGraphicsSettings: bootstrap.initialGraphicsSettings,
    paused: bootstrap.paused,
    setGame: bootstrap.setGame,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
  });
  const worldClock = useAppWorldClock({
    initialWorldTimeMs: bootstrap.initialGame.worldTimeMs,
    lastDisplayedWorldSecondRef: bootstrap.lastDisplayedWorldSecondRef,
    paused: bootstrap.paused,
    setGame: bootstrap.setGame,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    worldTimeTickRef: bootstrap.worldTimeTickRef,
  });
  const gameView = useAppGameView({
    game: bootstrap.game,
    hexItemModificationPickerActive: controllers.hexItemModificationPickerActive,
    logFilters: controllers.logFilters,
    selectedHexItemModificationItem:
      controllers.selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex:
      controllers.selectedHexItemReforgeStatIndex,
  });
  const persistence = useAppPersistence({
    game: bootstrap.game,
    gameRef: bootstrap.gameRef,
    logFilters: controllers.logFilters,
    actionBarSlots: controllers.actionBarSlots,
    setGame: bootstrap.setGame,
    setActionBarSlots: controllers.setActionBarSlots,
    setLogFilters: controllers.setLogFilters,
    setWindows: controllers.setWindows,
    setWindowShown: controllers.setWindowShown,
    setWorldTimeMs: worldClock.setWorldTimeMs,
    windows: controllers.windows,
    windowShown: controllers.windowShown,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    worldTimeTickRef: bootstrap.worldTimeTickRef,
    lastDisplayedWorldSecondRef: bootstrap.lastDisplayedWorldSecondRef,
  });
  const windowTransitions = useWindowTransitions({
    combat: bootstrap.game.combat,
    combatEnemies: gameView.combatEnemies,
    currentTile: gameView.currentTile,
  });
  const settingsActions = useAppSettingsActions({
    paused: bootstrap.paused,
    persistNow: persistence.persistNow,
    setAudioSettings: controllers.setAudioSettings,
    setGame: bootstrap.setGame,
    setGraphicsSettings: controllers.setGraphicsSettings,
    uiAudio: bootstrap.uiAudio,
  });
  const pixiWorld = usePixiWorld({
    enabled: persistence.hydrated,
    game: bootstrap.game,
    graphicsSettings: controllers.graphicsSettings,
    paused: bootstrap.paused,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    gameRef: bootstrap.gameRef,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    setGame: bootstrap.setGame,
    setTooltip: controllers.setTooltip,
  });
  const isReady = persistence.hydrated && pixiWorld.canvasReady;

  const {
    applySelectedItemModification,
    closeItemMenu,
    closeAllWindows,
    clearSelectedItem,
    closeTooltip,
    handleBuyTownItem,
    handleClaimHex,
    handleHealTerritoryNpc,
    handleContextItem,
    handleCraftRecipe,
    handleCorruptItem,
    handleDropEquippedItem,
    handleDropItem,
    handleEnchantItem,
    handleEquipmentHover,
    handleActivateInventoryItem,
    handleEquipItem,
    handleEquippedContextItem,
    handleForfeitCombat,
    handleInteract,
    handleProspect,
    handleProspectItem,
    handleReforgeItem,
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
    actionBarSlots,
    handleSelectHexModificationInventoryItem,
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    audioSettings,
    hexItemModificationPickerActive,
    graphicsSettings,
    itemMenu,
    logFilters,
    moveWindow,
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
    selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex,
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
  } = controllers;
  const {
    backgroundMusicMood,
    claimStatus,
    canBulkProspectEquipment,
    canBulkSellEquipment,
    combatEnemies,
    currentTile,
    currentTileHostileEnemyCount,
    firstClaimedHex,
    filteredLogs,
    gold,
    itemModification,
    interactLabel,
    inventoryCountsByItemKey,
    bulkProspectEquipmentExplanation,
    recipes,
    recipeSkillLevels,
    bulkSellEquipmentExplanation,
    heroOverview,
    townStock,
    territoryNpcHealStatus,
  } = gameView;
  const { hydrated, persistNow } = persistence;
  const {
    combatSnapshot,
    combatWindowVisible,
    keepCombatWindowMounted,
    keepLootWindowMounted,
    tileLootSnapshot,
    lootWindowVisible,
  } = windowTransitions;
  const {
    handleResetSaveArea,
    handleSaveSettings,
    handleSaveSettingsAndReload,
    handleSetHome,
  } = settingsActions;

  useEffect(() => {
    setWorldClockTime(bootstrap.game.worldTimeMs);
  }, [bootstrap.game.worldTimeMs]);

  useCombatAttentionWindow({
    combat: bootstrap.game.combat,
    hydrated,
    playerCoord: bootstrap.game.player.coord,
    setWindowVisibility,
    windowShownHexInfo: windowShown.hexInfo,
  });

  useAppLifecycle({
    game: bootstrap.game,
    gameRef: bootstrap.gameRef,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
  });

  useCombatAutomation({
    combat: bootstrap.game.combat,
    enemyLookup: bootstrap.game.enemies,
    paused: bootstrap.paused,
    playerStatusEffects: bootstrap.game.player.statusEffects,
    setGame: bootstrap.setGame,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
  });

  const canSetHomeAction =
    (!currentTile.claim || currentTile.claim.ownerType === 'player') &&
    (bootstrap.game.homeHex.q !== bootstrap.game.player.coord.q ||
      bootstrap.game.homeHex.r !== bootstrap.game.player.coord.r);

  useAppShortcutBindings({
    canBulkProspectEquipment,
    canBulkSellEquipment,
    canHealTerritoryNpc: territoryNpcHealStatus.canHeal,
    canSetHomeAction,
    canTerritoryAction: claimStatus.canClaim,
    combat: bootstrap.game.combat,
    currentTileItemsLength: currentTile.items.length,
    hexContentWindowShown: windowShown.hexInfo,
    interactLabel,
    onForfeitCombat: handleForfeitCombat,
    onStartCombat: handleStartCombat,
    onInteract: handleInteract,
    onHealTerritoryNpc: handleHealTerritoryNpc,
    onSetHome: handleSetHome,
    onTerritoryAction: handleClaimHex,
    onTakeAllLoot: handleTakeAllLoot,
    onCloseAllWindows: closeAllWindows,
    onProspect: handleProspect,
    onSellAll: handleSellAll,
    onToggleDockWindow: toggleDockWindow,
    onUseActionBarSlot: handleUseActionBarSlot,
    setPaused: bootstrap.setPaused,
    uiAudio: bootstrap.uiAudio,
    windowShown,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });

  const appWindowViews = useAppWindowViews({
    actionBarSlots,
    audioSettings,
    combatState: bootstrap.game.combat,
    combatSnapshot,
    combatWindowVisible,
    currentTile,
    currentTileHostileEnemyCount,
    gold,
    graphicsSettings,
    homeHex: bootstrap.game.homeHex,
    inventoryCountsByItemKey,
    itemModification,
    itemMenu,
    claimStatus,
    territoryNpcHealStatus,
    interactLabel,
    filteredLogs,
    logFilters,
    playerSlice: bootstrap.game.player,
    tileLootSnapshot,
    lootWindowVisible,
    canBulkProspectEquipment,
    canBulkSellEquipment,
    bulkProspectEquipmentExplanation,
    recipes,
    recipeMaterialFilterItemKey,
    recipeSkillLevels,
    bulkSellEquipmentExplanation,
    showFilterMenu,
    heroOverview,
    townStock,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });
  const appWindowActions = useAppWindowActions({
    closeItemMenu,
    closeTooltip,
    handleActivateInventoryItem,
    handleAssignActionBarSlot,
    handleBuyTownItem,
    handleClaimHex,
    handleHealTerritoryNpc,
    handleClearActionBarSlot,
    handleClearRecipeMaterialFilter,
    handleContextItem,
    handleCraftRecipe,
    handleCorruptItem,
    handleSelectHexItemModificationItem:
      handleSelectHexModificationInventoryItem,
    handleDropEquippedItem,
    handleDropItem,
    handleEnchantItem,
    handleEquipmentHover,
    handleEquipItem,
    handleEquippedContextItem,
    handleForfeitCombat,
    handleInteract,
    handleOpenRecipeBookWithMaterialFilter,
    handleProspect,
    handleProspectItem,
    handleReforgeItem,
    handleResetSaveArea,
    handleSaveSettings,
    handleSaveSettingsAndReload,
    handleSellAll,
    handleSellItem,
    handleApplySelectedItemModification: applySelectedItemModification,
    handleClearSelectedItemModification: clearSelectedItem,
    handleSelectItemModificationReforgeStat: setSelectedHexItemReforgeStatIndex,
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
    toggleItemModificationPicker: toggleHexItemModificationPicker,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
  });

  const appWindowsProps = useAppWindowsProps({
    appReady: isReady,
    windows,
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
    tooltipPositionRef,
    views: appWindowViews,
    actions: appWindowActions,
  });

  return (
    <AppShell
      audioSettings={audioSettings}
      backgroundMusicMood={backgroundMusicMood}
      claimedHex={firstClaimedHex}
      game={bootstrap.game}
      hostRef={pixiWorld.hostRef}
      isReady={isReady}
      paused={bootstrap.paused}
      uiAudio={bootstrap.uiAudio}
      windowsProps={appWindowsProps}
      onUiAudioChange={bootstrap.setUiAudio}
    />
  );
}
