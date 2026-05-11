import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const applicationInit = vi.fn(
    async (_options: { height: number; resolution?: number; width: number }) =>
      undefined,
  );
  const applicationDestroy = vi.fn();
  const attachPixiWorldInteractions = vi.fn(() => vi.fn());
  const attachPixiWorldTickerVisibilityPause = vi.fn(() => vi.fn());
  const configureWorldTickerCadence = vi.fn();
  const createWorldCameraSaveScheduler = vi.fn(() => vi.fn());
  const createWorldRenderFrame = vi.fn(() => vi.fn());
  const createWorldResizeHandler = vi.fn(() => vi.fn());
  const createWorldScenePointMapper = vi.fn(() => vi.fn());
  const ensureWorldIconTexturesLoaded = vi.fn(async () => undefined);
  const getSceneCache = vi.fn();
  const getVisibleWorldIconAssetIds = vi.fn(() => ['visible-start-icon']);
  const loadSavedWorldMapCamera = vi.fn();
  const renderScene = vi.fn();
  const warmWorldIconTexturesInBackground = vi.fn();

  return {
    applicationDestroy,
    applicationInit,
    attachPixiWorldInteractions,
    attachPixiWorldTickerVisibilityPause,
    configureWorldTickerCadence,
    createWorldCameraSaveScheduler,
    createWorldRenderFrame,
    createWorldResizeHandler,
    createWorldScenePointMapper,
    ensureWorldIconTexturesLoaded,
    getSceneCache,
    getVisibleWorldIconAssetIds,
    loadSavedWorldMapCamera,
    renderScene,
    warmWorldIconTexturesInBackground,
  };
});

vi.mock('./pixiWorldCamera', () => ({
  createWorldCameraSaveScheduler: mocks.createWorldCameraSaveScheduler,
  createWorldResizeHandler: mocks.createWorldResizeHandler,
  createWorldScenePointMapper: mocks.createWorldScenePointMapper,
  loadSavedWorldMapCamera: mocks.loadSavedWorldMapCamera,
}));

vi.mock('./pixiWorldInteractions', () => ({
  attachPixiWorldInteractions: mocks.attachPixiWorldInteractions,
}));

vi.mock('./pixiWorldRenderLoop', () => ({
  configureWorldTickerCadence: mocks.configureWorldTickerCadence,
  createWorldRenderFrame: mocks.createWorldRenderFrame,
}));

vi.mock('../../../ui/world/pixiRuntime', () => {
  class MockApplication {
    stage = {
      children: [] as unknown[],
      removeChildren: vi.fn(() => []),
    };
    screen = { height: 600, width: 800 };
    renderer = {
      resolution: 1,
      resize: vi.fn(),
    };
    ticker = {
      add: vi.fn(),
      remove: vi.fn(),
    };
    canvas = document.createElement('canvas');
    destroy = mocks.applicationDestroy;

    async init(options: {
      height: number;
      resolution?: number;
      width: number;
    }) {
      await mocks.applicationInit(options);
      this.screen = { height: options.height, width: options.width };
      this.renderer.resolution = options.resolution ?? 1;
    }
  }

  return { Application: MockApplication };
});

vi.mock('../../../ui/world/renderScene', () => ({
  renderScene: mocks.renderScene,
}));

vi.mock('../../../ui/world/worldIcons', () => ({
  ensureWorldIconTexturesLoaded: mocks.ensureWorldIconTexturesLoaded,
  getVisibleWorldIconAssetIds: mocks.getVisibleWorldIconAssetIds,
  warmWorldIconTexturesInBackground: mocks.warmWorldIconTexturesInBackground,
}));

vi.mock('../../../ui/world/worldTooltips', () => ({
  enemyWorldTooltip: 'enemy-tooltip',
  structureWorldTooltip: 'structure-tooltip',
}));

vi.mock('../../../ui/world/renderSceneCache', () => ({
  getSceneCache: mocks.getSceneCache,
}));

vi.mock('./pixiWorldTickerVisibility', () => ({
  attachPixiWorldTickerVisibilityPause:
    mocks.attachPixiWorldTickerVisibilityPause,
}));

import { bootstrapPixiWorldCanvas } from './pixiWorldBootstrap';

type BootstrapArgs = Parameters<typeof bootstrapPixiWorldCanvas>[0];

function ref<T>(current: T) {
  return { current };
}

