import { createGame, type Tile } from '../../game/state';
import { resolveMusicArea, shuffleTracks, type MusicTrack } from './musicLibrary';

describe('musicLibrary', () => {
  it('prefers combat music over location-based playlists', () => {
    const game = createGame(2, 'music-area-combat');

    expect(
      resolveMusicArea({
        combat: game.combat ?? {
          coord: { q: 0, r: 0 },
          enemyIds: [],
          started: false,
          player: {
            abilityIds: [],
            globalCooldownMs: 0,
            globalCooldownEndsAt: 0,
            cooldownEndsAt: {},
            casting: null,
          },
          enemies: {},
        },
        currentTile: {
          ...game.tiles['0,0']!,
          structure: 'town',
        },
      }),
    ).toBe('combat');
  });

  it('selects dungeon, town, faction, and ambient playlists from the current tile', () => {
    const game = createGame(2, 'music-area-structure');
    const baseTile = game.tiles['0,0'] as Tile;

    expect(
      resolveMusicArea({
        combat: null,
        currentTile: { ...baseTile, structure: 'dungeon' },
      }),
    ).toBe('dungeon');

    expect(
      resolveMusicArea({
        combat: null,
        currentTile: { ...baseTile, structure: 'town' },
      }),
    ).toBe('town');

    expect(
      resolveMusicArea({
        combat: null,
        currentTile: {
          ...baseTile,
          claim: {
            ownerId: 'faction-1',
            ownerName: 'Ashen Banner',
            ownerType: 'faction',
            borderColor: '#ffffff',
          },
        },
      }),
    ).toBe('town');

    expect(
      resolveMusicArea({
        combat: null,
        currentTile: baseTile,
      }),
    ).toBe('ambient');
  });

  it('shuffles tracks without changing membership', () => {
    const tracks: MusicTrack[] = [
      { area: 'ambient', id: '1', label: 'One', src: 'one.mp3' },
      { area: 'ambient', id: '2', label: 'Two', src: 'two.mp3' },
      { area: 'ambient', id: '3', label: 'Three', src: 'three.mp3' },
    ];

    const shuffled = shuffleTracks(tracks, () => 0);

    expect(shuffled.map((track) => track.id)).toEqual(['2', '3', '1']);
    expect(shuffled).toHaveLength(tracks.length);
    expect(new Set(shuffled.map((track) => track.id))).toEqual(
      new Set(tracks.map((track) => track.id)),
    );
  });
});
