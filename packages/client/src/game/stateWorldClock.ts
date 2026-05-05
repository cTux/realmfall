import { t } from '../i18n';
import {
  clearConsumableCooldownIfOutOfCombat,
  isCombatActive,
} from './combatActivity';
import {
  BLOOD_MOON_CHANCE,
  HARVEST_MOON_CHANCE,
  WORLD_MOVE_HEX_COOLDOWN_MS,
} from './config';
import { getPlayerCombatStats } from './progression';
import { syncEnemyBloodMoonState } from './combat';
import {
  addLog,
  getDayPhase,
  getWorldDayIndex,
  isBloodMoonRiseWindow,
  normalizeWorldMinutes,
  worldTimeMsFromMinutes,
} from './logs';
import { createRng } from './random';
import { copyGameState } from './stateClone';
import { cloneForWorldEventMutation } from './stateMutationHelpers';
import {
  maybeTriggerEarthshake,
  openEarthshakeDungeon,
  spawnBloodMoonEnemies,
  spawnHarvestMoonResources,
} from './stateWorldEvents';
import {
  shouldSyncActiveDungeonEnemyMovement,
  syncActiveDungeonEnemyMovement,
} from './stateDungeonWorldClock';
import { processPlayerStatusEffects } from './stateSurvival';
import type { GameState } from './types';

export function advanceWorldTimeForMovement(state: GameState, steps = 1) {
  if (steps <= 0) {
    return state.worldTimeMs;
  }

  return state.worldTimeMs + WORLD_MOVE_HEX_COOLDOWN_MS * steps;
}

export function syncBloodMoon(
  state: GameState,
  worldTimeMinutes: number,
  currentWorldTimeMs = state.worldTimeMs,
): GameState {
  const minutes = normalizeWorldMinutes(worldTimeMinutes);
  const phase = getDayPhase(minutes);

  if (state.dayPhase !== phase) {
    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, currentWorldTimeMs);
    next.dayPhase = phase;
    addLog(
      next,
      'system',
      phase === 'night'
        ? t('game.message.time.nightFalls')
        : t('game.message.time.morningBreaks'),
    );
    return syncBloodMoon(next, minutes, currentWorldTimeMs);
  }

  if (isBloodMoonRiseWindow(minutes)) {
    if (state.bloodMoonCheckedTonight && state.harvestMoonCheckedTonight) {
      return state;
    }

    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, currentWorldTimeMs);
    next.bloodMoonCheckedTonight = true;
    next.harvestMoonCheckedTonight = true;

    const rng = createRng(`${state.seed}:blood-moon:${state.bloodMoonCycle}`);
    if (rng() < BLOOD_MOON_CHANCE) {
      next.bloodMoonActive = true;
      next.harvestMoonActive = false;
      syncSurfaceEnemyBloodMoonState(next, true);
      const spawnedCount = spawnBloodMoonEnemies(next);
      addLog(next, 'combat', t('game.message.bloodMoon.begin'));
      if (spawnedCount > 0) {
        addLog(
          next,
          'combat',
          t(
            spawnedCount === 1
              ? 'game.message.bloodMoon.foes.one'
              : 'game.message.bloodMoon.foes.other',
            { count: spawnedCount },
          ),
        );
      }
      return next;
    }

    const harvestRng = createRng(
      `${state.seed}:harvest-moon:${state.harvestMoonCycle}`,
    );
    if (harvestRng() < HARVEST_MOON_CHANCE) {
      next.harvestMoonActive = true;
      const spawnedCount = spawnHarvestMoonResources(next);
      addLog(next, 'system', t('game.message.harvestMoon.begin'));
      if (spawnedCount > 0) {
        addLog(
          next,
          'loot',
          t(
            spawnedCount === 1
              ? 'game.message.harvestMoon.hexes.one'
              : 'game.message.harvestMoon.hexes.other',
            { count: spawnedCount },
          ),
        );
      }
    }
    return next;
  }

  if (
    phase === 'day' &&
    (state.bloodMoonActive ||
      state.bloodMoonCheckedTonight ||
      state.harvestMoonActive ||
      state.harvestMoonCheckedTonight ||
      state.lastEarthshakeDay !== getWorldDayIndex(currentWorldTimeMs))
  ) {
    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, currentWorldTimeMs);
    const wasBloodMoonActive = next.bloodMoonActive;
    const wasHarvestMoonActive = next.harvestMoonActive;
    next.bloodMoonActive = false;
    next.bloodMoonCheckedTonight = false;
    next.bloodMoonCycle += 1;
    next.harvestMoonActive = false;
    next.harvestMoonCheckedTonight = false;
    next.harvestMoonCycle += 1;
    syncSurfaceEnemyBloodMoonState(next, false);
    maybeTriggerEarthshake(next);
    if (wasBloodMoonActive) {
      addLog(next, 'combat', t('game.message.bloodMoon.end'));
    }
    if (wasHarvestMoonActive) {
      addLog(next, 'system', t('game.message.harvestMoon.end'));
    }
    return next;
  }

  return state;
}

