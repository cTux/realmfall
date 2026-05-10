import { useCallback, useEffect, useMemo } from 'react';
import { getActiveWorld } from '@realmfall/core/game/dungeons/worldState';
import { getWorldDayIndex } from '@realmfall/core/game/logs';
import { getResolvedCurrentTile } from '@realmfall/core/game/stateSelectors';
import { getCurrentWorldRevealRadius } from '@realmfall/core/game/stateOutposts';
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
import { useCombatHexInfoPersistence } from './useCombatHexInfoPersistence';
import { useAppWorldClock } from './useAppWorldClock';
import { useCraftingRecipeBookPromotion } from './useCraftingRecipeBookPromotion';
import { useGameplayAutomation } from './useGameplayAutomation';
import { useDungeonTransitionController } from './useDungeonTransitionController';
import { useHexInfoWindowPromotion } from './useHexInfoWindowPromotion';
import type { AppShellState } from '../AppShell.types';
import { getPresentedCombat } from '../../../game/combatPresentation';

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
    ignoredAutoLootItemIds: controllerState.autoLootIgnoredItemIds,
    paused: bootstrap.paused,
    setGame: bootstrap.setGame,
    suppressAutoLoot: pixiWorld.queuedTravelAutoOpenSuppressed,
    worldTimeMsRef: bootstrap.worldTimeMsRef,
  });
  const presentedCombat = getPresentedCombat(bootstrap.game.combat);
  const windowTransitions = useWindowTransitions({
    combat: presentedCombat,
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
    combat: presentedCombat,
    currentLootAvailable: gameView.currentTile.items.length > 0,
    playerCoord: bootstrap.game.player.coord,
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
    combat: presentedCombat,
    hydrated: persistence.hydrated,
    playerCoord: bootstrap.game.player.coord,
    suppressHexInfoAutoOpen: pixiWorld.queuedTravelAutoOpenSuppressed,
    setWindowVisibility: controllerMutators.setWindowVisibility,
    windowShownHexInfo: controllerState.windowShown.hexInfo,
  });
  useCombatHexInfoPersistence({
    combat: presentedCombat,
    setWindowShown: controllerMutators.setWindowShown,
    windowShownCombat: controllerState.windowShown.combat,
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
    gameRef: bootstrap.gameRef,
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
    appReady: isReady,
    controllerActions,
    controllerMutators,
    controllerState,
    gameSnapshot: {
      combat: bootstrap.game.combat,
      homeHex: bootstrap.game.homeHex,
      player: bootstrap.game.player,
    },
    gameView,
    interactLabel,
    onInteract: handleInteract,
    settingsActions,
    tooltipPositionRef: bootstrap.tooltipPositionRef,
    windowTransitions,
  });
  const activeWorld = useMemo(
    () =>
      getActiveWorld({
        activeWorldId: bootstrap.game.activeWorldId,
        worlds: bootstrap.game.worlds,
      }),
    [bootstrap.game.activeWorldId, bootstrap.game.worlds],
  );
  const currentWorldKind = activeWorld?.kind ?? 'surface';
  const dungeonExitHex =
    activeWorld?.kind === 'dungeon' ? activeWorld.dungeon.entranceCoord : null;
  const worldRevealRadius = useMemo(
    () =>
      getCurrentWorldRevealRadius({
        activeWorldId: bootstrap.game.activeWorldId,
        player: { coord: bootstrap.game.player.coord },
        tiles: bootstrap.game.tiles,
        worlds: bootstrap.game.worlds,
      }),
    [
      bootstrap.game.activeWorldId,
      bootstrap.game.player.coord,
      bootstrap.game.tiles,
      bootstrap.game.worlds,
    ],
  );
  const shellState = useMemo(
    () =>
      ({
        homeIndicator: {
          currentWorldKind,
          dungeonExitHex,
          homeHex: bootstrap.game.homeHex,
          playerCoord: bootstrap.game.player.coord,
          radius: bootstrap.game.radius,
          visibleRadius: worldRevealRadius,
        },
        voicePlayback: {
          combat: bootstrap.game.combat,
          logSequence: bootstrap.game.logSequence,
          logs: bootstrap.game.logs,
          player: {
            hp: bootstrap.game.player.hp,
            statusEffects: bootstrap.game.player.statusEffects,
          },
        },
      }) satisfies AppShellState,
    [
      bootstrap.game.combat,
      bootstrap.game.homeHex,
      bootstrap.game.logs,
      bootstrap.game.logSequence,
      bootstrap.game.player.coord,
      bootstrap.game.player.hp,
      bootstrap.game.player.statusEffects,
      bootstrap.game.radius,
      currentWorldKind,
      dungeonExitHex,
      worldRevealRadius,
    ],
  );

  return {
    audioSettings: controllerState.audioSettings,
    backgroundMusicMood: gameView.backgroundMusicMood,
    claimedHex: gameView.firstClaimedHex,
    shellState,
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
