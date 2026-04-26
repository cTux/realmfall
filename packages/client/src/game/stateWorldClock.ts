import { t } from '../i18n';
import { BLOOD_MOON_CHANCE, HARVEST_MOON_CHANCE } from './config';
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
import { processPlayerStatusEffects } from './stateSurvival';
import type { GameState } from './types';

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
      syncEnemyBloodMoonState(next.enemies, true);
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
    syncEnemyBloodMoonState(next.enemies, false);
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
  const next = copyGameState(state, { player: true });
  next.worldTimeMs = worldTimeMs;

  if (!processPlayerStatusEffects(next)) {
    return state;
  }

  return next;
}
