import { vi } from 'vitest';

const { getWorldIconTextureVersion, setWorldIconTextureVersion } = vi.hoisted(
  () => {
    let iconTextureVersion = 0;

    return {
      getWorldIconTextureVersion: () => iconTextureVersion,
      setWorldIconTextureVersion: (nextVersion: number) => {
        iconTextureVersion = nextVersion;
      },
    };
  },
);

vi.mock('../../../ui/world/worldIcons', () => ({
  getWorldIconTextureVersion,
}));

import {
  WORLD_ANIMATION_FPS,
  configureWorldTickerCadence,
  createWorldRenderFrame,
} from './pixiWorldRenderLoop';
import { createInitialWorldRenderSnapshot } from './worldRenderSnapshot';
import {
  DEFAULT_WORLD_RENDER_FPS,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
} from '../../graphicsSettings';

describe('pixiWorldRenderLoop', () => {
  it('caps Pixi ticker wakeups to the selected world render FPS', () => {
    const ticker = { maxFPS: 0 };

    configureWorldTickerCadence(ticker, 144);

    expect(ticker.maxFPS).toBe(144);
  });

  it('clamps Pixi ticker wakeups to the supported world render FPS range', () => {
    const ticker = { maxFPS: 0 };

    configureWorldTickerCadence(ticker, 12);
    expect(ticker.maxFPS).toBe(MIN_WORLD_RENDER_FPS);

    configureWorldTickerCadence(ticker, 999);
    expect(ticker.maxFPS).toBe(MAX_WORLD_RENDER_FPS);
  });

  it('defaults the world render FPS to the minimum supported cadence', () => {
    expect(WORLD_ANIMATION_FPS).toBe(DEFAULT_WORLD_RENDER_FPS);
  });

  it('re-renders when world icon textures finish loading after the first frame', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const hoveredMove = null;
    const hoveredSafePath = null;
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: hoveredMove },
      hoveredSafePathRef: { current: hoveredSafePath },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    setWorldIconTextureVersion(1);
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);

    performanceNowSpy.mockRestore();
  });

  it('re-renders when terrain backgrounds are toggled', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const showTerrainBackgroundsRef = { current: true };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef,
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    showTerrainBackgroundsRef.current = false;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toEqual({
      showTerrainBackgrounds: false,
      worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    });

    performanceNowSpy.mockRestore();
  });

  it('uses the selected render FPS for animation buckets', () => {
    let now = 0;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: 120 },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    now = 10;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      worldRenderFps: 120,
    });

    performanceNowSpy.mockRestore();
  });
});
