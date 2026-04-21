import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useUiAudioController } from './useUiAudioController';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import type { UiAudioController } from './UiAudioContext';

const { clickMock, hoverMock, initMock, popMock, swooshMock } = vi.hoisted(
  () => ({
    clickMock: vi.fn(),
    hoverMock: vi.fn(),
    initMock: vi.fn(),
    popMock: vi.fn(),
    swooshMock: vi.fn(),
  }),
);

vi.mock('@rexa-developer/tiks', () => ({
  tiks: {
    click: clickMock,
    error: vi.fn(),
    hover: hoverMock,
    init: initMock,
    mute: vi.fn(),
    notify: vi.fn(),
    pop: popMock,
    setTheme: vi.fn(),
    setVolume: vi.fn(),
    success: vi.fn(),
    swoosh: swooshMock,
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
    clickMock.mockClear();
    hoverMock.mockClear();
    initMock.mockClear();
    popMock.mockClear();
    swooshMock.mockClear();
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
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );
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

  it('waits for a user activation before initializing ui audio', async () => {
    await act(async () => {
      root.render(
        <>
          <AudioHarness />
          <button type="button">Play</button>
        </>,
      );
    });

    const button = host.querySelector('button');

    expect(button).toBeTruthy();

    button?.dispatchEvent(
      new PointerEvent('pointerover', {
        bubbles: true,
        relatedTarget: null,
      }),
    );

    expect(initMock).not.toHaveBeenCalled();
    expect(hoverMock).not.toHaveBeenCalled();

    button?.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
  });

  it('skips disabled explicit sound events', async () => {
    let controller: UiAudioController | undefined;

    await act(async () => {
      root.render(
        <AudioHarness
          onReady={(nextController) => (controller = nextController)}
        />,
      );
    });

    document.body.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
      }),
    );

    await act(async () => {
      controller?.applySettings({
        ...DEFAULT_AUDIO_SETTINGS,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
          swoosh: false,
        },
      });
    });

    controller?.swoosh();

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(swooshMock).not.toHaveBeenCalled();
  });
});

function AudioHarness({
  onReady,
}: {
  onReady?: (controller: UiAudioController) => void;
}) {
  const controller = useUiAudioController(DEFAULT_AUDIO_SETTINGS);

  onReady?.(controller);
  return null;
}
