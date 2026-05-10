import { WORLD_REVEAL_RADIUS } from '@realmfall/core/game/config';
import { createGame } from '@realmfall/core/game/state';
import type { Enemy } from '@realmfall/core/game/stateTypes';
import { buildWorldHoverAnalysisState } from './worldHoverAnalysisTypes';

describe('buildWorldHoverAnalysisState', () => {
  it('syncs only a nearby hover analysis slice', () => {
    const game = createGame(4, 'hover-analysis-builder');
    game.radius = 2;
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['near-enemy'],
    };
    game.tiles['6,0'] = {
      coord: { q: 6, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['far-enemy'],
    };

    const nearEnemy: Enemy = {
      id: 'near-enemy',
      name: 'Near Enemy',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 1,
      xp: 0,
      elite: false,
    };
    const farEnemy: Enemy = {
      id: 'far-enemy',
      name: 'Far Enemy',
      coord: { q: 6, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 1,
      xp: 0,
      elite: false,
    };
    game.enemies['near-enemy'] = nearEnemy;
    game.enemies['far-enemy'] = farEnemy;

    const hoverState = buildWorldHoverAnalysisState(game);

    expect(Object.keys(hoverState).sort()).toEqual([
      'combat',
      'enemies',
      'gameOver',
      'player',
      'radius',
      'revealRadius',
      'tiles',
    ]);
    expect(hoverState.revealRadius).toBe(WORLD_REVEAL_RADIUS);
    expect(hoverState.tiles).toHaveProperty('2,0');
    expect(hoverState.tiles).not.toHaveProperty('6,0');
    expect(hoverState.enemies).toHaveProperty('near-enemy');
    expect(hoverState.enemies).not.toHaveProperty('far-enemy');
  });
});
