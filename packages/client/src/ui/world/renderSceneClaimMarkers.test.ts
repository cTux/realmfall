import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getMarkerLayer,
  MockContainer,
  MockSprite,
  playerIcon,
  setupRenderSceneTestEnvironment,
  wolfHeadIcon,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene claim markers', () => {
  it('uses NPC marker icon on faction claim tiles', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons } = await import('./worldIcons');
    const game = createGame(1, 'render-scene-faction-npc-icon');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['faction-npc:2'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken', enemyId: 'faction-npc:2' },
      },
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );

    expect(markerWrappers).toHaveLength(1);

    const markerChildren = markerWrappers[0].children as Array<{
      icon: string;
    }>;
    expect(markerChildren.length).toBe(6);
    expect(
      markerChildren.every((sprite) => sprite.icon === WorldIcons.Village),
    ).toBe(true);
    expect(markerChildren.every((sprite) => sprite.icon !== wolfHeadIcon)).toBe(
      true,
    );
    expect(markerChildren.every((sprite) => sprite.icon !== playerIcon)).toBe(
      true,
    );
  });

  it('uses castle icon on faction-owned town tiles', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons } = await import('./worldIcons');
    const game = createGame(1, 'render-scene-faction-town-icon');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: [],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );

    expect(markerWrappers).toHaveLength(1);

    const markerChildren = markerWrappers[0].children as Array<{
      icon: string;
    }>;
    expect(markerChildren.length).toBe(6);
    expect(
      markerChildren.every((sprite) => sprite.icon === WorldIcons.Castle),
    ).toBe(true);
  });

  it('does not render world markers underneath the player icon', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(0, 'render-scene-player-tile-markers');
    game.tiles['0,0'] = {
      coord: { q: 0, r: 0 },
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: ['player-tile-raider'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken', enemyId: 'player-tile-raider' },
      },
    };
    game.enemies['player-tile-raider'] = {
      id: 'player-tile-raider',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 0, r: 0 },
      tier: 2,
      hp: 5,
      maxHp: 5,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const markerSprites = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockSprite => child instanceof MockSprite,
    );

    expect(markerSprites).toHaveLength(0);
  });

  it('renders a forgotten-loot marker on empty hexes that still have ground loot', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons } = await import('./worldIcons');
    const game = createGame(1, 'render-scene-forgotten-loot-marker');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'forgotten-loot-gold',
          name: 'Gold',
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      enemyIds: [],
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const markerSprites = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockSprite => child instanceof MockSprite,
    );
    const forgottenLootMarker = markerSprites.find(
      (child) => child.icon === WorldIcons.ForgottenLoot,
    );

    expect(forgottenLootMarker).toBeDefined();
  });
});
