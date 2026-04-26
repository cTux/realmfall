import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { useBackgroundMusicController } from './useBackgroundMusicController';

const {
  createBackgroundMusicCycleStateMock,
  getNextBackgroundMusicTrackMock,
  loadMock,
  muteMock,
  setVolumeMock,
  unmuteMock,
} = vi.hoisted(() => ({
  createBackgroundMusicCycleStateMock: vi.fn(() => ({})),
  getNextBackgroundMusicTrackMock: vi.fn((mood: string) => ({
    id: `${mood}-track`,
    loadUrl: vi.fn(async () => `/music/${mood}.mp3`),
  })),
  loadMock: vi.fn(),
  muteMock: vi.fn(),
  setVolumeMock: vi.fn(),
  unmuteMock: vi.fn(),
}));

vi.mock('react-use-audio-player', () => ({
  useAudioPlayer: () => ({
    load: loadMock,
    mute: muteMock,
    setVolume: setVolumeMock,
    unmute: unmuteMock,
  }),
}));

vi.mock('./backgroundMusicPlaylist', () => ({
  createBackgroundMusicCycleState: createBackgroundMusicCycleStateMock,
  getNextBackgroundMusicTrack: getNextBackgroundMusicTrackMock,
}));

describe('useBackgroundMusicController', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    loadMock.mockClear();
    muteMock.mockClear();
    setVolumeMock.mockClear();
    unmuteMock.mockClear();
    createBackgroundMusicCycleStateMock.mockClear();
    getNextBackgroundMusicTrackMock.mockClear();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('waits for activation, then starts the current mood playlist and reapplies volume state', async () => {
    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          mood="ambient"
        />,
      );
    });

    expect(loadMock).not.toHaveBeenCalled();
    expect(setVolumeMock).toHaveBeenCalledWith(
      DEFAULT_AUDIO_SETTINGS.musicVolume,
    );
    expect(unmuteMock).toHaveBeenCalled();

    await act(async () => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
        }),
      );
      flushPromises();
    });

    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(loadMock).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        autoplay: true,
        html5: true,
        initialMute: false,
        initialVolume: DEFAULT_AUDIO_SETTINGS.musicVolume,
        onend: expect.any(Function),
      }),
    );

    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={{ ...DEFAULT_AUDIO_SETTINGS, muted: true }}
          mood="combat"
        />,
      );
    });
    await act(async () => {
      flushPromises();
    });

    expect(muteMock).toHaveBeenCalled();
    expect(loadMock).toHaveBeenCalledTimes(2);
  });

  it('advances to the next track when loading the selected track fails', async () => {
    getNextBackgroundMusicTrackMock
      .mockImplementationOnce((mood: string) => ({
        id: `${mood}-track-failing`,
        loadUrl: vi
          .fn()
          .mockRejectedValue(new Error('Unable to load failing track')),
      }))
      .mockImplementationOnce((mood: string) => ({
        id: `${mood}-track-next`,
        loadUrl: vi.fn(async () => `/music/${mood}-next.mp3`),
      }));

    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          mood="ambient"
        />,
      );
    });

    await act(async () => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
        }),
      );
      flushPromises();
    });

    expect(getNextBackgroundMusicTrackMock).toHaveBeenCalledTimes(2);
    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(loadMock).toHaveBeenCalledWith(
      '/music/ambient-next.mp3',
      expect.objectContaining({
        autoplay: true,
        html5: true,
        initialMute: false,
        initialVolume: DEFAULT_AUDIO_SETTINGS.musicVolume,
      }),
    );
  });
});

function flushPromises() {
  vi.runAllTicks();
}

function BackgroundMusicHarness({
  audioSettings,
  mood,
}: {
  audioSettings: typeof DEFAULT_AUDIO_SETTINGS;
  mood: 'ambient' | 'combat' | 'dungeon' | 'town';
}) {
  useBackgroundMusicController({ audioSettings, mood });
  return null;
}
