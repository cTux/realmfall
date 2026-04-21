import { createGame, getEnemyAt, getTileAt, type GameState } from './state';
import { makeEnemy } from './combat';
import { hexKey } from './hex';
import { buildTile } from './world';

export function createPlacedWorldBossEncounter() {
  const game = createGame(8, 'placed-world-boss-seed');
  const center = { q: 4, r: 0 };
  const bossId = `world-boss-${hexKey(center)}`;

  game.tiles[hexKey(center)] = {
    coord: center,
    terrain: 'forest',
    items: [],
    structure: undefined,
    enemyIds: [bossId],
  };
  for (const coord of [
    { q: 5, r: 0 },
    { q: 5, r: -1 },
    { q: 4, r: -1 },
    { q: 3, r: 0 },
    { q: 3, r: 1 },
    { q: 4, r: 1 },
  ]) {
    game.tiles[hexKey(coord)] = {
      coord,
      terrain: 'forest',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
  }
  game.enemies[bossId] = makeEnemy(
    game.seed,
    center,
    'forest',
    0,
    undefined,
    false,
    { enemyId: bossId, worldBoss: true },
  );

  return { game, center, bossId };
}

export function createGeneratedWorldBossEncounter() {
  for (let seedIndex = 0; seedIndex < 32; seedIndex += 1) {
    const game = createGame(20, `generated-footprint-reservation-${seedIndex}`);

    for (let q = -20; q <= 20; q += 1) {
      for (let r = -20; r <= 20; r += 1) {
        const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
        if (distance > 20) continue;
        const coord = { q, r };
        if (
          buildTile(game.seed, coord).enemyIds.some((enemyId) =>
            enemyId.startsWith('world-boss-'),
          )
        ) {
          return { game, center: coord };
        }
      }
    }
  }

  throw new Error('Expected to find a generated world boss encounter');
}

export function findEnemy(
  game: ReturnType<typeof createGame>,
  min: number,
  max: number,
) {
  for (let q = -max; q <= max; q += 1) {
    for (let r = -max; r <= max; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance < min || distance > max) continue;
      const enemy = getEnemyAt(game, { q, r });
      if (enemy) return enemy;
    }
  }

  return undefined;
}

export function findFactionNpcTile(
  game: ReturnType<typeof createGame>,
  maxDistance: number,
) {
  for (let q = -maxDistance; q <= maxDistance; q += 1) {
    for (let r = -maxDistance; r <= maxDistance; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance > maxDistance) continue;
      const tile = getTileAt(game, { q, r });
      if (tile.claim?.npc?.enemyId) {
        return tile;
      }
    }
  }

  return undefined;
}

export function findFactionTownTile(
  game: ReturnType<typeof createGame>,
  maxDistance: number,
) {
  for (let q = -maxDistance; q <= maxDistance; q += 1) {
    for (let r = -maxDistance; r <= maxDistance; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance > maxDistance) continue;
      const tile = getTileAt(game, { q, r });
      if (tile.claim?.ownerType === 'faction' && tile.structure === 'town') {
        return tile;
      }
    }
  }

  return undefined;
}

export function makeCombatState(
  coord: { q: number; r: number },
  enemyIds: string[],
  worldTimeMs: number,
  started = true,
): GameState['combat'] {
  return {
    coord,
    enemyIds,
    started,
    player: {
      abilityIds: ['kick'],
      globalCooldownMs: 1500,
      globalCooldownEndsAt: worldTimeMs,
      cooldownEndsAt: {},
      casting: null,
    },
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: worldTimeMs,
          cooldownEndsAt: {},
          casting: null,
        },
      ]),
    ),
  };
}
