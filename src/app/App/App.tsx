import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
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
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { setHomeHexForApp, useAppLifecycle } from './hooks/useAppLifecycle';
import { useAppWindowActions } from './hooks/useAppWindowActions';
import { useAppWindowViews } from './hooks/useAppWindowViews';
import { useAppWindowsProps } from './hooks/useAppWindowsProps';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import { PauseOverlay } from './components/PauseOverlay';
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
import { t } from '../../i18n';

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
const HomeIndicator = lazy(() =>
  import('./HomeIndicator').then((module) => ({
    default: module.HomeIndicator,
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
  const [paused, setPaused] = useState(false);
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
    handleActivateInventoryItem,
    handleEquipItem,
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
    paused,
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
    paused,
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

  useAppLifecycle({
    game,
    gameRef,
    tooltipPositionRef,
  });

  useCombatAutomation({
    game,
    paused,
    setGame,
    worldTimeMsRef,
  });

  const handleTogglePause = useCallback(() => {
    setPaused((current) => !current);
  }, []);

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
    await clearEncryptedState();
    clearAudioSettings();
    clearGraphicsSettings();
    clearWorldMapSettings();
    window.location.reload();
  }, [uiAudio]);
  const handleSetHome = useCallback(() => {
    if (paused) {
      return;
    }

    setHomeHexForApp(setGame);
  }, [paused, setGame]);
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
    itemMenu,
    claimStatus,
    interactLabel,
    filteredLogs,
    logFilters,
    lootSnapshot,
    lootWindowVisible,
    canProspectInventoryEquipment,
    canSellInventoryEquipment,
    prospectInventoryEquipmentExplanation,
    recipes,
    recipeMaterialFilterItemKey,
    recipeSkillLevels,
    sellInventoryEquipmentExplanation,
    showFilterMenu,
    stats,
    townStock,
  });
  const appWindowActions = useAppWindowActions({
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
    handleEquipmentHover,
    handleEquipItem,
    handleEquippedContextItem,
    handleInteract,
    handleOpenRecipeBookWithMaterialFilter,
    handleProspect,
    handleProspectItem,
    handleResetSaveData,
    handleSaveSettings,
    handleSaveSettingsAndReload,
    handleSellAll,
    handleSellItem,
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
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
  });

  const appWindowsProps = useAppWindowsProps({
    windows,
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
    tooltipPositionRef,
    views: appWindowViews,
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
        <div className={styles.appShell}>
          <div ref={hostRef} className={styles.mapViewport} />
          <Suspense fallback={null}>
            <HomeIndicator
              claimedHex={firstClaimedHex}
              hostRef={hostRef}
              homeHex={game.homeHex}
              playerCoord={game.player.coord}
              radius={game.radius}
            />
          </Suspense>
          <Suspense fallback={null}>
            <VersionStatusPanel onRefresh={() => window.location.reload()} />
          </Suspense>
          <AppWindows {...appWindowsProps} />
          {isReady && paused ? (
            <PauseOverlay
              title={t('ui.pauseOverlay.title')}
              subtitle={t('ui.pauseOverlay.subtitle')}
            />
          ) : null}
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
