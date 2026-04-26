import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  createPlacedWorldBossRenderGame,
  getMarkerLayer,
  getWorld,
  MockContainer,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe.skip('renderScene world boss markers', () => {
  it('renders world bosses across a dead-forest footprint', async () => {
    const { renderScene } = await import('./renderScene');
    const { enemyIconFor } = await import('./worldIcons');
    const { game } = createPlacedWorldBossRenderGame();
    const app = createMockApp(960, 720);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const world = getWorld(app);
    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const worldBossIcon = enemyIconFor('gluttony');
    const worldBossWrapper = markerWrappers.find((wrapper) =>
      (wrapper.children as Array<{ icon?: string }>).some(
        (child) => child.icon === worldBossIcon,
      ),
    );

    expect(worldBossWrapper).toBeDefined();
    const worldBossHexTints = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x7f1d1d && alpha === 0.22,
        ),
    );
    expect(worldBossHexTints.length).toBe(7);

    const worldBossSprites = (worldBossWrapper?.children ?? []) as Array<{
      icon?: string;
      width?: number;
      height?: number;
      tint?: number;
    }>;
    expect(
      worldBossSprites.some(
        (child) =>
          child.icon === worldBossIcon &&
          (child.width ?? 0) >= 75 &&
          (child.width ?? 0) < 130 &&
          (child.height ?? 0) >= 75 &&
          (child.height ?? 0) < 130 &&
          child.tint === 0xfb923c,
      ),
    ).toBe(true);
  });
});
