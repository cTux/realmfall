import { act } from 'react';
import { createGame } from '../../../game/state';
import {
  flushAnimationFrame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe('App hover behavior', () => {
  it('deduplicates expensive pointermove hover work by hex and skips non-actionable tiles', async () => {
    const game = createGame(3, 'app-hover-dedup-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'forge',
      items: [],
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 2,
      elite: false,
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const stateModule = await import('../../../game/state');
    const tooltipModule = await import('../../../ui/tooltips');
    const getEnemiesAtSpy = vi.spyOn(stateModule, 'getEnemiesAt');
    const getSafePathToTileSpy = vi.spyOn(stateModule, 'getSafePathToTile');
    const hexAtPointSpy = vi.spyOn(stateModule, 'hexAtPoint');
    const enemyTooltipSpy = vi.spyOn(tooltipModule, 'enemyTooltip');
    const structureTooltipSpy = vi.spyOn(tooltipModule, 'structureTooltip');

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    getEnemiesAtSpy.mockClear();
    getSafePathToTileSpy.mockClear();
    hexAtPointSpy.mockReturnValue({ q: 0, r: 0 });
    enemyTooltipSpy.mockClear();
    structureTooltipSpy.mockClear();

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 320,
          clientY: 240,
        }),
      );
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 320,
          clientY: 240,
        }),
      );
    });
    await flushAnimationFrame();

    expect(getEnemiesAtSpy).not.toHaveBeenCalled();
    expect(getSafePathToTileSpy).not.toHaveBeenCalled();
    expect(enemyTooltipSpy).not.toHaveBeenCalled();
    expect(structureTooltipSpy).not.toHaveBeenCalled();

    getEnemiesAtSpy.mockClear();
    getSafePathToTileSpy.mockClear();
    hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });
    enemyTooltipSpy.mockClear();
    structureTooltipSpy.mockClear();

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 400,
          clientY: 240,
        }),
      );
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 400,
          clientY: 240,
        }),
      );
    });
    await flushAnimationFrame();

    expect(getEnemiesAtSpy).toHaveBeenCalledTimes(1);
    expect(getSafePathToTileSpy).not.toHaveBeenCalled();
    expect(enemyTooltipSpy).toHaveBeenCalledTimes(1);
    expect(structureTooltipSpy).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10000);

  it('treats distant hostile target hexes as actionable when the route stays safe', async () => {
    const game = createGame(4, 'app-hover-distant-hostile-seed');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Bandit',
      coord: { q: 2, r: 0 },
      tier: 2,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 5,
      elite: false,
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const stateModule = await import('../../../game/state');
    const tooltipModule = await import('../../../ui/tooltips');
    const getEnemiesAtSpy = vi.spyOn(stateModule, 'getEnemiesAt');
    const getSafePathToTileSpy = vi.spyOn(stateModule, 'getSafePathToTile');
    const hexAtPointSpy = vi.spyOn(stateModule, 'hexAtPoint');
    const enemyTooltipSpy = vi.spyOn(tooltipModule, 'enemyTooltip');

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    getEnemiesAtSpy.mockClear();
    getSafePathToTileSpy.mockClear();
    enemyTooltipSpy.mockClear();
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 420,
          clientY: 220,
        }),
      );
    });
    await flushAnimationFrame();

    expect(getSafePathToTileSpy).toHaveBeenCalledTimes(1);
    expect(getEnemiesAtSpy).toHaveBeenCalledTimes(1);
    expect(enemyTooltipSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10000);
});
