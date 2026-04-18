import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame,
  syncBloodMoon,
  syncPlayerStatusEffects,
  type GameState,
} from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { VersionStatusWidget } from '../../ui/components/VersionStatusWidget/VersionStatusWidget';
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
import { useVersionStatus } from './hooks/useVersionStatus';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import { clearEncryptedState } from '../../persistence/storage';
import {
  clearAudioSettings,
  loadAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from '../audioSettings';
import { UiAudioProvider } from '../audio/UiAudioContext';
import { useUiAudioController } from '../audio/useUiAudioController';
import {
  clearGraphicsSettings,
  loadGraphicsSettings,
  saveGraphicsSettings,
  type GraphicsSettings,
} from '../graphicsSettings';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { LoadingSpinner } from '../../ui/components/LoadingSpinner';
import styles from './styles.module.scss';
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
    handleOpenRecipeBookWithMaterialFilter,
    handleClearRecipeMaterialFilter,
    audioSettings,
    graphicsSettings,
    itemMenu,
    logFilters,
    moveWindow,
    showTooltip,
    setAudioSettings,
    setGraphicsSettings,
    setLogFilters,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    showFilterMenu,
    showItemTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
    recipeMaterialFilterItemKey,
  } = useAppControllers({
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
    setGame,
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
  const versionStatus = useVersionStatus();
  const uiAudio = useUiAudioController(audioSettings);

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
    windowShown,
    windowShownLoot: windowShown.loot,
  });

  const handleSaveSettings = async ({
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
  };

  const handleSaveSettingsAndReload = async (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => {
    await handleSaveSettings(settings);
    uiAudio.notify();
    window.location.reload();
  };

  const handleResetSaveData = async () => {
    uiAudio.error();
    clearEncryptedState();
    clearAudioSettings();
    clearGraphicsSettings();
    window.location.reload();
  };

  const appWindowsProps = useAppWindowsProps({
    windows,
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
    tooltipPositionRef,
    heroView: {
      stats,
      hunger: game.player.hunger,
      thirst: game.player.thirst,
      worldTimeMs: game.worldTimeMs,
    },
    playerView: {
      coord: game.player.coord,
      mana: game.player.mana,
      equipment: game.player.equipment,
      inventory: game.player.inventory,
      learnedRecipeIds: game.player.learnedRecipeIds,
    },
    worldView: {
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
    },
    recipesView: {
      entries: recipes,
      skillLevels: recipeSkillLevels,
      inventoryCountsByItemKey,
      materialFilterItemKey: recipeMaterialFilterItemKey,
    },
    lootView: {
      visible: lootWindowVisible,
      snapshot: lootSnapshot,
    },
    combatView: {
      visible: combatWindowVisible,
      snapshot: combatSnapshot,
    },
    logsView: {
      showFilterMenu,
      filters: logFilters,
      filtered: filteredLogs,
    },
    settingsView: {
      audio: audioSettings,
      graphics: graphicsSettings,
    },
    itemMenu,
    actions: {
      windows: {
        onMoveWindow: moveWindow,
        onSetWindowVisibility: setWindowVisibility,
        onToggleDockWindow: toggleDockWindow,
      },
      tooltip: {
        onShowItemTooltip: showItemTooltip,
        onShowTooltip: showTooltip,
        onCloseTooltip: closeTooltip,
        onCloseItemMenu: closeItemMenu,
        onEquipmentHover: handleEquipmentHover,
      },
      inventory: {
        onUnequip: handleUnequip,
        onSort: handleSort,
        onEquip: handleEquip,
        onUseItem: handleUseItem,
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
      },
      world: {
        onStartCombat: handleStartCombat,
        onInteract: handleInteract,
        onProspect: handleProspect,
        onSellAll: handleSellAll,
        onBuyTownItem: handleBuyTownItem,
        onClaimHex: handleClaimHex,
        onSetHome: () => setHomeHexForApp(setGame),
      },
      recipes: {
        onOpenWithMaterialFilter: handleOpenRecipeBookWithMaterialFilter,
        onClearMaterialFilter: handleClearRecipeMaterialFilter,
      },
      logs: {
        onToggleFilterMenu: toggleFilterMenu,
        onToggleLogFilter: toggleLogFilter,
      },
      settings: {
        onResetSaveData: handleResetSaveData,
        onSaveSettings: handleSaveSettings,
        onSaveSettingsAndReload: handleSaveSettingsAndReload,
      },
    },
  });

  return (
    <UiAudioProvider value={uiAudio}>
      <div className={styles.appRoot}>
        <div className={isReady ? undefined : styles.hiddenUntilReady}>
          <div ref={hostRef} className={styles.mapViewport} />
          <HomeIndicator
            claimedHex={firstClaimedHex}
            hostRef={hostRef}
            homeHex={game.homeHex}
            playerCoord={game.player.coord}
            radius={game.radius}
          />
          <VersionStatusWidget
            currentVersion={versionStatus.currentVersion}
            remoteVersion={versionStatus.remoteVersion}
            status={versionStatus.status}
            onRefresh={() => window.location.reload()}
          />
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
