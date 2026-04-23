import { resolveBackgroundMusicMood } from './backgroundMusic';
import { BACKGROUND_MUSIC_PLAYLISTS } from './backgroundMusicLibrary';
import {
  createBackgroundMusicCycleState,
  getNextBackgroundMusicTrack,
} from './backgroundMusicPlaylist';

describe('background music helpers', () => {
  it('maps combat, dungeon, town, and world tiles to the correct mood', () => {
    expect(
      resolveBackgroundMusicMood({
        combat: {
          coord: { q: 0, r: 0 },
          enemyIds: [],
          started: true,
          player: {
            abilityIds: [],
            globalCooldownMs: 0,
            globalCooldownEndsAt: 0,
            cooldownEndsAt: {},
            casting: null,
          },
          enemies: {},
        },
        currentStructure: undefined,
      }),
    ).toBe('combat');
    expect(
      resolveBackgroundMusicMood({
        combat: null,
        currentStructure: 'dungeon',
      }),
    ).toBe('dungeon');
    expect(
      resolveBackgroundMusicMood({
        combat: null,
        currentStructure: 'town',
      }),
    ).toBe('town');
    expect(
      resolveBackgroundMusicMood({
        combat: null,
        currentStructure: 'forge',
      }),
    ).toBe('ambient');
  });

  it('cycles each playlist before repeating a track', () => {
    const cycleState = createBackgroundMusicCycleState();
    const playlist = BACKGROUND_MUSIC_PLAYLISTS.ambient;
    const randomValues = [0, 0, 0.99, 0.2];
    let randomIndex = 0;
    const random = () => randomValues[randomIndex++] ?? 0;

    const firstTrack = getNextBackgroundMusicTrack(
      'ambient',
      cycleState,
      random,
    );
    const secondTrack = getNextBackgroundMusicTrack(
      'ambient',
      cycleState,
      random,
    );
    const thirdTrack = getNextBackgroundMusicTrack(
      'ambient',
      cycleState,
      random,
    );
    const fourthTrack = getNextBackgroundMusicTrack(
      'ambient',
      cycleState,
      random,
    );

    expect(new Set([firstTrack?.id, secondTrack?.id, thirdTrack?.id])).toEqual(
      new Set(playlist.map((track) => track.id)),
    );
    expect(fourthTrack?.id).not.toBe(thirdTrack?.id);
  });

  it('loads background music urls from the selected track descriptor', async () => {
    const track = getNextBackgroundMusicTrack(
      'town',
      createBackgroundMusicCycleState(),
    );

    await expect(track?.loadUrl()).resolves.toMatch(/\.mp3/);
  });
});
