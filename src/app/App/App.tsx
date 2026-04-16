import { useRef, useState } from 'react';
import { createGame, type GameState } from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { VersionStatusWidget } from '../../ui/components/VersionStatusWidget/VersionStatusWidget';
import { AppWindows } from './AppWindows';
import { HomeIndicator } from './HomeIndicator';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { setHomeHexForApp, useAppLifecycle } from './hooks/useAppLifecycle';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useVersionStatus } from './hooks/useVersionStatus';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import { clearEncryptedState } from '../../persistence/storage';
import {
  clearGraphicsSettings,
  loadGraphicsSettings,
  saveGraphicsSettings,
  type GraphicsSettings,
} from '../graphicsSettings';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import styles from './styles.module.scss';

export function App() {
  const initialGraphicsSettingsRef = useRef(loadGraphicsSettings());
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const gameRef = useRef<GameState>(initialGameRef.current);
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const worldTimeMsRef = useRef(initialGameRef.current.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsSampleRef = useRef(0);
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
    graphicsSettings,
    itemMenu,
    logFilters,
    moveWindow,
    showTooltip,
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
    initialGraphicsSettings: initialGraphicsSettingsRef.current,
    setGame,
    tooltipPositionRef,
    worldTimeMsRef,
  });
  const { setWorldTimeMs, worldTimeMinutes, worldTimeMs } = useWorldClockFps({
    initialWorldTimeMs: initialGameRef.current.worldTimeMs,
    worldTimeMsRef,
    worldTimeTickRef,
    frameCountRef,
    lastFpsSampleRef,
    lastDisplayedWorldSecondRef,
  });

  const {
    claimStatus,
    canProspect,
    canSell,
    combatEnemies,
    currentTile,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCountsByItemKey,
    prospectExplanation,
    recipes,
    recipeSkillLevels,
    sellExplanation,
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
    lootSnapshot,
    lootWindowVisible,
    renderCombatWindow,
    renderLootWindow,
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
    frameCountRef,
    gameRef,
    tooltipPositionRef,
    setGame,
    setTooltip,
  });
  const isReady = hydrated && canvasReady;
  const versionStatus = useVersionStatus();

  useAppLifecycle({
    game,
    gameRef,
    setGame,
    tooltipPositionRef,
    worldTimeMinutes,
    worldTimeMs,
    worldTimeMsRef,
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
    renderLootWindow,
    onInteract: handleInteract,
    onTakeAllLoot: handleTakeAllLoot,
    onCloseAllWindows: closeAllWindows,
    onToggleDockWindow: toggleDockWindow,
    windowShownLoot: windowShown.loot,
  });

  const handleSaveGraphicsSettings = async (
    nextGraphicsSettings: GraphicsSettings,
  ) => {
    setGraphicsSettings(nextGraphicsSettings);
    saveGraphicsSettings(nextGraphicsSettings);
    await persistNow();
  };

  const handleSaveGraphicsSettingsAndReload = async (
    nextGraphicsSettings: GraphicsSettings,
  ) => {
    await handleSaveGraphicsSettings(nextGraphicsSettings);
    window.location.reload();
  };

  const handleResetSaveData = async () => {
    clearEncryptedState();
    clearGraphicsSettings();
    window.location.reload();
  };

  return (
    <div className={styles.appRoot}>
      <div className={isReady ? undefined : styles.hiddenUntilReady}>
        <div ref={hostRef} className={styles.mapViewport} />
        <HomeIndicator
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
        <AppWindows
          layout={{
            windows,
            windowShown,
            renderLootWindow,
            renderCombatWindow,
            tooltipPositionRef,
          }}
          views={{
            worldTimeMs,
            stats,
            game,
            currentTile,
            graphicsSettings,
            recipes,
            recipeSkillLevels,
            inventoryCountsByItemKey,
            recipeMaterialFilterItemKey,
            interactLabel,
            canProspect,
            canSell,
            claimStatus,
            prospectExplanation,
            sellExplanation,
            townStock,
            gold,
            lootWindowVisible,
            lootSnapshot,
            combatWindowVisible,
            combatSnapshot,
            showFilterMenu,
            logFilters,
            filteredLogs,
            itemMenu,
          }}
          actions={{
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
              onSaveGraphicsSettings: handleSaveGraphicsSettings,
              onSaveGraphicsSettingsAndReload:
                handleSaveGraphicsSettingsAndReload,
            },
          }}
        />
      </div>
      {isReady ? null : (
        <div
          className={styles.loadingScreen}
          aria-live="polite"
          aria-busy="true"
        >
          <div className={styles.loadingSpinner} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
