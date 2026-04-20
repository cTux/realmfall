import { vi } from 'vitest';
import { loadI18n } from '../i18n';

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

if (typeof HTMLCanvasElement !== 'undefined') {
  const context2dStub = {
    canvas: null,
    clearRect: vi.fn(),
    createImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
    getLineDash: vi.fn(() => []),
    getTransform: vi.fn(() => ({ a: 1, d: 1, e: 0, f: 0 })),
    lineTo: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    moveTo: vi.fn(),
    putImageData: vi.fn(),
    rect: vi.fn(),
    resetTransform: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    strokeText: vi.fn(),
    transform: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    clip: vi.fn(),
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: vi.fn(function mockGetContext(
      this: HTMLCanvasElement,
      contextId: string,
    ) {
      if (contextId !== '2d') return null;

      return {
        ...context2dStub,
        canvas: this,
      } as unknown as CanvasRenderingContext2D;
    }),
  });
}

await loadI18n();
