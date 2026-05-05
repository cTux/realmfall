import { useCallback, useEffect, useMemo } from 'react';
import { getWorldDayIndex } from '../../../game/logs';
import { getResolvedCurrentTile } from '../../../game/stateSelectors';
import { useAppControllers } from '../useAppControllers';
import { getHexInteractActionLabel, useAppGameView } from '../useAppGameView';
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
import { useCraftingRecipeBookPromotion } from './useCraftingRecipeBookPromotion';
import { useGameplayAutomation } from './useGameplayAutomation';
import { useDungeonTransitionController } from './useDungeonTransitionController';
import { useHexInfoWindowPromotion } from './useHexInfoWindowPromotion';

export function useAppRuntime() {
  const bootstrap = useAppBootstrapState();
  const resolvedCurrentTile = getResolvedCurrentTile(bootstrap.game);
  const controllers = useAppControllers({
    currentStructure: resolvedCurrentTile?.structure,
    equipment: bootstrap.game.player.equipment,
    inventory: bootstrap.game.player.inventory,
    gameRef: bootstrap.gameRef,
    initialAudioSettings: bootstrap.initialAudioSettings,
    initialGameplaySettings: bootstrap.initialGameplaySettings,
    initialGraphicsSettings: bootstrap.initialGraphicsSettings,
    initialInterfaceSettings: bootstrap.initialInterfaceSettings,
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
    activeWorldId: bootstrap.game.activeWorldId,
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
    worlds: bootstrap.game.worlds,
    worldDayIndex: getWorldDayIndex(bootstrap.game.worldTimeMs),
  });
  const dungeonTransition = useDungeonTransitionController({
    gameRef: bootstrap.gameRef,
    interactAction: gameView.interactAction,
    setGame: bootstrap.setGame,
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
  const settingsActions = useAppSettingsActions({
    paused: bootstrap.paused,
    persistNow: persistence.persistNow,
    setAudioSettings: controllerMutators.setAudioSettings,
    setGame: bootstrap.setGame,
    setGameplaySettings: controllerMutators.setGameplaySettings,
    setGraphicsSettings: controllerMutators.setGraphicsSettings,
    setInterfaceSettings: controllerMutators.setInterfaceSettings,
    uiAudio: bootstrap.uiAudio,
  });
  const pixiWorld = usePixiWorld({
    enabled: persistence.hydrated,
    game: bootstrap.game,
    graphicsSettings: controllerState.graphicsSettings,
    interactionBlocked:
      dungeonTransition.hasTransitionError ||
      dungeonTransition.transitionActive,
    paused: bootstrap.paused,
    showTooltipTags: controllerState.interfaceSettings.showTooltipTags,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
    gameRef: bootstrap.gameRef,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    setGame: bootstrap.setGame,
    setTooltip: controllerMutators.setTooltip,
  });
  useGameplayAutomation({
    combat: bootstrap.game.combat,
    currentTile: gameView.currentTile,
    enabled: persistence.hydrated,
    gameplaySettings: controllerState.gameplaySettings,
    paused: bootstrap.paused,
    setGame: bootstrap.setGame,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
  });
  const windowTransitions = useWindowTransitions({
    combat: bootstrap.game.combat,
    combatEnemies: gameView.combatEnemies,
    currentTile: gameView.currentTile,
    suppressLootAutoOpen: pixiWorld.queuedTravelAutoOpenSuppressed,
  });
  const interactLabel = useMemo(
    () =>
      getHexInteractActionLabel({
        interactAction: gameView.interactAction,
      }),
    [gameView.interactAction],
  );
  const handleInteract = useCallback(() => {
    if (bootstrap.paused) {
      return;
    }

    if (dungeonTransition.tryHandleInteract()) {
      return;
    }

    controllerActions.handleInteract();
  }, [bootstrap.paused, controllerActions, dungeonTransition]);
  const isReady =
    persistence.hydrated &&
    pixiWorld.canvasReady &&
    !dungeonTransition.transitionActive &&
    !dungeonTransition.hasTransitionError;

  useHexInfoWindowPromotion({
    combatActive: bootstrap.game.combat != null,
    currentLootAvailable: gameView.currentTile.items.length > 0,
    currentStructure: gameView.currentTile.structure,
    suppressAutoOpen: pixiWorld.queuedTravelAutoOpenSuppressed,
    setWindowShown: controllerMutators.setWindowShown,
    windowShown: controllerState.windowShown,
  });

  useCraftingRecipeBookPromotion({
    currentStructure: gameView.currentTile.structure,
    playerCoord: bootstrap.game.player.coord,
    setPreferredRecipeSkill: controllerMutators.setPreferredRecipeSkill,
    setWindowShown: controllerMutators.setWindowShown,
    suppressAutoOpen: pixiWorld.queuedTravelAutoOpenSuppressed,
  });

  useEffect(() => {
    setWorldClockTime(bootstrap.game.worldTimeMs);
  }, [bootstrap.game.worldTimeMs]);

  useCombatAttentionWindow({
    combat: bootstrap.game.combat,
    hydrated: persistence.hydrated,
    playerCoord: bootstrap.game.player.coord,
    suppressHexInfoAutoOpen: pixiWorld.queuedTravelAutoOpenSuppressed,
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
    playerMana: bootstrap.game.player.mana,
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
    interactLabel,
    onForfeitCombat: controllerActions.handleForfeitCombat,
    onStartCombat: controllerActions.handleStartCombat,
    onInteract: handleInteract,
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
      handleCreateDebugDropItem: controllerActions.handleCreateDebugDropItem,
      handleCreateDebugEquipmentItem:
        controllerActions.handleCreateDebugEquipmentItem,
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
      handleInteract,
      handleOpenRecipeBookWithMaterialFilter:
        controllerActions.handleOpenRecipeBookWithMaterialFilter,
      handleToggleFavoriteRecipe: controllerActions.handleToggleFavoriteRecipe,
      handleProspect: controllerActions.handleProspect,
      handleProspectItem: controllerActions.handleProspectItem,
      handleReforgeItem: controllerActions.handleReforgeItem,
      handleSetDebugMorning: controllerActions.handleSetDebugMorning,
      handleSetDebugNight: controllerActions.handleSetDebugNight,
      handleSpawnDebugEnemyNearby:
        controllerActions.handleSpawnDebugEnemyNearby,
      handleTriggerDebugBloodMoon:
        controllerActions.handleTriggerDebugBloodMoon,
      handleTriggerDebugEarthquake:
        controllerActions.handleTriggerDebugEarthquake,
      handleTriggerDebugHarvestMoon:
        controllerActions.handleTriggerDebugHarvestMoon,
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
      gameplaySettings: controllerState.gameplaySettings,
      gold: gameView.gold,
      graphicsSettings: controllerState.graphicsSettings,
      homeHex: bootstrap.game.homeHex,
      inventoryCountsByItemKey: gameView.inventoryCountsByItemKey,
      itemModification: gameView.itemModification,
      itemMenu: controllerState.itemMenu,
      interfaceSettings: controllerState.interfaceSettings,
      claimStatus: gameView.claimStatus,
      territoryNpcHealStatus: gameView.territoryNpcHealStatus,
      interactLabel,
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
      preferredRecipeSkill: controllerState.preferredRecipeSkill,
      recipeMaterialFilterItemKey: controllerState.recipeMaterialFilterItemKey,
      recipeSkillLevels: gameView.recipeSkillLevels,
      bulkSellEquipmentExplanation: gameView.bulkSellEquipmentExplanation,
      showFilterMenu: controllerState.showFilterMenu,
      heroOverview: gameView.heroOverview,
      townStock: gameView.townStock,
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
    interfaceSettings: controllerState.interfaceSettings,
    isReady,
    pixiWorldError:
      pixiWorld.canvasError || dungeonTransition.hasTransitionError,
    paused: bootstrap.paused,
    uiAudio: bootstrap.uiAudio,
    windowsProps,
    onRetryPixiWorld: dungeonTransition.hasTransitionError
      ? dungeonTransition.retryTransition
      : pixiWorld.retryCanvas,
    onUiAudioChange: bootstrap.setUiAudio,
  };
}
