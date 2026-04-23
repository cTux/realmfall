import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame } from '../../game/stateFactory';
import { getCurrentTile } from '../../game/stateSelectors';
import type { GameState } from '../../game/stateTypes';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { AppShell } from './components/AppShell';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useCombatAttentionWindow } from './hooks/useCombatAttentionWindow';
import { useAppSettingsActions } from './hooks/useAppSettingsActions';
import { useAppWindowActions } from './hooks/useAppWindowActions';
import { useAppWindowViews } from './hooks/useAppWindowViews';
import { useAppWindowsProps } from './hooks/useAppWindowsProps';
import { useAppWorldClock } from './hooks/useAppWorldClock';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { WORLD_RADIUS } from '../constants';
import { loadAudioSettings } from '../audioSettings';
import {
  DEFAULT_UI_AUDIO_CONTROLLER,
  type UiAudioController,
} from '../audio/UiAudioContext';
import { loadGraphicsSettings } from '../graphicsSettings';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { setWorldClockTime } from './worldClockStore';

export function App() {
  const initialAudioSettingsRef = useRef(loadAudioSettings());
  const initialGraphicsSettingsRef = useRef(loadGraphicsSettings());
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const gameRef = useRef<GameState>(initialGameRef.current);
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const worldTimeMsRef = useRef(initialGameRef.current.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(initialGameRef.current.worldTimeMs / 1000),
  );
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [paused, setPaused] = useState(false);
  const [uiAudio, setUiAudio] = useState<UiAudioController>(
    DEFAULT_UI_AUDIO_CONTROLLER,
  );
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
  } = useAppControllers({
    currentStructure: getCurrentTile(game).structure,
    equipment: game.player.equipment,
    inventory: game.player.inventory,
    gameRef,
    initialAudioSettings: initialAudioSettingsRef.current,
    initialGraphicsSettings: initialGraphicsSettingsRef.current,
    paused,
    setGame,
    tooltipPositionRef,
    worldTimeMsRef,
  });
  const { setWorldTimeMs } = useAppWorldClock({
    initialWorldTimeMs: initialGameRef.current.worldTimeMs,
    lastDisplayedWorldSecondRef,
    paused,
    setGame,
    worldTimeMsRef,
    worldTimeTickRef,
  });

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
  } = useAppGameView({
    game,
    hexItemModificationPickerActive,
    logFilters,
    selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex,
  });
  const { hydrated, persistNow } = useAppPersistence({
    game,
    gameRef,
    logFilters,
    actionBarSlots,
    setGame,
    setActionBarSlots,
    setLogFilters,
    setWindows,
    setWindowShown,
    setWorldTimeMs,
    windows,
    windowShown,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
  });
  const {
    combatSnapshot,
    combatWindowVisible,
    keepCombatWindowMounted,
    keepLootWindowMounted,
    lootSnapshot,
    lootWindowVisible,
  } = useWindowTransitions({
    combat: game.combat,
    combatEnemies,
    currentTile,
  });
  const {
    handleResetSaveArea,
    handleSaveSettings,
    handleSaveSettingsAndReload,
    handleSetHome,
  } = useAppSettingsActions({
    paused,
    persistNow,
    setAudioSettings,
    setGame,
    setGraphicsSettings,
    uiAudio,
  });
  const { hostRef, canvasReady } = usePixiWorld({
    enabled: hydrated,
    game,
    graphicsSettings,
    paused,
    worldTimeMsRef,
    gameRef,
    tooltipPositionRef,
    setGame,
    setTooltip,
  });
  const isReady = hydrated && canvasReady;

  useEffect(() => {
    setWorldClockTime(game.worldTimeMs);
  }, [game.worldTimeMs]);

  useCombatAttentionWindow({
    combat: game.combat,
    hydrated,
    playerCoord: game.player.coord,
    setWindowVisibility,
    windowShownHexInfo: windowShown.hexInfo,
  });

  useAppLifecycle({
    game,
    gameRef,
    tooltipPositionRef,
  });

  useCombatAutomation({
    combat: game.combat,
    enemyLookup: game.enemies,
    paused,
    playerStatusEffects: game.player.statusEffects,
    setGame,
    worldTimeMsRef,
  });

  const handleTogglePause = useCallback(() => {
    setPaused((current) => !current);
  }, []);
  const canSetHomeAction =
    (!currentTile.claim || currentTile.claim.ownerType === 'player') &&
    (game.homeHex.q !== game.player.coord.q ||
      game.homeHex.r !== game.player.coord.r);
  const combatDeathAvailable = Boolean(
    game.combat?.started &&
    game.combat.startedAtMs != null &&
    game.worldTimeMs - game.combat.startedAtMs >= 60_000,
  );

  useKeyboardShortcuts({
    canBulkProspectEquipment,
    canBulkSellEquipment,
    canHealTerritoryNpc: territoryNpcHealStatus.canHeal,
    canSetHomeAction,
    canTerritoryAction: claimStatus.canClaim,
    combatDeathAvailable,
    combatStartAvailable: Boolean(game.combat && !game.combat.started),
    hexContentWindowShown: windowShown.hexInfo,
    interactLabel,
    lootSnapshotLength: currentTile.items.length,
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
    onTogglePause: handleTogglePause,
    onToggleDockWindow: toggleDockWindow,
    onWindowToggleSound: (opened) => {
      if (opened) {
        uiAudio.pop();
        return;
      }

      uiAudio.swoosh();
    },
    onCloseAllWindowsSound: uiAudio.swoosh,
    onUseActionBarSlot: handleUseActionBarSlot,
    windowShown,
  });

  const appWindowViews = useAppWindowViews({
    actionBarSlots,
    audioSettings,
    combatSnapshot,
    combatWindowVisible,
    currentTile,
    currentTileHostileEnemyCount,
    game,
    gold,
    graphicsSettings,
    inventoryCountsByItemKey,
    itemModification,
    itemMenu,
    claimStatus,
    territoryNpcHealStatus,
    interactLabel,
    filteredLogs,
    logFilters,
    lootSnapshot,
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
      game={game}
      hostRef={hostRef}
      isReady={isReady}
      paused={paused}
      uiAudio={uiAudio}
      windowsProps={appWindowsProps}
      onUiAudioChange={setUiAudio}
    />
  );
}
