import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '../../game/stateFactory';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { VoiceAudioControllerBridge } from './VoiceAudioControllerBridge';
import { selectVoicePlaybackEventState } from './voiceEvents';

const { getVoiceClipUrlsMock, pickVoiceClipUrlMock } = vi.hoisted(() => ({
  getVoiceClipUrlsMock: vi.fn(async () => ['/voice/test.wav']),
  pickVoiceClipUrlMock: vi.fn(async () => '/voice/test.wav'),
}));

vi.mock('./voiceLibrary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./voiceLibrary')>()),
  getVoiceClipUrls: getVoiceClipUrlsMock,
  pickVoiceClipUrl: pickVoiceClipUrlMock,
}));

let mockAudioInstances: MockAudio[] = [];

describe.skip('VoiceAudioControllerBridge', () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalAudio: typeof Audio;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let reducedMotionMediaQuery: MockMediaQueryList;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    mockAudioInstances = [];
    originalAudio = globalThis.Audio;
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    originalMatchMedia = window.matchMedia;
    reducedMotionMediaQuery = createMockMediaQueryList(false);
    window.matchMedia = vi
      .fn()
      .mockImplementation(
        () => reducedMotionMediaQuery,
      ) as typeof window.matchMedia;
    getVoiceClipUrlsMock.mockClear();
    pickVoiceClipUrlMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.useRealTimers();
    globalThis.Audio = originalAudio;
    window.matchMedia = originalMatchMedia as typeof window.matchMedia;
    host.remove();
  });

  it('stops an active voice clip when mute is enabled without a new event', async () => {
    const previous = createGame(2, 'voice-bridge-mute-previous');
    const next = createGame(2, 'voice-bridge-mute-next');
    next.player.hp = previous.player.hp - 3;

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          voicePlaybackState={selectVoicePlaybackEventState(previous)}
        />,
      );
    });

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          voicePlaybackState={selectVoicePlaybackEventState(next)}
        />,
      );
      flushPromises();
    });

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0]?.playMock).toHaveBeenCalledTimes(1);
    expect(mockAudioInstances[0]?.pauseMock).not.toHaveBeenCalled();

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={{
            ...DEFAULT_AUDIO_SETTINGS,
            muted: true,
          }}
          voicePlaybackState={selectVoicePlaybackEventState(next)}
        />,
      );
    });

    expect(mockAudioInstances[0]?.pauseMock).toHaveBeenCalledTimes(1);
  });

  it('stops an active voice clip when reduced-motion muting becomes active', async () => {
    const previous = createGame(2, 'voice-bridge-reduced-motion-previous');
    const next = createGame(2, 'voice-bridge-reduced-motion-next');
    next.player.hp = previous.player.hp - 2;

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          voicePlaybackState={selectVoicePlaybackEventState(previous)}
        />,
      );
    });

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          voicePlaybackState={selectVoicePlaybackEventState(next)}
        />,
      );
      flushPromises();
    });

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0]?.pauseMock).not.toHaveBeenCalled();

    await act(async () => {
      reducedMotionMediaQuery.setMatches(true);
    });

    expect(mockAudioInstances[0]?.pauseMock).toHaveBeenCalledTimes(1);
  });
});

class MockAudio {
  pauseMock = vi.fn();
  playMock = vi.fn(() => Promise.resolve());
  preload = '';
  volume = 1;

  constructor(public readonly src = '') {
    mockAudioInstances.push(this);
  }

  pause() {
    this.pauseMock();
  }

  play() {
    return this.playMock();
  }
}

function createMockMediaQueryList(initialMatches: boolean): MockMediaQueryList {
  const listeners = new Set<() => void>();
  let matches = initialMatches;

  return {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((eventName: string, listener: () => void) => {
      if (eventName === 'change') {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((eventName: string, listener: () => void) => {
      if (eventName === 'change') {
        listeners.delete(listener);
      }
    }),
    addListener: vi.fn((listener: () => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: () => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(() => true),
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => listener());
    },
  };
}

interface MockMediaQueryList extends MediaQueryList {
  setMatches: (matches: boolean) => void;
}

function flushPromises() {
  vi.runAllTicks();
}
