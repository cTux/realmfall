import { vi } from 'vitest';

const {
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  setWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
} = vi.hoisted(() => {
  let iconTextureVersion = 0;

  return {
    getReachableWorldIconAssetIds: vi.fn(() => ['move-buffer-icon']),
    getWorldIconTextureVersion: () => iconTextureVersion,
    setWorldIconTextureVersion: (nextVersion: number) => {
      iconTextureVersion = nextVersion;
    },
    warmWorldIconTexturesInBackground: vi.fn(),
  };
});

vi.mock('../../../ui/world/worldIcons', () => ({
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
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
  beforeEach(() => {
    getReachableWorldIconAssetIds.mockClear();
    warmWorldIconTexturesInBackground.mockClear();
  });

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

  it('warms reachable icon assets when the player position changes', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } }, radius: 2 };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();

    expect(warmWorldIconTexturesInBackground).not.toHaveBeenCalled();

    game.player.coord = { q: 1, r: 0 };
    renderFrame();

    expect(getReachableWorldIconAssetIds).toHaveBeenCalledWith(game);
    expect(warmWorldIconTexturesInBackground).toHaveBeenCalledWith([
      'move-buffer-icon',
    ]);

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

  it('re-renders when the player movement cooldown changes', () => {
    let now = 500;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: null as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 0, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();
    movementCooldownEndAtRef.current = 1_500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementCooldown: {
        endAtMs: 1_500,
      },
    });

    now = 1_500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(renderScene.mock.calls[2]?.[8]).toMatchObject({
      movementCooldown: {
        endAtMs: 1_500,
      },
    });

    performanceNowSpy.mockRestore();
  });

  it('keeps cooldown redraws on wall-clock time while world animation is paused', () => {
    let now = 500;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: 1_500 as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 0, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: true },
      pausedAnimationMsRef: { current: 400 },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();
    now = 1_000;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[0]?.[8]).toMatchObject({
      movementCooldown: {
        nowMs: 500,
      },
    });
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementCooldown: {
        nowMs: 1_000,
      },
    });

    performanceNowSpy.mockRestore();
  });

  it('re-renders while a world movement transition is active and drops it after expiry', () => {
    let now = 0;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 1, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 1, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementTransitionRef: {
        current: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          nowMs: 0,
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      },
    } as never);

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    now = 500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementTransition: {
        durationMs: 1_000,
        fromCoord: { q: 0, r: 0 },
        nowMs: 500,
        toCoord: { q: 1, r: 0 },
      },
    });

    now = 1_000;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(renderScene.mock.calls[2]?.[8]).not.toHaveProperty(
      'movementTransition',
    );

    performanceNowSpy.mockRestore();
  });
});