export function triggerEarthshake(state: GameState): GameState {
  const next = cloneForWorldEventMutation(state);
  if (!openEarthshakeDungeon(next, true)) {
    addLog(next, 'system', t('game.message.earthshake.noGround'));
  }
  return next;
}

export function syncPlayerStatusEffects(
  state: GameState,
  worldTimeMs: number,
): GameState {
  const shouldSyncDungeonEnemies = shouldSyncActiveDungeonEnemyMovement(state);
  const next = copyGameState(state, {
    player: true,
    ...(shouldSyncDungeonEnemies
      ? { combat: true, enemies: true, logs: true, tiles: true }
      : {}),
  });
  next.worldTimeMs = worldTimeMs;
  const previousWorldTimeMs = state.worldTimeMs;

  const statusEffectsChanged = processPlayerStatusEffects(next);
  const passiveRegenChanged = regenerateOutOfCombatResources(
    next,
    previousWorldTimeMs,
  );
  const cooldownChanged = clearConsumableCooldownIfOutOfCombat(next);
  const dungeonEnemyMovementChanged = shouldSyncDungeonEnemies
    ? syncActiveDungeonEnemyMovement(next)
    : false;

  if (
    !statusEffectsChanged &&
    !passiveRegenChanged &&
    !cooldownChanged &&
    !dungeonEnemyMovementChanged
  ) {
    return state;
  }

  return next;
}

function regenerateOutOfCombatResources(
  state: GameState,
  previousWorldTimeMs: number,
) {
  if (isCombatActive(state.combat)) {
    return false;
  }

  const tickCount = Math.max(
    0,
    Math.floor(state.worldTimeMs / 1_000) -
      Math.floor(previousWorldTimeMs / 1_000),
  );
  if (tickCount <= 0) {
    return false;
  }

  const stats = getPlayerCombatStats(state.player);
  const hpPerTick = Math.max(1, Math.floor(stats.maxHp * 0.01));
  const manaPerTick = Math.max(1, Math.floor(stats.maxMana * 0.01));
  const previousHp = state.player.hp;
  const previousMana = state.player.mana;

  state.player.hp = Math.min(
    stats.maxHp,
    state.player.hp + hpPerTick * tickCount,
  );
  state.player.mana = Math.min(
    stats.maxMana,
    state.player.mana + manaPerTick * tickCount,
  );

  return state.player.hp !== previousHp || state.player.mana !== previousMana;
}

function syncSurfaceEnemyBloodMoonState(state: GameState, active: boolean) {
  const surfaceWorld = state.worlds[state.surfaceWorldId];
  if (!surfaceWorld) {
    return;
  }

  syncEnemyBloodMoonState(surfaceWorld.enemies, active);
}
