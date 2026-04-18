import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useUiAudioController } from './useUiAudioController';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';

const { hoverMock } = vi.hoisted(() => ({
  hoverMock: vi.fn(),
}));

vi.mock('@rexa-developer/tiks', () => ({
  tiks: {
    click: vi.fn(),
    error: vi.fn(),
    hover: hoverMock,
    init: vi.fn(),
    mute: vi.fn(),
    notify: vi.fn(),
    pop: vi.fn(),
    setTheme: vi.fn(),
    setVolume: vi.fn(),
    success: vi.fn(),
    swoosh: vi.fn(),
    toggle: vi.fn(),
    unmute: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useUiAudioController', () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    hoverMock.mockClear();
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
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    window.matchMedia = originalMatchMedia as typeof window.matchMedia;
    host.remove();
  });

  it('keeps hover state while the pointer moves within one control', async () => {
    await act(async () => {
      root.render(
        <>
          <AudioHarness />
          <button type="button">
            <span data-testid="outer">
              <span data-testid="inner">Toggle</span>
            </span>
          </button>
        </>,
      );
    });

    const outer = host.querySelector('[data-testid="outer"]');
    const inner = host.querySelector('[data-testid="inner"]');

    expect(outer).toBeTruthy();
    expect(inner).toBeTruthy();

    outer?.dispatchEvent(
      new PointerEvent('pointerover', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    inner?.dispatchEvent(
      new PointerEvent('pointerout', {
        bubbles: true,
        relatedTarget: outer,
      }),
    );
    inner?.dispatchEvent(
      new PointerEvent('pointerover', {
        bubbles: true,
        relatedTarget: outer,
      }),
    );

    expect(hoverMock).toHaveBeenCalledTimes(1);
  });
});

function AudioHarness() {
  useUiAudioController(DEFAULT_AUDIO_SETTINGS);
  return null;
}
