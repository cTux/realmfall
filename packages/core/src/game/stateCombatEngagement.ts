import { t } from '../i18n';
import { createCombatActorState } from './combat';
import { hexKey, type HexCoord } from './hex';
import { addLog } from './logs';
import { getPlayerCombatStats } from './progression';
import { isPassable } from './shared';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import type { CombatEngagementMetadata, CombatState, GameState } from './types';

export function createStartedCombatEncounter(
  state: GameState,
  {
    enemyIds,
    worldTimeMs,
    ...engagement
  }: CombatEngagementMetadata & {
    enemyIds: string[];
    worldTimeMs: number;
  },
): GameState['combat'] {
  return createCombatEncounter(state, {
    started: true,
    enemyIds,
    worldTimeMs,
    ...engagement,
  });
}

export function createPendingCombatEncounter(
  state: GameState,
  {
    enemyIds,
    worldTimeMs,
    ...engagement
  }: CombatEngagementMetadata & {
    enemyIds: string[];
    worldTimeMs: number;
  },
): GameState['combat'] {
  return createCombatEncounter(state, {
    started: false,
    enemyIds,
    worldTimeMs,
    ...engagement,
  });
}

function createCombatEncounter(
  state: GameState,
  {
    enemyIds,
    started,
    worldTimeMs,
    ...engagement
  }: CombatEngagementMetadata & {
    enemyIds: string[];
    started: boolean;
    worldTimeMs: number;
  },
) {
  if (enemyIds.length === 0) {
    return null;
  }

  addLog(state, 'combat', createImmediateEncounterMessage(enemyIds.length));

  return {
    coord: { ...engagement.stagingCoord },
    enemyIds: [...enemyIds],
    queuedEnemyIds: [],
    started,
    ...(started ? { startedAtMs: worldTimeMs } : {}),
    engagement: getCombatEngagementOrDefault({
      coord: engagement.stagingCoord,
      engagement,
    }),
    player: createCombatActorState(
      worldTimeMs,
      getPlayerCombatStats(state.player).abilityIds,
    ),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatActorState(worldTimeMs, state.enemies[enemyId]?.abilityIds),
      ]),
    ),
    enemyStateById: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatEnemyEncounterState(state, enemyId, worldTimeMs),
      ]),
    ),
  };
}

export function getCombatEngagementOrDefault(
  combat: Pick<CombatState, 'coord' | 'engagement'>,
): CombatEngagementMetadata {
  const engagement = combat.engagement ?? {
    autoStepOnVictory: false,
    engageMode: 'tile-step',
    originCoord: { ...combat.coord },
    stagingCoord: { ...combat.coord },
    targetCoord: { ...combat.coord },
  };

  return {
    autoStepOnVictory: engagement.autoStepOnVictory,
    engageMode: engagement.engageMode,
    originCoord: { ...engagement.originCoord },
    stagingCoord: { ...engagement.stagingCoord },
    targetCoord: engagement.targetCoord ? { ...engagement.targetCoord } : null,
  };
}

export function getCombatEncounterCoord(
  combat: Pick<CombatState, 'coord' | 'engagement'>,
) {
  return combat.engagement?.targetCoord ?? combat.coord;
}

export function getCombatEncounterEnemyIds(
  combat: Pick<CombatState, 'enemyIds' | 'queuedEnemyIds'>,
) {
  return [
    ...combat.enemyIds,
    ...(combat.queuedEnemyIds ?? []).filter(
      (enemyId) => !combat.enemyIds.includes(enemyId),
    ),
  ];
}

export function isEnemyInitiatedCombat(
  combat: Pick<CombatState, 'engagement'> | null | undefined,
) {
  return combat?.engagement?.engageMode === 'enemy-chase';
}

export function applyCombatVictoryAutoStep(state: GameState) {
  const targetCoord = state.combat?.engagement?.targetCoord;
  if (
    !state.combat?.engagement?.autoStepOnVictory ||
    !targetCoord ||
    sameCoord(state.player.coord, targetCoord)
  ) {
    return false;
  }

  const targetTile = state.tiles[hexKey(targetCoord)];
  if (
    !targetTile ||
    !isPassable(targetTile.terrain) ||
    targetTile.enemyIds.length > 0
  ) {
    return false;
  }

  state.player.coord = { ...targetCoord };
  return true;
}

function createImmediateEncounterMessage(enemyCount: number) {
  const encounterMessage = t(
    enemyCount === 1
      ? 'game.message.combat.encounter.one'
      : 'game.message.combat.encounter.other',
    { count: enemyCount },
  );
  const pressStartMessage = t('game.message.combat.pressStart');

  return encounterMessage
    .replace(pressStartMessage, '')
    .replace(/\s+\./g, '.')
    .trim();
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}
