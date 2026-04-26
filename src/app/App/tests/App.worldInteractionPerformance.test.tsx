import { act } from 'react';
import { createGame } from '../../../game/stateFactory';
import { WORLD_REVEAL_RADIUS } from '../../constants';
import {
  flushAnimationFrame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe.skip('App world interaction performance', () => {
  it('skips tile generation for unrevealed distant hover targets', async () => {
    const game = createGame(3, 'app-hidden-hover-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const worldQueryModule = await import('../../../game/stateWorldQueries');
    const pathfindingModule = await import('../../../game/statePathfinding');
    const hexModule = await import('../../../game/hex');
    const getTileAtSpy = vi.spyOn(worldQueryModule, 'getTileAt');
    const getSafePathToTileSpy = vi.spyOn(
      pathfindingModule,
      'getSafePathToTile',
    );
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    getTileAtSpy.mockClear();
    getSafePathToTileSpy.mockClear();
    hexAtPointSpy.mockReturnValue({ q: WORLD_REVEAL_RADIUS + 2, r: 0 });

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: 480,
          clientY: 240,
        }),
      );
    });
    await flushAnimationFrame();

    expect(getTileAtSpy).not.toHaveBeenCalled();
    expect(getSafePathToTileSpy).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();

    hexAtPointSpy.mockRestore();
    getSafePathToTileSpy.mockRestore();
    getTileAtSpy.mockRestore();
  }, 2_000);

  it('ignores unrevealed distant clicks before tile lookup or movement', async () => {
    const game = createGame(3, 'app-hidden-click-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const worldQueryModule = await import('../../../game/stateWorldQueries');
    const pathfindingModule = await import('../../../game/statePathfinding');
    const movementModule = await import('../../../game/stateMovement');
    const hexModule = await import('../../../game/hex');
    const getTileAtSpy = vi.spyOn(worldQueryModule, 'getTileAt');
    const getSafePathToTileSpy = vi.spyOn(
      pathfindingModule,
      'getSafePathToTile',
    );
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    const moveAlongSafePathSpy = vi.spyOn(movementModule, 'moveAlongSafePath');
    const moveToTileSpy = vi.spyOn(movementModule, 'moveToTile');

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    getTileAtSpy.mockClear();
    getSafePathToTileSpy.mockClear();
    moveAlongSafePathSpy.mockClear();
    moveToTileSpy.mockClear();
    hexAtPointSpy.mockReturnValue({ q: WORLD_REVEAL_RADIUS + 2, r: 0 });

    await act(async () => {
      canvas?.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 7,
          clientX: 480,
          clientY: 240,
        }),
      );
      canvas?.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          pointerId: 7,
          clientX: 480,
          clientY: 240,
        }),
      );
    });

    expect(getTileAtSpy).not.toHaveBeenCalled();
    expect(getSafePathToTileSpy).not.toHaveBeenCalled();
    expect(moveToTileSpy).not.toHaveBeenCalled();
    expect(moveAlongSafePathSpy).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();

    moveToTileSpy.mockRestore();
    moveAlongSafePathSpy.mockRestore();
    hexAtPointSpy.mockRestore();
    getSafePathToTileSpy.mockRestore();
    getTileAtSpy.mockRestore();
  }, 2_000);
});
