import { createGame } from '../../game/state';

vi.mock('pixi.js', () => ({
  ImageSource: class MockImageSource {
    constructor(public options: unknown) {}
  },
  Texture: class MockTexture {
    static from = vi.fn((icon: string) => ({ icon }));

    constructor(public options: unknown) {}
  },
}));

describe('worldIcons', () => {
  it('preloads only core and visible marker icons for the current viewport', async () => {
    const {
      WorldIcons,
      enemyIconFor,
      getVisibleWorldIconAssetIds,
      structureIconFor,
    } = await import('./worldIcons');

    const game = createGame(2, 'world-icons-visible-assets');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'ghostline',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken', enemyId: 'faction-npc:1' },
      },
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 2,
      maxHp: 2,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const icons = getVisibleWorldIconAssetIds(game, [game.tiles['1,0']]);

    expect(icons).toEqual(
      expect.arrayContaining([
        WorldIcons.Player,
        WorldIcons.Castle,
        WorldIcons.Village,
        enemyIconFor(game.enemies['enemy-1,0-0']),
      ]),
    );
    expect(icons).not.toContain(structureIconFor('town'));
  });
});
