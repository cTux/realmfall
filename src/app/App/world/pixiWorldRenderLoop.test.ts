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
  createWorldRenderFrame,
  createWorldRenderSnapshot,
} from './pixiWorldRenderLoop';

describe('pixiWorldRenderLoop', () => {
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
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createWorldRenderSnapshot() },
    });

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    setWorldIconTextureVersion(1);
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);

    performanceNowSpy.mockRestore();
  });
});
