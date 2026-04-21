import { createGame } from './state';
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
