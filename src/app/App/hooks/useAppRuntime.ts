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
import { useCombatAttentionWindow } from './useCombatAttentionWindow';
import { useAppShortcutBindings } from './useAppShortcutBindings';
import { useAppSettingsActions } from './useAppSettingsActions';
import { useAppWindowActions } from './useAppWindowActions';
import { useAppWindowViews } from './useAppWindowViews';
import { useAppWindowsProps } from './useAppWindowsProps';
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

  useEffect(() => {
    setWorldClockTime(bootstrap.game.worldTimeMs);
  }, [bootstrap.game.worldTimeMs]);

  useCombatAttentionWindow({
    combat: bootstrap.game.combat,
    hydrated: persistence.hydrated,
    playerCoord: bootstrap.game.player.coord,
    setWindowVisibility: controllers.setWindowVisibility,
    windowShownHexInfo: controllers.windowShown.hexInfo,
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
    (!gameView.currentTile.claim ||
      gameView.currentTile.claim.ownerType === 'player') &&
    (bootstrap.game.homeHex.q !== bootstrap.game.player.coord.q ||
      bootstrap.game.homeHex.r !== bootstrap.game.player.coord.r);

  useAppShortcutBindings({
    canBulkProspectEquipment: gameView.canBulkProspectEquipment,
    canBulkSellEquipment: gameView.canBulkSellEquipment,
    canHealTerritoryNpc: gameView.territoryNpcHealStatus.canHeal,
    canSetHomeAction,
    canTerritoryAction: gameView.claimStatus.canClaim,
    combat: bootstrap.game.combat,
    currentTileItemsLength: gameView.currentTile.items.length,
    hexContentWindowShown: controllers.windowShown.hexInfo,
    interactLabel: gameView.interactLabel,
    onForfeitCombat: controllers.handleForfeitCombat,
    onStartCombat: controllers.handleStartCombat,
    onInteract: controllers.handleInteract,
    onHealTerritoryNpc: controllers.handleHealTerritoryNpc,
    onSetHome: settingsActions.handleSetHome,
    onTerritoryAction: controllers.handleClaimHex,
    onTakeAllLoot: controllers.handleTakeAllLoot,
    onCloseAllWindows: controllers.closeAllWindows,
    onProspect: controllers.handleProspect,
    onSellAll: controllers.handleSellAll,
    onToggleDockWindow: controllers.toggleDockWindow,
    onUseActionBarSlot: controllers.handleUseActionBarSlot,
    setPaused: bootstrap.setPaused,
    uiAudio: bootstrap.uiAudio,
    windowShown: controllers.windowShown,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });

  const views = useAppWindowViews({
    actionBarSlots: controllers.actionBarSlots,
    audioSettings: controllers.audioSettings,
    combatState: bootstrap.game.combat,
    combatSnapshot: windowTransitions.combatSnapshot,
    combatWindowVisible: windowTransitions.combatWindowVisible,
    currentTile: gameView.currentTile,
    currentTileHostileEnemyCount: gameView.currentTileHostileEnemyCount,
    gold: gameView.gold,
    graphicsSettings: controllers.graphicsSettings,
    homeHex: bootstrap.game.homeHex,
    inventoryCountsByItemKey: gameView.inventoryCountsByItemKey,
    itemModification: gameView.itemModification,
    itemMenu: controllers.itemMenu,
    claimStatus: gameView.claimStatus,
    territoryNpcHealStatus: gameView.territoryNpcHealStatus,
    interactLabel: gameView.interactLabel,
    filteredLogs: gameView.filteredLogs,
    logFilters: controllers.logFilters,
    playerSlice: bootstrap.game.player,
    tileLootSnapshot: windowTransitions.tileLootSnapshot,
    lootWindowVisible: windowTransitions.lootWindowVisible,
    canBulkProspectEquipment: gameView.canBulkProspectEquipment,
    canBulkSellEquipment: gameView.canBulkSellEquipment,
    bulkProspectEquipmentExplanation:
      gameView.bulkProspectEquipmentExplanation,
    recipes: gameView.recipes,
    recipeMaterialFilterItemKey: controllers.recipeMaterialFilterItemKey,
    recipeSkillLevels: gameView.recipeSkillLevels,
    bulkSellEquipmentExplanation: gameView.bulkSellEquipmentExplanation,
    showFilterMenu: controllers.showFilterMenu,
    heroOverview: gameView.heroOverview,
    townStock: gameView.townStock,
    worldTimeMs: bootstrap.game.worldTimeMs,
  });
  const actions = useAppWindowActions({
    closeItemMenu: controllers.closeItemMenu,
    closeTooltip: controllers.closeTooltip,
    handleActivateInventoryItem: controllers.handleActivateInventoryItem,
    handleAssignActionBarSlot: controllers.handleAssignActionBarSlot,
    handleBuyTownItem: controllers.handleBuyTownItem,
    handleClaimHex: controllers.handleClaimHex,
    handleHealTerritoryNpc: controllers.handleHealTerritoryNpc,
    handleClearActionBarSlot: controllers.handleClearActionBarSlot,
    handleClearRecipeMaterialFilter:
      controllers.handleClearRecipeMaterialFilter,
    handleContextItem: controllers.handleContextItem,
    handleCraftRecipe: controllers.handleCraftRecipe,
    handleCorruptItem: controllers.handleCorruptItem,
    handleSelectHexItemModificationItem:
      controllers.handleSelectHexModificationInventoryItem,
    handleDropEquippedItem: controllers.handleDropEquippedItem,
    handleDropItem: controllers.handleDropItem,
    handleEnchantItem: controllers.handleEnchantItem,
    handleEquipmentHover: controllers.handleEquipmentHover,
    handleEquipItem: controllers.handleEquipItem,
    handleEquippedContextItem: controllers.handleEquippedContextItem,
    handleForfeitCombat: controllers.handleForfeitCombat,
    handleInteract: controllers.handleInteract,
    handleOpenRecipeBookWithMaterialFilter:
      controllers.handleOpenRecipeBookWithMaterialFilter,
    handleProspect: controllers.handleProspect,
    handleProspectItem: controllers.handleProspectItem,
    handleReforgeItem: controllers.handleReforgeItem,
    handleResetSaveArea: settingsActions.handleResetSaveArea,
    handleSaveSettings: settingsActions.handleSaveSettings,
    handleSaveSettingsAndReload: settingsActions.handleSaveSettingsAndReload,
    handleSellAll: controllers.handleSellAll,
    handleSellItem: controllers.handleSellItem,
    handleApplySelectedItemModification:
      controllers.applySelectedItemModification,
    handleClearSelectedItemModification: controllers.clearSelectedItem,
    handleSelectItemModificationReforgeStat:
      controllers.setSelectedHexItemReforgeStatIndex,
    handleSetHome: settingsActions.handleSetHome,
    handleSetItemLocked: controllers.handleSetItemLocked,
    handleSort: controllers.handleSort,
    handleStartCombat: controllers.handleStartCombat,
    handleTakeAllLoot: controllers.handleTakeAllLoot,
    handleTakeLootItem: controllers.handleTakeLootItem,
    handleUnequip: controllers.handleUnequip,
    handleUseActionBarSlot: controllers.handleUseActionBarSlot,
    handleUseItem: controllers.handleUseItem,
    moveWindow: controllers.moveWindow,
    setWindowVisibility: controllers.setWindowVisibility,
    showActionBarItemTooltip: controllers.showActionBarItemTooltip,
    showItemTooltip: controllers.showItemTooltip,
    showTooltip: controllers.showTooltip,
    toggleItemModificationPicker: controllers.toggleHexItemModificationPicker,
    toggleDockWindow: controllers.toggleDockWindow,
    toggleFilterMenu: controllers.toggleFilterMenu,
    toggleLogFilter: controllers.toggleLogFilter,
  });

  const windowsProps = useAppWindowsProps({
    appReady: isReady,
    windows: controllers.windows,
    windowShown: controllers.windowShown,
    keepLootWindowMounted: windowTransitions.keepLootWindowMounted,
    keepCombatWindowMounted: windowTransitions.keepCombatWindowMounted,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    views,
    actions,
  });

  return {
    audioSettings: controllers.audioSettings,
    backgroundMusicMood: gameView.backgroundMusicMood,
    claimedHex: gameView.firstClaimedHex,
    game: bootstrap.game,
    hostRef: pixiWorld.hostRef,
    isReady,
    paused: bootstrap.paused,
    uiAudio: bootstrap.uiAudio,
    windowsProps,
    onUiAudioChange: bootstrap.setUiAudio,
  };
}
