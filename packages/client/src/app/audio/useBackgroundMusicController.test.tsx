import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { useBackgroundMusicController } from './useBackgroundMusicController';

interface MockHowlInstance {
  fade: ReturnType<typeof vi.fn>;
  mute: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  volume: ReturnType<typeof vi.fn>;
  trigger(event: string, soundId?: number): void;
}

const {
  HowlMock,
  createBackgroundMusicCycleStateMock,
  getNextBackgroundMusicTrackMock,
  howlInstances,
} = vi.hoisted(() => {
  const howlInstances: MockHowlInstance[] = [];
  const createBackgroundMusicCycleStateMock = vi.fn(() => ({}));
  const getNextBackgroundMusicTrackMock = vi.fn((mood: string) => ({
    id: `${mood}-track`,
    loadUrl: vi.fn(async () => `/music/${mood}.mp3`),
  }));

  const HowlMock = vi.fn(function MockHowl() {
    const listeners = new Map<string, Set<(soundId?: number) => void>>();
    const on = (event: string, handler: (soundId?: number) => void) => {
      const current =
        listeners.get(event) ?? new Set<(soundId?: number) => void>();
      current.add(handler);
      listeners.set(event, current);
    };
    const off = (event: string, handler?: (soundId?: number) => void) => {
      if (!handler) {
        listeners.delete(event);
        return;
      }
      listeners.get(event)?.delete(handler);
    };

    const instance: MockHowlInstance = {
      fade: vi.fn(),
      mute: vi.fn(),
      off: vi.fn(off),
      once: vi.fn(on),
      play: vi.fn(() => 7),
      stop: vi.fn(),
      unload: vi.fn(),
      volume: vi.fn(),
      trigger: (event, soundId = 7) => {
        listeners.get(event)?.forEach((handler) => handler(soundId));
      },
    };

    howlInstances.push(instance);
    return instance;
  });

  return {
    HowlMock,
    createBackgroundMusicCycleStateMock,
    getNextBackgroundMusicTrackMock,
    howlInstances,
  };
});

vi.mock('howler', () => ({
  Howl: HowlMock,
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
    HowlMock.mockClear();
    howlInstances.length = 0;
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

  it('waits for activation, then creates a Howl instance and fades the selected track in', async () => {
    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          mood="ambient"
        />,
      );
    });

    expect(HowlMock).not.toHaveBeenCalled();

    await act(async () => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
        }),
      );
      await flushPromises();
    });

    expect(HowlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html5: true,
        mute: false,
        src: ['/music/ambient.mp3'],
        volume: 0,
      }),
    );
    expect(howlInstances[0]?.play).toHaveBeenCalledTimes(1);
    expect(howlInstances[0]?.fade).toHaveBeenCalledWith(
      0,
      DEFAULT_AUDIO_SETTINGS.musicVolume,
      500,
      7,
    );
  });

  it('syncs mute and music volume changes onto the active Howl instance', async () => {
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
      await flushPromises();
    });

    await act(async () => {
      root.render(
        <BackgroundMusicHarness
          audioSettings={{
            ...DEFAULT_AUDIO_SETTINGS,
            musicVolume: 0.65,
            musicMuted: true,
          }}
          mood="ambient"
        />,
      );
    });

    expect(howlInstances[0]?.volume).toHaveBeenCalledWith(0.65, 7);
    expect(howlInstances[0]?.mute).toHaveBeenCalledWith(true, 7);
  });
});

async function flushPromises() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
  await new Promise((resolve) => window.setTimeout(resolve, 0));
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
