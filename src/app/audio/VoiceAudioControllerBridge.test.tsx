import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '../../game/state';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { VoiceAudioControllerBridge } from './VoiceAudioControllerBridge';

const { getVoiceClipUrlsMock } = vi.hoisted(() => ({
  getVoiceClipUrlsMock: vi.fn(() => ['/voice/test.wav']),
}));

vi.mock('./voiceLibrary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./voiceLibrary')>()),
  getVoiceClipUrls: getVoiceClipUrlsMock,
}));

let mockAudioInstances: MockAudio[] = [];

describe('VoiceAudioControllerBridge', () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalAudio: typeof Audio;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    mockAudioInstances = [];
    originalAudio = globalThis.Audio;
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }) as typeof window.matchMedia;
    getVoiceClipUrlsMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
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
          game={previous}
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
          game={next}
        />,
      );
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
          game={next}
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
          game={previous}
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
          audioSettings={{
            ...DEFAULT_AUDIO_SETTINGS,
            respectReducedMotion: false,
          }}
          game={next}
        />,
      );
    });

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0]?.pauseMock).not.toHaveBeenCalled();

    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }) as typeof window.matchMedia;

    await act(async () => {
      root.render(
        <VoiceAudioControllerBridge
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          game={next}
        />,
      );
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
