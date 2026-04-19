import { act } from 'react';
import {
  getWorldHexSize,
  tileToPoint,
} from '../../../ui/world/renderSceneMath';
import { mapWorldMapFishEyeSourcePointToDisplayPoint } from '../../../ui/world/worldMapFishEye';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  renderScene,
  tickerCallbacks,
} from './appTestHarness';

describe('App world input', () => {
  it('rerenders the world after actionable map input', async () => {
    const game = createHydratedAppGame();
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const screenCenter = {
      x: Math.max(window.innerWidth, 640) / 2,
      y: Math.max(window.innerHeight, 480) / 2,
    };
    const hexSize = getWorldHexSize(
      {
        width: Math.max(window.innerWidth, 640),
        height: Math.max(window.innerHeight, 480),
      },
      game.radius,
    );
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      screenCenter.x,
      screenCenter.y,
      hexSize,
    );
    const adjacentDisplayPoint = mapWorldMapFishEyeSourcePointToDisplayPoint(
      adjacentPoint,
      {
        width: Math.max(window.innerWidth, 640),
        height: Math.max(window.innerHeight, 480),
      },
      screenCenter,
    );

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: adjacentDisplayPoint.x,
          clientY: adjacentDisplayPoint.y,
        }),
      );
    });
    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: adjacentDisplayPoint.x,
          clientY: adjacentDisplayPoint.y,
        }),
      );
    });

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(renderScene.mock.calls.length).toBeGreaterThan(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('ignores horizontal wheel gestures without changing zoom', async () => {
    const game = createHydratedAppGame();
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    await act(async () => {
      canvas?.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: 320,
          clientY: 240,
          deltaX: 120,
          deltaY: 0,
        }),
      );
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(window.localStorage.getItem('settings')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
