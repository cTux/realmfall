import { syncActiveWorldAliases } from '@realmfall/core/game/dungeons/worldState';
import { createGame } from '@realmfall/core/game/stateFactory';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { normalizeCombatState } from './normalizeCombat';
import {
  isDayPhase,
  isFiniteNumber,
  isRecord,
  normalizeHexCoord,
} from './normalizeShared';
import {
  normalizeActiveDungeon,
  normalizeDungeonEntrances,
  normalizeWorlds,
} from './normalizeWorldState';
import { normalizeEnemies } from './normalizeEnemyState';
import { normalizePlayer } from './normalizePlayerState';
import { normalizeTiles } from './normalizeTileState';

export function normalizeLoadedGame(game: unknown): GameState | null {
  if (!isRecord(game)) {
    return null;
  }

  const baseline = createNormalizationBaseline(game);
  const homeHex = normalizeHexCoord(game.homeHex) ?? baseline.homeHex;
  const manaAnchorHex =
    normalizeHexCoord(game.manaAnchorHex) ?? baseline.manaAnchorHex;
  const player = normalizePlayer(game.player, baseline.player);
  const combat =
    game.combat === null
      ? null
      : (normalizeCombatState(game.combat) ?? baseline.combat);
  const tiles = normalizeTiles(game.tiles, baseline.tiles);
  const enemies = normalizeEnemies(game.enemies, baseline.enemies);
  const surfaceWorldId =
    typeof game.surfaceWorldId === 'string'
      ? game.surfaceWorldId
      : baseline.surfaceWorldId;
  const worlds = normalizeWorlds(game.worlds, {
    surfaceWorldId,
    surfaceTiles: tiles,
    surfaceEnemies: enemies,
  });
  const requestedActiveWorldId =
    typeof game.activeWorldId === 'string'
      ? game.activeWorldId
      : baseline.activeWorldId;
  const activeWorldId = worlds[requestedActiveWorldId]
    ? requestedActiveWorldId
    : surfaceWorldId;

  return syncActiveWorldAliases({
    ...baseline,
    seed: typeof game.seed === 'string' ? game.seed : baseline.seed,
    radius: isFiniteNumber(game.radius) ? game.radius : baseline.radius,
    surfaceWorldId,
    activeWorldId,
    worlds,
    dungeonEntrances: normalizeDungeonEntrances(game.dungeonEntrances),
    activeDungeon: normalizeActiveDungeon(game.activeDungeon),
    homeHex,
    manaAnchorHex,
    turn: isFiniteNumber(game.turn) ? game.turn : baseline.turn,
    worldTimeMs: isFiniteNumber(game.worldTimeMs)
      ? game.worldTimeMs
      : baseline.worldTimeMs,
    dayPhase: isDayPhase(game.dayPhase) ? game.dayPhase : baseline.dayPhase,
    bloodMoonActive:
      typeof game.bloodMoonActive === 'boolean'
        ? game.bloodMoonActive
        : baseline.bloodMoonActive,
    bloodMoonCheckedTonight:
      typeof game.bloodMoonCheckedTonight === 'boolean'
        ? game.bloodMoonCheckedTonight
        : baseline.bloodMoonCheckedTonight,
    bloodMoonCycle: isFiniteNumber(game.bloodMoonCycle)
      ? game.bloodMoonCycle
      : baseline.bloodMoonCycle,
    harvestMoonActive:
      typeof game.harvestMoonActive === 'boolean'
        ? game.harvestMoonActive
        : baseline.harvestMoonActive,
    harvestMoonCheckedTonight:
      typeof game.harvestMoonCheckedTonight === 'boolean'
        ? game.harvestMoonCheckedTonight
        : baseline.harvestMoonCheckedTonight,
    harvestMoonCycle: isFiniteNumber(game.harvestMoonCycle)
      ? game.harvestMoonCycle
      : baseline.harvestMoonCycle,
    lastEarthshakeDay: isFiniteNumber(game.lastEarthshakeDay)
      ? game.lastEarthshakeDay
      : baseline.lastEarthshakeDay,
    gameOver:
      typeof game.gameOver === 'boolean' ? game.gameOver : baseline.gameOver,
    playerLevelUpVisualEndsAt: isFiniteNumber(game.playerLevelUpVisualEndsAt)
      ? game.playerLevelUpVisualEndsAt
      : baseline.playerLevelUpVisualEndsAt,
    logSequence: isFiniteNumber(game.logSequence)
      ? game.logSequence
      : baseline.logSequence,
    logs: [],
    worldFloatingTextEvents: [],
    tiles,
    enemies,
    player,
    combat,
  });
}

function createNormalizationBaseline(game: Record<string, unknown>) {
  const radius = isFiniteNumber(game.radius) ? game.radius : undefined;
  const seed = typeof game.seed === 'string' ? game.seed : undefined;
  return createGame(radius, seed);
}
