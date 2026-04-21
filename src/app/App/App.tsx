import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createGame, type GameState } from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { AppWindows } from './AppWindows';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useAppSettingsActions } from './hooks/useAppSettingsActions';
import { useAppWindowActions } from './hooks/useAppWindowActions';
import { useAppWindowViews } from './hooks/useAppWindowViews';
import { useAppWindowsProps } from './hooks/useAppWindowsProps';
import { useAppWorldClock } from './hooks/useAppWorldClock';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { PauseOverlay } from './components/PauseOverlay';
import { loadAudioSettings } from '../audioSettings';
import {
  DEFAULT_UI_AUDIO_CONTROLLER,
  UiAudioProvider,
  type UiAudioController,
} from '../audio/UiAudioContext';
import { loadGraphicsSettings } from '../graphicsSettings';
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
  const {
    handleResetSaveData,
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
