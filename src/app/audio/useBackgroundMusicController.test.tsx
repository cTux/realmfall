import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { useBackgroundMusicController } from './useBackgroundMusicController';

const {
  loadMock,
  muteMock,
  setVolumeMock,
  unmuteMock,
} = vi.hoisted(() => ({
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
    expect(setVolumeMock).toHaveBeenCalledWith(DEFAULT_AUDIO_SETTINGS.volume);
    expect(unmuteMock).toHaveBeenCalled();

    document.body.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );

    expect(loadMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={{ ...DEFAULT_AUDIO_SETTINGS, muted: true }}
          mood="combat"
        />,
      );
    });

    expect(muteMock).toHaveBeenCalled();
    expect(loadMock).toHaveBeenCalledTimes(2);
  });
});

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
