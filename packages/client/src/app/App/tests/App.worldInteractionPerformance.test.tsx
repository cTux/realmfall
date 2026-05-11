import { act } from 'react';
import type { Application } from 'pixi.js';
import { createGame } from '@realmfall/core/game/stateFactory';
import { WORLD_REVEAL_RADIUS } from '../../constants';
import {
  flushAnimationFrame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestkit';
import type { createEmptyWorldHoverSnapshot } from '../usePixiWorldHover';
import type { createWorldHoverInteractions } from '../world/pixiWorldHoverInteractions';

type MockedWorldHoverSource = {
  analyze: ReturnType<typeof vi.fn>;
  createWorkerWorldHoverAnalysisSource: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  syncState: ReturnType<typeof vi.fn>;
};

type WithMockedWorldHoverSourceConfig = {
  createWorldHoverInteractions: typeof createWorldHoverInteractions;
  createEmptyWorldHoverSnapshot: typeof createEmptyWorldHoverSnapshot;
} & MockedWorldHoverSource & {
    source: {
      analyze: ReturnType<typeof vi.fn>;
      dispose: ReturnType<typeof vi.fn>;
      syncState: ReturnType<typeof vi.fn>;
    };
  };

const WORLD_HOVER_ANALYSIS_SOURCE_PATH =
  '../world/hoverAnalysis/createWorkerWorldHoverAnalysisSource';

const createMockedWorldHoverSource = () => {
  const syncState = vi.fn(async () => undefined);
  const analyze = vi.fn(async () => ({
    actionable: false,
    safePath: null,
  }));
  const dispose = vi.fn(async () => undefined);
  const createWorkerWorldHoverAnalysisSource = vi.fn().mockReturnValue({
    analyze,
    syncState,
    dispose,
  });

  return {
    analyze,
    createWorkerWorldHoverAnalysisSource,
    dispose,
    syncState,
  };
};

const withMockedWorldHoverSource = async ({
  configureSource,
}: {
  configureSource: (source: WithMockedWorldHoverSourceConfig) => Promise<void>;
}): Promise<void> => {
  const source = createMockedWorldHoverSource();
  const sourceInstance = {
    analyze: source.analyze,
    dispose: source.dispose,
    syncState: source.syncState,
  };

  try {
    vi.doMock(WORLD_HOVER_ANALYSIS_SOURCE_PATH, () => ({
      createWorkerWorldHoverAnalysisSource:
        source.createWorkerWorldHoverAnalysisSource,
    }));

    const { createWorldHoverInteractions } =
      await import('../world/pixiWorldHoverInteractions');
    const { createEmptyWorldHoverSnapshot } =
      await import('../usePixiWorldHover');

    await configureSource({
      ...source,
      source: sourceInstance,
      createWorldHoverInteractions,
      createEmptyWorldHoverSnapshot,
    });
  } finally {
    vi.resetModules();
  }
};

describe('App world interaction performance', () => {
  describe('hover analysis worker controller', () => {
    it('does not sync hover analysis state while hover is idle', async () => {
      await withMockedWorldHoverSource({
        async configureSource({
          createWorldHoverInteractions,
          createEmptyWorldHoverSnapshot,
          createWorkerWorldHoverAnalysisSource,
        }) {
          const game = createGame(3, 'hover-idle-refresh-seed');

          const controller = createWorldHoverInteractions({
            app: {
              screen: { width: 800, height: 600 },
            } as unknown as Application,
            canvas: document.createElement('canvas'),
            enemyWorldTooltip: vi.fn(() => null),
            gameRef: { current: game },
            getScenePoint: () => ({ x: 0, y: 0 }),
            hoverAnalysisCacheRef: { current: new Map() },
            hoverAnalysisVersionRef: { current: 1 },
            hoverFrameRef: { current: null },
            hoverPointerRef: { current: null },
            hoverSnapshotRef: {
              current: createEmptyWorldHoverSnapshot(1),
            },
            hoveredMoveRef: { current: null },
            hoveredSafePathRef: { current: null },
            playerCoordRef: { current: game.player.coord },
            movementTransitionRef: undefined,
            renderInvalidationRef: { current: 0 },
            setTooltip: vi.fn(),
            showTooltipTagsRef: { current: false },
            structureWorldTooltip: vi.fn(() => null),
            tooltipPositionRef: { current: null },
            worldTooltipKeyRef: { current: null },
          });

          const source =
            createWorkerWorldHoverAnalysisSource.mock.results[0]?.value;
          expect(source).toBeTruthy();

          source.syncState.mockClear();
          controller.refreshHoverAnalysis();
          expect(source.syncState).not.toHaveBeenCalled();

          controller.dispose();
        },
      });
    });

    it('refreshes the hovered target without redispatching a canvas pointer event', async () => {
      await withMockedWorldHoverSource({
        async configureSource({
          createWorldHoverInteractions,
          createEmptyWorldHoverSnapshot,
          createWorkerWorldHoverAnalysisSource,
        }) {
          const game = createGame(3, 'hover-refresh-direct-processing-seed');
          game.tiles['1,0'] = {
            coord: { q: 1, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [],
          };
          game.tiles['2,0'] = {
            coord: { q: 2, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [],
          };

          const hexModule = await import('@realmfall/core/game/hex');
          const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
          hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

          const canvas = document.createElement('canvas');
          const dispatchEventSpy = vi.spyOn(canvas, 'dispatchEvent');
          const hoverPointerRef = { current: { clientX: 48, clientY: 64 } };
          const hoverAnalysisCacheRef = { current: new Map() };
          const hoverSnapshotRef = {
            current: createEmptyWorldHoverSnapshot(1),
          };
          const hoverAnalysisVersionRef = { current: 1 };

          const controller = createWorldHoverInteractions({
            app: {
              screen: { width: 800, height: 600 },
            } as unknown as Application,
            canvas,
            enemyWorldTooltip: vi.fn(() => null),
            gameRef: { current: game },
            getScenePoint: () => ({ x: 0, y: 0 }),
            hoverAnalysisCacheRef,
            hoverAnalysisVersionRef,
            hoverFrameRef: { current: null },
            hoverPointerRef,
            hoverSnapshotRef,
            hoveredMoveRef: { current: null },
            hoveredSafePathRef: { current: null },
            playerCoordRef: { current: game.player.coord },
            movementTransitionRef: undefined,
            renderInvalidationRef: { current: 0 },
            setTooltip: vi.fn(),
            showTooltipTagsRef: { current: false },
            structureWorldTooltip: vi.fn(() => null),
            tooltipPositionRef: { current: null },
            worldTooltipKeyRef: { current: null },
          });

          const source =
            createWorkerWorldHoverAnalysisSource.mock.results[0]?.value;
          expect(source).toBeTruthy();
          source.analyze.mockResolvedValue({
            actionable: true,
            safePath: [
              { q: 1, r: 0 },
              { q: 2, r: 0 },
            ],
          });

          game.tiles = {
            ...game.tiles,
            '1,0': {
              ...game.tiles['1,0'],
              terrain: 'mountain',
            },
          };

          source.analyze.mockClear();
          source.syncState.mockClear();
          dispatchEventSpy.mockClear();

          await act(async () => {
            controller.refreshHoverAnalysis();
            await Promise.resolve();
            await Promise.resolve();
          });

          expect(source.syncState).toHaveBeenCalledTimes(1);
          expect(dispatchEventSpy).not.toHaveBeenCalled();
          expect(source.analyze).toHaveBeenCalledTimes(1);
          expect(source.analyze).toHaveBeenCalledWith({ q: 2, r: 0 });
          expect(canvas.style.cursor).toBe('pointer');
          expect(hoverSnapshotRef.current.target).toEqual({ q: 2, r: 0 });
          expect(hoverSnapshotRef.current.clickable).toBe(true);

          controller.dispose();
          dispatchEventSpy.mockRestore();
          hexAtPointSpy.mockRestore();
        },
      });
    });

    it('keeps live pointer moves requestAnimationFrame-throttled', async () => {
      await withMockedWorldHoverSource({
        async configureSource({
          createWorldHoverInteractions,
          createEmptyWorldHoverSnapshot,
          createWorkerWorldHoverAnalysisSource,
        }) {
          const game = createGame(3, 'hover-pointermove-raf-seed');
          game.tiles['1,0'] = {
            coord: { q: 1, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [],
          };
          game.tiles['2,0'] = {
            coord: { q: 2, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [],
          };

          const hexModule = await import('@realmfall/core/game/hex');
          const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
          hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

          const getScenePoint = vi.fn((x: number, y: number) => ({ x, y }));
          const hoverFrameRef = { current: null as number | null };
          const controller = createWorldHoverInteractions({
            app: {
              screen: { width: 800, height: 600 },
            } as unknown as Application,
            canvas: document.createElement('canvas'),
            enemyWorldTooltip: vi.fn(() => null),
            gameRef: { current: game },
            getScenePoint,
            hoverAnalysisCacheRef: { current: new Map() },
            hoverAnalysisVersionRef: { current: 1 },
            hoverFrameRef,
            hoverPointerRef: { current: null },
            hoverSnapshotRef: {
              current: createEmptyWorldHoverSnapshot(1),
            },
            hoveredMoveRef: { current: null },
            hoveredSafePathRef: { current: null },
            playerCoordRef: { current: game.player.coord },
            movementTransitionRef: undefined,
            renderInvalidationRef: { current: 0 },
            setTooltip: vi.fn(),
            showTooltipTagsRef: { current: false },
            structureWorldTooltip: vi.fn(() => null),
            tooltipPositionRef: { current: null },
            worldTooltipKeyRef: { current: null },
          });

          const source =
            createWorkerWorldHoverAnalysisSource.mock.results[0]?.value;
          expect(source).toBeTruthy();

          source.analyze.mockClear();
          controller.queuePointerMove({ clientX: 24, clientY: 32 });
          controller.queuePointerMove({ clientX: 96, clientY: 128 });

          expect(getScenePoint).not.toHaveBeenCalled();
          expect(source.analyze).not.toHaveBeenCalled();
          expect(hoverFrameRef.current).not.toBeNull();

          await flushAnimationFrame();

          expect(getScenePoint).toHaveBeenCalledTimes(1);
          expect(getScenePoint).toHaveBeenCalledWith(96, 128);
          expect(source.analyze).toHaveBeenCalledTimes(1);
          expect(source.analyze).toHaveBeenCalledWith({ q: 2, r: 0 });
          expect(hoverFrameRef.current).toBeNull();

          controller.dispose();
          hexAtPointSpy.mockRestore();
        },
      });
    });

    it('skips hover refresh work when the nearby hover state is unchanged', async () => {
      await withMockedWorldHoverSource({
        async configureSource({
          createWorldHoverInteractions,
          createEmptyWorldHoverSnapshot,
          createWorkerWorldHoverAnalysisSource,
        }) {
          const game = createGame(3, 'hover-slice-reuse-seed');

          const hoverPointerRef = { current: { clientX: 10, clientY: 10 } };
          const hoverAnalysisCacheRef = { current: new Map() };
          const hoverSnapshotRef = {
            current: createEmptyWorldHoverSnapshot(1),
          };
          const hoverAnalysisVersionRef = { current: 1 };
          hoverAnalysisCacheRef.current.set(
            'persisted-hover',
            createEmptyWorldHoverSnapshot(1),
          );

          const controller = createWorldHoverInteractions({
            app: {
              screen: { width: 800, height: 600 },
            } as unknown as Application,
            canvas: document.createElement('canvas'),
            enemyWorldTooltip: vi.fn(() => null),
            gameRef: { current: game },
            getScenePoint: () => ({ x: 0, y: 0 }),
            hoverAnalysisCacheRef,
            hoverAnalysisVersionRef,
            hoverFrameRef: { current: null },
            hoverPointerRef,
            hoverSnapshotRef,
            hoveredMoveRef: { current: null },
            hoveredSafePathRef: { current: null },
            playerCoordRef: { current: game.player.coord },
            movementTransitionRef: undefined,
            renderInvalidationRef: { current: 0 },
            setTooltip: vi.fn(),
            showTooltipTagsRef: { current: false },
            structureWorldTooltip: vi.fn(() => null),
            tooltipPositionRef: { current: null },
            worldTooltipKeyRef: { current: null },
          });

          const source =
            createWorkerWorldHoverAnalysisSource.mock.results[0]?.value;
          expect(source).toBeTruthy();

          const initialVersion = hoverAnalysisVersionRef.current;
          source.syncState.mockClear();
          controller.refreshHoverAnalysis();
          expect(source.syncState).not.toHaveBeenCalled();
          expect(hoverAnalysisVersionRef.current).toBe(initialVersion);
          expect(hoverAnalysisCacheRef.current.size).toBe(1);

          game.tiles = {
            ...game.tiles,
            '6,0': {
              coord: { q: 6, r: 0 },
              terrain: 'plains',
              items: [],
              enemyIds: ['far-enemy'],
            },
          };
          game.enemies = {
            ...game.enemies,
            'far-enemy': {
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
            },
          };

          source.syncState.mockClear();
          controller.refreshHoverAnalysis();
          expect(source.syncState).not.toHaveBeenCalled();
          expect(hoverAnalysisVersionRef.current).toBe(initialVersion);
          expect(hoverAnalysisCacheRef.current.size).toBe(1);

          controller.dispose();
        },
      });
    });

    it('syncs hover refresh work when nearby hover-relevant state changes', async () => {
      await withMockedWorldHoverSource({
        async configureSource({
          createWorldHoverInteractions,
          createEmptyWorldHoverSnapshot,
          createWorkerWorldHoverAnalysisSource,
        }) {
          const game = createGame(3, 'hover-slice-nearby-change-seed');

          const hoverPointerRef = { current: { clientX: 10, clientY: 10 } };
          const hoverAnalysisCacheRef = { current: new Map() };
          const hoverSnapshotRef = {
            current: createEmptyWorldHoverSnapshot(1),
          };
          const hoverAnalysisVersionRef = { current: 1 };
          hoverAnalysisCacheRef.current.set(
            'persisted-hover',
            createEmptyWorldHoverSnapshot(1),
          );

          const controller = createWorldHoverInteractions({
            app: {
              screen: { width: 800, height: 600 },
            } as unknown as Application,
            canvas: document.createElement('canvas'),
            enemyWorldTooltip: vi.fn(() => null),
            gameRef: { current: game },
            getScenePoint: () => ({ x: 0, y: 0 }),
            hoverAnalysisCacheRef,
            hoverAnalysisVersionRef,
            hoverFrameRef: { current: null },
            hoverPointerRef,
            hoverSnapshotRef,
            hoveredMoveRef: { current: null },
            hoveredSafePathRef: { current: null },
            playerCoordRef: { current: game.player.coord },
            movementTransitionRef: undefined,
            renderInvalidationRef: { current: 0 },
            setTooltip: vi.fn(),
            showTooltipTagsRef: { current: false },
            structureWorldTooltip: vi.fn(() => null),
            tooltipPositionRef: { current: null },
            worldTooltipKeyRef: { current: null },
          });

          const source =
            createWorkerWorldHoverAnalysisSource.mock.results[0]?.value;
          expect(source).toBeTruthy();

          const initialVersion = hoverAnalysisVersionRef.current;
          game.tiles = {
            ...game.tiles,
            '1,0': {
              ...game.tiles['1,0'],
              terrain: 'mountain',
            },
          };

          source.syncState.mockClear();
          controller.refreshHoverAnalysis();
          expect(source.syncState).toHaveBeenCalledTimes(1);
          expect(
            source.syncState.mock.calls[0]?.[0]?.tiles['1,0']?.terrain,
          ).toBe('mountain');
          expect(hoverAnalysisVersionRef.current).toBe(initialVersion + 1);
          expect(hoverAnalysisCacheRef.current.has('persisted-hover')).toBe(
            false,
          );

          controller.dispose();
        },
      });
    });
  });

  it('skips tile generation for unrevealed distant hover targets', async () => {
    const game = createGame(3, 'app-hidden-hover-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const worldQueryModule =
      await import('@realmfall/core/game/stateWorldQueries');
    const pathfindingModule =
      await import('@realmfall/core/game/statePathfinding');
    const hexModule = await import('@realmfall/core/game/hex');
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
  }, 10_000);

  it('ignores unrevealed distant clicks before tile lookup or movement', async () => {
    const game = createGame(3, 'app-hidden-click-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const worldQueryModule =
      await import('@realmfall/core/game/stateWorldQueries');
    const pathfindingModule =
      await import('@realmfall/core/game/statePathfinding');
    const hexModule = await import('@realmfall/core/game/hex');
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

    await act(async () => {
      root.unmount();
    });
    host.remove();

    hexAtPointSpy.mockRestore();
    getSafePathToTileSpy.mockRestore();
    getTileAtSpy.mockRestore();
  }, 10_000);
});
