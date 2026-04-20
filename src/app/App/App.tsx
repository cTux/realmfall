import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createGame,
  syncBloodMoon,
  syncPlayerStatusEffects,
  type GameState,
} from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { AppWindows } from './AppWindows';
import { HomeIndicator } from './HomeIndicator';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { setHomeHexForApp, useAppLifecycle } from './hooks/useAppLifecycle';
import { useAppWindowsProps } from './hooks/useAppWindowsProps';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import { clearEncryptedState } from '../../persistence/storage';
import {
  clearAudioSettings,
  loadAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from '../audioSettings';
import {
  DEFAULT_UI_AUDIO_CONTROLLER,
  UiAudioProvider,
  type UiAudioController,
} from '../audio/UiAudioContext';
import {
  clearGraphicsSettings,
  loadGraphicsSettings,
  saveGraphicsSettings,
  type GraphicsSettings,
} from '../graphicsSettings';
import { clearWorldMapSettings } from '../worldMapSettings';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { LoadingSpinner } from '../../ui/components/LoadingSpinner';
import styles from './styles.module.scss';
import { setWorldClockTime } from './worldClockStore';

const UiAudioControllerBridge = lazy(() =>
  import('../audio/UiAudioControllerBridge').then((module) => ({
    default: module.UiAudioControllerBridge,
  })),
);
const VoiceAudioControllerBridge = lazy(() =>
  import('../audio/VoiceAudioControllerBridge').then((module) => ({
    default: module.VoiceAudioControllerBridge,
  })),
);
const BackgroundMusicControllerBridge = lazy(() =>
  import('../audio/BackgroundMusicControllerBridge').then((module) => ({
    default: module.BackgroundMusicControllerBridge,
  })),
);
const VersionStatusPanel = lazy(() =>
  import('./components/VersionStatusPanel').then((module) => ({
    default: module.VersionStatusPanel,
  })),
);

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
  const [uiAudio, setUiAudio] = useState<UiAudioController>(
    DEFAULT_UI_AUDIO_CONTROLLER,
  );
  const {
    closeItemMenu,
    closeAllWindows,
    closeTooltip,
    handleBuyTownItem,
    handleClaimHex,
    handleContextItem,
    handleCraftRecipe,
    handleDropEquippedItem,
    handleDropItem,
    handleEquipmentHover,
    handleEquip,
    handleEquippedContextItem,
    handleInteract,
    handleProspect,
    handleProspectItem,
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
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    audioSettings,
    graphicsSettings,
    itemMenu,
    logFilters,
    moveWindow,
    showTooltip,
    setAudioSettings,
    setActionBarSlots,
    setGraphicsSettings,
    setLogFilters,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    showFilterMenu,
    showActionBarItemTooltip,
    showItemTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
    recipeMaterialFilterItemKey,
  } = useAppControllers({
    inventory: game.player.inventory,
    gameRef,
    initialAudioSettings: initialAudioSettingsRef.current,
    initialGraphicsSettings: initialGraphicsSettingsRef.current,
    setGame,
    tooltipPositionRef,
    worldTimeMsRef,
  });
  const handleWorldSecondChange = useCallback(() => {
    setGame((current) =>
      syncPlayerStatusEffects(current, worldTimeMsRef.current),
    );
  }, []);
  const handleWorldMinuteChange = useCallback((worldTimeMinutes: number) => {
    setGame((current) =>
      syncBloodMoon(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        worldTimeMinutes,
      ),
    );
  }, []);
  const { setWorldTimeMs } = useWorldClockFps({
    initialWorldTimeMs: initialGameRef.current.worldTimeMs,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
    onWorldMinuteChange: handleWorldMinuteChange,
    onWorldSecondChange: handleWorldSecondChange,
  });

  const {
    backgroundMusicMood,
    claimStatus,
    canProspectInventoryEquipment,
    canSellInventoryEquipment,
    combatEnemies,
    currentTile,
    currentTileHostileEnemyCount,
    firstClaimedHex,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCountsByItemKey,
    prospectInventoryEquipmentExplanation,
    recipes,
    recipeSkillLevels,
    sellInventoryEquipmentExplanation,
    stats,
    townStock,
  } = useAppGameView({
    game,
    logFilters,
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
  const { hostRef, canvasReady } = usePixiWorld({
    enabled: hydrated,
    game,
    graphicsSettings,
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

  useAppLifecycle({
    game,
    gameRef,
    tooltipPositionRef,
  });

  useCombatAutomation({
    combat: game.combat,
    setGame,
    worldTimeMsRef,
  });

  useKeyboardShortcuts({
    combatStartAvailable: Boolean(game.combat && !game.combat.started),
    interactLabel,
    lootSnapshotLength: lootSnapshot.length,
    lootWindowVisible,
    onStartCombat: handleStartCombat,
    keepLootWindowMounted,
    onInteract: handleInteract,
    onTakeAllLoot: handleTakeAllLoot,
    onCloseAllWindows: closeAllWindows,
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
    windowShownLoot: windowShown.loot,
  });

  const handleSaveSettings = useCallback(
    async ({
      audio: nextAudioSettings,
      graphics: nextGraphicsSettings,
    }: {
      audio: AudioSettings;
      graphics: GraphicsSettings;
    }) => {
      setAudioSettings(nextAudioSettings);
      setGraphicsSettings(nextGraphicsSettings);
      saveAudioSettings(nextAudioSettings);
      saveGraphicsSettings(nextGraphicsSettings);
      uiAudio.applySettings(nextAudioSettings);
      await persistNow();
      uiAudio.success();
    },
    [persistNow, setAudioSettings, setGraphicsSettings, uiAudio],
  );

  const handleSaveSettingsAndReload = useCallback(
    async (settings: { audio: AudioSettings; graphics: GraphicsSettings }) => {
      await handleSaveSettings(settings);
      uiAudio.notify();
      window.location.reload();
    },
    [handleSaveSettings, uiAudio],
  );

  const handleResetSaveData = useCallback(async () => {
    uiAudio.error();
    clearEncryptedState();
    clearAudioSettings();
    clearGraphicsSettings();
    clearWorldMapSettings();
    window.location.reload();
  }, [uiAudio]);
  const handleSetHome = useCallback(() => setHomeHexForApp(setGame), [setGame]);
  const heroView = useMemo(
    () => ({
      stats,
      hunger: game.player.hunger,
      thirst: game.player.thirst,
    }),
    [game.player.hunger, game.player.thirst, stats],
  );
  const playerView = useMemo(
    () => ({
      coord: game.player.coord,
      mana: game.player.mana,
      actionBarSlots,
      equipment: game.player.equipment,
      inventory: game.player.inventory,
      learnedRecipeIds: game.player.learnedRecipeIds,
    }),
    [
      actionBarSlots,
      game.player.coord,
      game.player.equipment,
      game.player.inventory,
      game.player.learnedRecipeIds,
      game.player.mana,
    ],
  );
  const worldView = useMemo(
    () => ({
      homeHex: game.homeHex,
      currentTile,
      currentTileHostileEnemyCount,
      combat: game.combat,
      interactLabel,
      canProspectInventoryEquipment,
      canSellInventoryEquipment,
      claimStatus,
      prospectInventoryEquipmentExplanation,
      sellInventoryEquipmentExplanation,
      townStock,
      gold,
    }),
    [
      canProspectInventoryEquipment,
      canSellInventoryEquipment,
      claimStatus,
      currentTile,
      currentTileHostileEnemyCount,
      game.combat,
      game.homeHex,
      gold,
      interactLabel,
      prospectInventoryEquipmentExplanation,
      sellInventoryEquipmentExplanation,
      townStock,
    ],
  );
  const recipesView = useMemo(
    () => ({
      entries: recipes,
      skillLevels: recipeSkillLevels,
      inventoryCountsByItemKey,
      materialFilterItemKey: recipeMaterialFilterItemKey,
    }),
    [
      inventoryCountsByItemKey,
      recipeMaterialFilterItemKey,
      recipeSkillLevels,
      recipes,
    ],
  );
  const lootView = useMemo(
    () => ({
      visible: lootWindowVisible,
      snapshot: lootSnapshot,
    }),
    [lootSnapshot, lootWindowVisible],
  );
  const combatView = useMemo(
    () => ({
      visible: combatWindowVisible,
      snapshot: combatSnapshot,
    }),
    [combatSnapshot, combatWindowVisible],
  );
  const logsView = useMemo(
    () => ({
      showFilterMenu,
      filters: logFilters,
      filtered: filteredLogs,
    }),
    [filteredLogs, logFilters, showFilterMenu],
  );
  const settingsView = useMemo(
    () => ({
      audio: audioSettings,
      graphics: graphicsSettings,
    }),
    [audioSettings, graphicsSettings],
  );
  const windowActions = useMemo(
    () => ({
      onMoveWindow: moveWindow,
      onSetWindowVisibility: setWindowVisibility,
      onToggleDockWindow: toggleDockWindow,
    }),
    [moveWindow, setWindowVisibility, toggleDockWindow],
  );
  const tooltipActions = useMemo(
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
  const inventoryActions = useMemo(
    () => ({
      onUnequip: handleUnequip,
      onSort: handleSort,
      onEquip: handleEquip,
      onUseItem: handleUseItem,
      onAssignActionBarSlot: handleAssignActionBarSlot,
      onClearActionBarSlot: handleClearActionBarSlot,
      onUseActionBarSlot: handleUseActionBarSlot,
      onCraftRecipe: handleCraftRecipe,
      onDropItem: handleDropItem,
      onDropEquippedItem: handleDropEquippedItem,
      onProspectItem: handleProspectItem,
      onSellItem: handleSellItem,
      onSetItemLocked: handleSetItemLocked,
      onContextItem: handleContextItem,
      onEquippedContextItem: handleEquippedContextItem,
      onTakeLootItem: handleTakeLootItem,
      onTakeAllLoot: handleTakeAllLoot,
    }),
    [
      handleAssignActionBarSlot,
      handleClearActionBarSlot,
      handleContextItem,
      handleCraftRecipe,
      handleDropEquippedItem,
      handleDropItem,
      handleEquip,
      handleEquippedContextItem,
      handleProspectItem,
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
  const worldActions = useMemo(
    () => ({
      onStartCombat: handleStartCombat,
      onInteract: handleInteract,
      onProspect: handleProspect,
      onSellAll: handleSellAll,
      onBuyTownItem: handleBuyTownItem,
      onClaimHex: handleClaimHex,
      onSetHome: handleSetHome,
    }),
    [
      handleBuyTownItem,
      handleClaimHex,
      handleInteract,
      handleProspect,
      handleSellAll,
      handleSetHome,
      handleStartCombat,
    ],
  );
  const recipeActions = useMemo(
    () => ({
      onOpenWithMaterialFilter: handleOpenRecipeBookWithMaterialFilter,
      onClearMaterialFilter: handleClearRecipeMaterialFilter,
    }),
    [handleClearRecipeMaterialFilter, handleOpenRecipeBookWithMaterialFilter],
  );
  const logActions = useMemo(
    () => ({
      onToggleFilterMenu: toggleFilterMenu,
      onToggleLogFilter: toggleLogFilter,
    }),
    [toggleFilterMenu, toggleLogFilter],
  );
  const settingsActions = useMemo(
    () => ({
      onResetSaveData: handleResetSaveData,
      onSaveSettings: handleSaveSettings,
      onSaveSettingsAndReload: handleSaveSettingsAndReload,
    }),
    [handleResetSaveData, handleSaveSettings, handleSaveSettingsAndReload],
  );
  const appWindowActions = useMemo(
    () => ({
      windows: windowActions,
      tooltip: tooltipActions,
      inventory: inventoryActions,
      world: worldActions,
      recipes: recipeActions,
      logs: logActions,
      settings: settingsActions,
    }),
    [
      inventoryActions,
      logActions,
      recipeActions,
      settingsActions,
      tooltipActions,
      windowActions,
      worldActions,
    ],
  );

  const appWindowsProps = useAppWindowsProps({
    windows,
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
    tooltipPositionRef,
    heroView,
    playerView,
    worldView,
    recipesView,
    lootView,
    combatView,
    logsView,
    settingsView,
    itemMenu,
    actions: appWindowActions,
  });

  return (
    <UiAudioProvider value={uiAudio}>
      <div className={styles.appRoot}>
        <Suspense fallback={null}>
          <UiAudioControllerBridge
            audioSettings={audioSettings}
            onChange={setUiAudio}
          />
          <VoiceAudioControllerBridge
            audioSettings={audioSettings}
            game={game}
          />
          <BackgroundMusicControllerBridge
            audioSettings={audioSettings}
            mood={backgroundMusicMood}
          />
        </Suspense>
        <div className={isReady ? undefined : styles.hiddenUntilReady}>
          <div ref={hostRef} className={styles.mapViewport} />
          <HomeIndicator
            claimedHex={firstClaimedHex}
            hostRef={hostRef}
            homeHex={game.homeHex}
            playerCoord={game.player.coord}
            radius={game.radius}
          />
          <Suspense fallback={null}>
            <VersionStatusPanel onRefresh={() => window.location.reload()} />
          </Suspense>
          <AppWindows {...appWindowsProps} />
        </div>
        {isReady ? null : (
          <div
            className={styles.loadingScreen}
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner className={styles.loadingSpinner} />
          </div>
        )}
      </div>
    </UiAudioProvider>
  );
}
