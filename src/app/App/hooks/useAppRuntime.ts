import { useEffect } from 'react';
import { getCurrentTile } from '../../../game/stateSelectors';
import { useAppControllers } from '../useAppControllers';
import { useAppGameView } from '../useAppGameView';
import { useAppPersistence } from '../useAppPersistence';
import { useCombatAutomation } from '../useCombatAutomation';
import { usePixiWorld } from '../usePixiWorld';
import { useWindowTransitions } from '../useWindowTransitions';
import { setWorldClockTime } from '../worldClockStore';
import { useAppBootstrapState } from './useAppBootstrapState';
import { useAppLifecycle } from './useAppLifecycle';
import { useAppSettingsActions } from './useAppSettingsActions';
import { useAppShortcutRuntime } from './useAppShortcutRuntime';
import { useAppWindowRuntime } from './useAppWindowRuntime';
import { useCombatAttentionWindow } from './useCombatAttentionWindow';
import { useAppWorldClock } from './useAppWorldClock';

export function useAppRuntime() {
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
  const {
    actions: controllerActions,
    mutators: controllerMutators,
    state: controllerState,
  } = controllers;
  const worldClock = useAppWorldClock({
    initialWorldTimeMs: bootstrap.initialGame.worldTimeMs,
    lastDisplayedWorldSecondRef: bootstrap.lastDisplayedWorldSecondRef,
    paused: bootstrap.paused,
    setGame: bootstrap.setGame,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    worldTimeTickRef: bootstrap.worldTimeTickRef,
  });
  const gameView = useAppGameView({
    bloodMoonActive: bootstrap.game.bloodMoonActive,
    combat: bootstrap.game.combat,
    enemies: bootstrap.game.enemies,
    hexItemModificationPickerActive:
      controllerState.hexItemModificationPickerActive,
    homeHex: bootstrap.game.homeHex,
    logFilters: controllerState.logFilters,
    logs: bootstrap.game.logs,
    player: bootstrap.game.player,
    seed: bootstrap.game.seed,
    selectedHexItemModificationItem:
      controllerState.selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex:
      controllerState.selectedHexItemReforgeStatIndex,
    tiles: bootstrap.game.tiles,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });
  const persistence = useAppPersistence({
    game: bootstrap.game,
    gameRef: bootstrap.gameRef,
    logFilters: controllerState.logFilters,
    actionBarSlots: controllerState.actionBarSlots,
    setGame: bootstrap.setGame,
    setActionBarSlots: controllerMutators.setActionBarSlots,
    setLogFilters: controllerMutators.setLogFilters,
    setWindows: controllerMutators.setWindows,
    setWindowShown: controllerMutators.setWindowShown,
    setWorldTimeMs: worldClock.setWorldTimeMs,
    windows: controllerState.windows,
    windowShown: controllerState.windowShown,
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
    setAudioSettings: controllerMutators.setAudioSettings,
    setGame: bootstrap.setGame,
    setGraphicsSettings: controllerMutators.setGraphicsSettings,
    uiAudio: bootstrap.uiAudio,
  });
  const pixiWorld = usePixiWorld({
    enabled: persistence.hydrated,
    game: bootstrap.game,
    graphicsSettings: controllerState.graphicsSettings,
    paused: bootstrap.paused,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    gameRef: bootstrap.gameRef,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    setGame: bootstrap.setGame,
    setTooltip: controllerMutators.setTooltip,
  });
  const isReady = persistence.hydrated && pixiWorld.canvasReady;

  useEffect(() => {
    setWorldClockTime(bootstrap.game.worldTimeMs);
  }, [bootstrap.game.worldTimeMs]);

  useCombatAttentionWindow({
    combat: bootstrap.game.combat,
    hydrated: persistence.hydrated,
    playerCoord: bootstrap.game.player.coord,
    setWindowVisibility: controllerMutators.setWindowVisibility,
    windowShownHexInfo: controllerState.windowShown.hexInfo,
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

  useAppShortcutRuntime({
    canBulkProspectEquipment: gameView.canBulkProspectEquipment,
    canBulkSellEquipment: gameView.canBulkSellEquipment,
    canHealTerritoryNpc: gameView.territoryNpcHealStatus.canHeal,
    canTerritoryAction: gameView.claimStatus.canClaim,
    combat: bootstrap.game.combat,
    currentTileClaim: gameView.currentTile.claim,
    currentTileItemsLength: gameView.currentTile.items.length,
    hexContentWindowShown: controllerState.windowShown.hexInfo,
    homeHex: bootstrap.game.homeHex,
    interactLabel: gameView.interactLabel,
    onForfeitCombat: controllerActions.handleForfeitCombat,
    onStartCombat: controllerActions.handleStartCombat,
    onInteract: controllerActions.handleInteract,
    onHealTerritoryNpc: controllerActions.handleHealTerritoryNpc,
    onSetHome: settingsActions.handleSetHome,
    onTerritoryAction: controllerActions.handleClaimHex,
    onTakeAllLoot: controllerActions.handleTakeAllLoot,
    onCloseAllWindows: controllerActions.closeAllWindows,
    onProspect: controllerActions.handleProspect,
    onSellAll: controllerActions.handleSellAll,
    onToggleDockWindow: controllerActions.toggleDockWindow,
    onUseActionBarSlot: controllerActions.handleUseActionBarSlot,
    playerCoord: bootstrap.game.player.coord,
    setPaused: bootstrap.setPaused,
    uiAudio: bootstrap.uiAudio,
    windowShown: controllerState.windowShown,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });

  const windowsProps = useAppWindowRuntime({
    actions: {
      closeItemMenu: controllerActions.closeItemMenu,
      closeTooltip: controllerActions.closeTooltip,
      handleActivateInventoryItem:
        controllerActions.handleActivateInventoryItem,
      handleAssignActionBarSlot: controllerActions.handleAssignActionBarSlot,
      handleBuyTownItem: controllerActions.handleBuyTownItem,
      handleClaimHex: controllerActions.handleClaimHex,
      handleHealTerritoryNpc: controllerActions.handleHealTerritoryNpc,
      handleClearActionBarSlot: controllerActions.handleClearActionBarSlot,
      handleClearRecipeMaterialFilter:
        controllerActions.handleClearRecipeMaterialFilter,
      handleContextItem: controllerActions.handleContextItem,
      handleCraftRecipe: controllerActions.handleCraftRecipe,
      handleCorruptItem: controllerActions.handleCorruptItem,
      handleSelectHexItemModificationItem:
        controllerActions.handleSelectHexModificationInventoryItem,
      handleDropEquippedItem: controllerActions.handleDropEquippedItem,
      handleDropItem: controllerActions.handleDropItem,
      handleEnchantItem: controllerActions.handleEnchantItem,
      handleEquipmentHover: controllerActions.handleEquipmentHover,
      handleEquipItem: controllerActions.handleEquipItem,
      handleEquippedContextItem: controllerActions.handleEquippedContextItem,
      handleForfeitCombat: controllerActions.handleForfeitCombat,
      handleInteract: controllerActions.handleInteract,
      handleOpenRecipeBookWithMaterialFilter:
        controllerActions.handleOpenRecipeBookWithMaterialFilter,
      handleProspect: controllerActions.handleProspect,
      handleProspectItem: controllerActions.handleProspectItem,
      handleReforgeItem: controllerActions.handleReforgeItem,
      handleResetSaveArea: settingsActions.handleResetSaveArea,
      handleSaveSettings: settingsActions.handleSaveSettings,
      handleSaveSettingsAndReload: settingsActions.handleSaveSettingsAndReload,
      handleSellAll: controllerActions.handleSellAll,
      handleSellItem: controllerActions.handleSellItem,
      handleApplySelectedItemModification:
        controllerActions.applySelectedItemModification,
      handleClearSelectedItemModification: controllerActions.clearSelectedItem,
      handleSelectItemModificationReforgeStat:
        controllerMutators.setSelectedHexItemReforgeStatIndex,
      handleSetHome: settingsActions.handleSetHome,
      handleSetItemLocked: controllerActions.handleSetItemLocked,
      handleSort: controllerActions.handleSort,
      handleStartCombat: controllerActions.handleStartCombat,
      handleTakeAllLoot: controllerActions.handleTakeAllLoot,
      handleTakeLootItem: controllerActions.handleTakeLootItem,
      handleUnequip: controllerActions.handleUnequip,
      handleUseActionBarSlot: controllerActions.handleUseActionBarSlot,
      handleUseItem: controllerActions.handleUseItem,
      moveWindow: controllerMutators.moveWindow,
      setWindowVisibility: controllerMutators.setWindowVisibility,
      showActionBarItemTooltip: controllerActions.showActionBarItemTooltip,
      showItemTooltip: controllerActions.showItemTooltip,
      showTooltip: controllerActions.showTooltip,
      toggleItemModificationPicker:
        controllerActions.toggleHexItemModificationPicker,
      toggleDockWindow: controllerActions.toggleDockWindow,
      toggleFilterMenu: controllerActions.toggleFilterMenu,
      toggleLogFilter: controllerActions.toggleLogFilter,
    },
    appReady: isReady,
    keepLootWindowMounted: windowTransitions.keepLootWindowMounted,
    keepCombatWindowMounted: windowTransitions.keepCombatWindowMounted,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    views: {
      actionBarSlots: controllerState.actionBarSlots,
      audioSettings: controllerState.audioSettings,
      combatState: bootstrap.game.combat,
      combatSnapshot: windowTransitions.combatSnapshot,
      combatWindowVisible: windowTransitions.combatWindowVisible,
      currentTile: gameView.currentTile,
      currentTileHostileEnemyCount: gameView.currentTileHostileEnemyCount,
      gold: gameView.gold,
      graphicsSettings: controllerState.graphicsSettings,
      homeHex: bootstrap.game.homeHex,
      inventoryCountsByItemKey: gameView.inventoryCountsByItemKey,
      itemModification: gameView.itemModification,
      itemMenu: controllerState.itemMenu,
      claimStatus: gameView.claimStatus,
      territoryNpcHealStatus: gameView.territoryNpcHealStatus,
      interactLabel: gameView.interactLabel,
      filteredLogs: gameView.filteredLogs,
      logFilters: controllerState.logFilters,
      playerSlice: bootstrap.game.player,
      tileLootSnapshot: windowTransitions.tileLootSnapshot,
      lootWindowVisible: windowTransitions.lootWindowVisible,
      canBulkProspectEquipment: gameView.canBulkProspectEquipment,
      canBulkSellEquipment: gameView.canBulkSellEquipment,
      bulkProspectEquipmentExplanation:
        gameView.bulkProspectEquipmentExplanation,
      recipes: gameView.recipes,
      recipeMaterialFilterItemKey: controllerState.recipeMaterialFilterItemKey,
      recipeSkillLevels: gameView.recipeSkillLevels,
      bulkSellEquipmentExplanation: gameView.bulkSellEquipmentExplanation,
      showFilterMenu: controllerState.showFilterMenu,
      heroOverview: gameView.heroOverview,
      townStock: gameView.townStock,
      worldTimeMs: bootstrap.game.worldTimeMs,
    },
    windows: controllerState.windows,
    windowShown: controllerState.windowShown,
  });

  return {
    audioSettings: controllerState.audioSettings,
    backgroundMusicMood: gameView.backgroundMusicMood,
    claimedHex: gameView.firstClaimedHex,
    game: bootstrap.game,
    hostRef: pixiWorld.hostRef,
    isReady,
    pixiWorldError: pixiWorld.canvasError,
    paused: bootstrap.paused,
    uiAudio: bootstrap.uiAudio,
    windowsProps,
    onRetryPixiWorld: pixiWorld.retryCanvas,
    onUiAudioChange: bootstrap.setUiAudio,
  };
}
