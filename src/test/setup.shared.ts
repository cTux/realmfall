import { vi } from 'vitest';
import { loadI18n } from '../i18n';
import enTranslations from '../i18n/locales/en.json';

vi.mock('react-use-audio-player', () => ({
  AudioPlayerProvider: ({ children }: { children: unknown }) => children,
  useAudioPlayer: () => ({
    cleanup: vi.fn(),
    getPosition: vi.fn(() => 0),
    isLoading: false,
    isLooping: false,
    isMuted: false,
    isPaused: true,
    isPlaying: false,
    isReady: true,
    isStopped: true,
    isUnloaded: false,
    duration: 0,
    error: undefined,
    fade: vi.fn(),
    load: vi.fn(),
    loopOff: vi.fn(),
    loopOn: vi.fn(),
    mute: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    player: null,
    rate: 1,
    seek: vi.fn(),
    setRate: vi.fn(),
    setVolume: vi.fn(),
    src: null,
    stop: vi.fn(),
    toggleLoop: vi.fn(),
    toggleMute: vi.fn(),
    togglePlayPause: vi.fn(),
    unmute: vi.fn(),
    volume: 1,
  }),
  useAudioPlayerContext: () => ({
    cleanup: vi.fn(),
    getPosition: vi.fn(() => 0),
    isLoading: false,
    isLooping: false,
    isMuted: false,
    isPaused: true,
    isPlaying: false,
    isReady: true,
    isStopped: true,
    isUnloaded: false,
    duration: 0,
    error: undefined,
    fade: vi.fn(),
    load: vi.fn(),
    loopOff: vi.fn(),
    loopOn: vi.fn(),
    mute: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    player: null,
    rate: 1,
    seek: vi.fn(),
    setRate: vi.fn(),
    setVolume: vi.fn(),
    src: null,
    stop: vi.fn(),
    toggleLoop: vi.fn(),
    toggleMute: vi.fn(),
    togglePlayPause: vi.fn(),
    unmute: vi.fn(),
    volume: 1,
  }),
}));

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

function installStorageMock(
  target: typeof globalThis,
  property: 'localStorage' | 'sessionStorage',
) {
  Object.defineProperty(target, property, {
    configurable: true,
    writable: true,
    value: createStorageMock(),
  });
}

installStorageMock(globalThis, 'localStorage');
installStorageMock(globalThis, 'sessionStorage');

vi.stubGlobal(
  'fetch',
  vi.fn(async (input: string | URL | Request) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (requestUrl.includes('/i18n/locales/en.json')) {
      return {
        ok: true,
        json: vi.fn().mockResolvedValue(enTranslations),
      };
    }

    throw new Error(`Unexpected fetch in test setup: ${requestUrl}`);
  }),
);

await loadI18n();
