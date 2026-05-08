import { analyzeWorldHoverTarget } from './worldHoverAnalysisRuntime';
import type { WorldHoverAnalysisState } from './worldHoverAnalysisTypes';

describe('analyzeWorldHoverTarget', () => {
  const createBaseState = (): WorldHoverAnalysisState => ({
    combat: null,
    enemies: {},
    gameOver: false,
    player: { coord: { q: 0, r: 0 } },
    radius: 3,
    revealRadius: 3,
    tiles: {
      '0,0': {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      '1,0': {
        coord: { q: 1, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      '1,-1': {
        coord: { q: 1, r: -1 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      '2,-1': {
        coord: { q: 2, r: -1 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      '2,0': {
        coord: { q: 2, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
    },
  });

  it('finds a safe path that avoids hostile adjacent tiles', () => {
    const state = createBaseState();
    state.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    state.tiles['1,0'] = {
      ...state.tiles['1,0'],
      enemyIds: ['hostile-test'],
    };
    state.enemies['hostile-test'] = {
      id: 'hostile-test',
      name: 'Hostile Test',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 8,
      maxHp: 8,
      attack: 1,
      defense: 1,
      xp: 0,
      elite: false,
    };

    expect(analyzeWorldHoverTarget(state, { q: 2, r: 0 })).toEqual({
      actionable: true,
      safePath: [
        { q: 1, r: -1 },
        { q: 2, r: -1 },
        { q: 2, r: 0 },
      ],
    });
  });

  it('returns no actionability when game is over', () => {
    const state = createBaseState();
    state.gameOver = true;

    expect(analyzeWorldHoverTarget(state, { q: 1, r: 0 })).toEqual({
      actionable: false,
      safePath: null,
    });
  });

  it('uses reveal radius to gate hover actionability', () => {
    const state = createBaseState();
    state.radius = 4;
    state.revealRadius = 1;
    state.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    expect(analyzeWorldHoverTarget(state, { q: 2, r: 0 })).toEqual({
      actionable: false,
      safePath: null,
    });
  });
});