function createBootstrapArgs(overrides: Partial<BootstrapArgs> = {}) {
  const host = document.createElement('div');

  return {
    appRef: ref(null),
    cameraSaveTimerRef: ref<number | null>(null),
    cloudTransparencyRef: ref(0),
    dragStateRef: ref(null),
    gameRef: ref({ enemies: {} }),
    hostRef: ref(host),
    hoverAnalysisCacheRef: ref(new Map()),
    hoverAnalysisControllerRef: ref(null),
    hoverAnalysisVersionRef: ref(0),
    hoverFrameRef: ref<number | null>(null),
    hoverPointerRef: ref(null),
    hoverSnapshotRef: ref(null),
    hoveredMoveRef: ref(null),
    hoveredSafePathRef: ref(null),
    initGraphicsSettings: {
      antialias: false,
      autoDensity: true,
      clearBeforeRender: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      resolutionCap: 2,
      useContextAlpha: true,
    },
    isDisposed: () => false,
    lastRenderSnapshotRef: ref(null),
    movementController: {
      getQueuedPath: () => [],
    },
    movementCooldownEndAtRef: ref<number | null>(null),
    movementTransitionRef: ref(null),
    onReady: vi.fn(),
    pausedAnimationMsRef: ref<number | null>(null),
    pausedRef: ref(false),
    playerCoordRef: ref({ q: 0, r: 0 }),
    renderInvalidationRef: ref(0),
    selectedRef: ref(null),
    setTooltip: vi.fn(),
    showCloudsRef: ref(true),
    showTerrainBackgroundsRef: ref(true),
    showTooltipTagsRef: ref(true),
    tooltipPositionRef: ref(null),
    visibleTilesRef: ref([{ coord: { q: 0, r: 0 }, enemyIds: [] }]),
    worldMapCameraRef: ref({}),
    worldRenderFpsRef: ref(60),
    worldTimeMsRef: ref(0),
    worldTooltipKeyRef: ref<string | null>(null),
    ...overrides,
  } as unknown as BootstrapArgs;
}

describe('bootstrapPixiWorldCanvas', () => {
  beforeEach(() => {
    mocks.applicationDestroy.mockReset();
    mocks.applicationInit.mockReset().mockResolvedValue(undefined);
    mocks.attachPixiWorldInteractions.mockReset().mockReturnValue(vi.fn());
    mocks.attachPixiWorldTickerVisibilityPause
      .mockReset()
      .mockReturnValue(vi.fn());
    mocks.configureWorldTickerCadence.mockReset();
    mocks.createWorldCameraSaveScheduler.mockReset().mockReturnValue(vi.fn());
    mocks.createWorldRenderFrame.mockReset().mockReturnValue(vi.fn());
    mocks.createWorldResizeHandler.mockReset().mockReturnValue(vi.fn());
    mocks.createWorldScenePointMapper.mockReset().mockReturnValue(vi.fn());
    mocks.ensureWorldIconTexturesLoaded
      .mockReset()
      .mockResolvedValue(undefined);
    mocks.getSceneCache.mockReset().mockReturnValue({
      cloudShadowSprites: { parent: {} },
      cloudSprites: { parent: {} },
      worldMap: {},
    });
    mocks.getVisibleWorldIconAssetIds
      .mockReset()
      .mockReturnValue(['visible-start-icon']);
    mocks.loadSavedWorldMapCamera.mockReset();
    mocks.renderScene.mockReset();
    mocks.warmWorldIconTexturesInBackground.mockReset();
  });

  it('starts visible icon preload without blocking Pixi init', async () => {
    let preloadResolved = false;
    let resolveVisiblePreload: (() => void) | undefined;
    mocks.ensureWorldIconTexturesLoaded.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          resolveVisiblePreload = () => {
            preloadResolved = true;
            resolve(undefined);
          };
        }),
    );

    const args = createBootstrapArgs();
    let bootstrapResolved = false;
    const bootstrapPromise = bootstrapPixiWorldCanvas(args).then(() => {
      bootstrapResolved = true;
    });

    await vi.waitFor(() => {
      expect(mocks.ensureWorldIconTexturesLoaded).toHaveBeenCalledWith([
        'visible-start-icon',
      ]);
      expect(mocks.applicationInit).toHaveBeenCalledTimes(1);
      expect(mocks.warmWorldIconTexturesInBackground).toHaveBeenCalledTimes(1);
      expect(bootstrapResolved).toBe(true);
    });

    expect(resolveVisiblePreload).toBeDefined();
    expect(preloadResolved).toBe(false);
    expect(
      mocks.ensureWorldIconTexturesLoaded.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.applicationInit.mock.invocationCallOrder[0] ?? 0);

    resolveVisiblePreload?.();
    await bootstrapPromise;
  });

  it('does not fail Pixi bootstrap when visible icon preload rejects', async () => {
    mocks.ensureWorldIconTexturesLoaded.mockRejectedValueOnce(
      new Error('visible icon preload failed'),
    );

    await expect(bootstrapPixiWorldCanvas(createBootstrapArgs())).resolves.toBe(
      undefined,
    );

    expect(mocks.applicationInit).toHaveBeenCalledTimes(1);
    expect(mocks.warmWorldIconTexturesInBackground).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await Promise.resolve();
  });
});
