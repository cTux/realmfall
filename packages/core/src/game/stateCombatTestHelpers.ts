import { createGame } from './state';
import type { GameState } from './stateTypes';

export function createCombatEncounterGame(seed: string) {
  return createGame(3, seed);
}

export function seedCombatEncounter(
  game: GameState,
  enemy: Omit<GameState['enemies'][string], 'coord'> & {
    coord?: { q: number; r: number };
  },
  overrides: Partial<GameState['tiles'][string]> = {},
) {
  const target = enemy.coord ?? { q: 2, r: 0 };
  const enemyId = enemy.id;

  game.tiles[`${target.q},${target.r}`] = {
    coord: target,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [enemyId],
    ...overrides,
  };
  game.enemies[enemyId] = {
    ...enemy,
    coord: target,
  };
  game.player.coord = { q: 1, r: 0 };

  return target;
}
