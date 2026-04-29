import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { DraggableWindow } from './DraggableWindow';

describe('DraggableWindow', () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  let getBoundingClientRectSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    };
    window.cancelAnimationFrame = () => undefined;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 400,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 300,
    });

    getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect(
        this: HTMLElement,
      ) {
        const left = Number(
          (
            this.style.getPropertyValue('--window-position-x') ||
            this.style.left
          ).replace('px', '') || 0,
        );
        const top = Number(
          (
            this.style.getPropertyValue('--window-position-y') || this.style.top
          ).replace('px', '') || 0,
        );
        const width = Number(this.style.width.replace('px', '') || 320);
        const height = Number(this.style.height.replace('px', '') || 220);

        return {
          x: left,
          y: top,
          left,
          top,
          width,
          height,
          right: left + width,
          bottom: top + height,
          toJSON: () => undefined,
        } as DOMRect;
      });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    getBoundingClientRectSpy.mockRestore();
  });

  it('resets a newly opened off-viewport window to the top-left safe corner', async () => {
    const onMove = vi.fn();

    await act(async () => {
      root.render(
        <DraggableWindow
          title="Offscreen"
          position={{ x: 180, y: 120, width: 320, height: 220 }}
          onMove={onMove}
        >
          <div>Content</div>
        </DraggableWindow>,
      );
    });

    expect(onMove).toHaveBeenCalledWith({
      x: 8,
      y: 8,
      width: 320,
      height: 220,
    });
  });

  it('keeps an opened window in place when it already fits inside the viewport', async () => {
    const onMove = vi.fn();

    await act(async () => {
      root.render(
        <DraggableWindow
          title="Onscreen"
          position={{ x: 40, y: 32, width: 220, height: 160 }}
          onMove={onMove}
        >
          <div>Content</div>
        </DraggableWindow>,
      );
    });

    const closeButton = host.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;

    expect(closeButton?.getAttribute('data-size')).toBe('small');
    expect(
      closeButton?.querySelector('[data-close-icon="true"]'),
    ).not.toBeNull();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('commits resized dimensions only after the resize interaction ends', async () => {
    const onMove = vi.fn();

    await act(async () => {
      root.render(
        <DraggableWindow
          title="Resizable"
          position={{ x: 40, y: 32, width: 220, height: 160 }}
          resizeBounds={{ minWidth: 180, minHeight: 120 }}
          onMove={onMove}
        >
          <div>Content</div>
        </DraggableWindow>,
      );
    });

    const resizeHandle = host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;

    expect(resizeHandle).not.toBeNull();

    await act(async () => {
      resizeHandle?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 260,
          clientY: 192,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          clientX: 320,
          clientY: 252,
        }),
      );
    });

    expect(onMove).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup'));
    });

    expect(onMove).toHaveBeenCalledWith({
      x: 40,
      y: 32,
      width: 280,
      height: 220,
    });
  });

  it('updates drag visuals through compositor position vars before commit', async () => {
    const onMove = vi.fn();

    await act(async () => {
      root.render(
        <DraggableWindow
          title="Drag Visuals"
          position={{ x: 40, y: 32, width: 220, height: 160 }}
          onMove={onMove}
        >
          <div>Content</div>
        </DraggableWindow>,
      );
    });

    const header = host.querySelector(
      'div[class*="windowHeader"]',
    ) as HTMLDivElement | null;
    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;

    expect(header).not.toBeNull();
    expect(windowElement).not.toBeNull();

    await act(async () => {
      header?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 80,
          clientY: 100,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('pointermove', {
          clientX: 140,
          clientY: 160,
        }),
      );
    });

    expect(onMove).not.toHaveBeenCalled();
    expect(windowElement?.dataset.windowInteracting).toBe('true');
    expect(windowElement?.style.getPropertyValue('--window-position-x')).toBe(
      '100px',
    );
    expect(windowElement?.style.getPropertyValue('--window-position-y')).toBe(
      '92px',
    );

    await act(async () => {
      window.dispatchEvent(new MouseEvent('pointerup'));
    });

    expect(windowElement?.dataset.windowInteracting).toBe('false');
  });

  it('brings reopened and reactivated windows to the front of their stack layer', async () => {
    await act(async () => {
      root.render(
        <>
          <DraggableWindow
            title="Background"
            position={{ x: 40, y: 32, width: 220, height: 160 }}
            onMove={() => {}}
            visible
          >
            <div>Background content</div>
          </DraggableWindow>
          <DraggableWindow
            title="Foreground"
            position={{ x: 72, y: 56, width: 220, height: 160 }}
            onMove={() => {}}
            visible={false}
          >
            <div>Foreground content</div>
          </DraggableWindow>
        </>,
      );
    });

    let windows = Array.from(
      host.querySelectorAll('section[class*="floatingWindow"]'),
    ) as HTMLElement[];
    expect(windows).toHaveLength(1);
    const backgroundWindow = windows[0];
    expect(Number(backgroundWindow.style.zIndex)).toBe(20);

    await act(async () => {
      root.render(
        <>
          <DraggableWindow
            title="Background"
            position={{ x: 40, y: 32, width: 220, height: 160 }}
            onMove={() => {}}
            visible
          >
            <div>Background content</div>
          </DraggableWindow>
          <DraggableWindow
            title="Foreground"
            position={{ x: 72, y: 56, width: 220, height: 160 }}
            onMove={() => {}}
            visible
          >
            <div>Foreground content</div>
          </DraggableWindow>
        </>,
      );
    });

    windows = Array.from(
      host.querySelectorAll('section[class*="floatingWindow"]'),
    ) as HTMLElement[];
    expect(windows).toHaveLength(2);

    const reopenedBackgroundWindow = windows.find((windowElement) =>
      windowElement.textContent?.includes('Background content'),
    );
    const foregroundWindow = windows.find((windowElement) =>
      windowElement.textContent?.includes('Foreground content'),
    );

    expect(reopenedBackgroundWindow).toBeDefined();
    expect(foregroundWindow).toBeDefined();
    expect(Number(foregroundWindow?.style.zIndex)).toBeGreaterThan(
      Number(reopenedBackgroundWindow?.style.zIndex),
    );

    await act(async () => {
      reopenedBackgroundWindow?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: 60,
          clientY: 48,
        }),
      );
    });

    expect(Number(reopenedBackgroundWindow?.style.zIndex)).toBeGreaterThan(
      Number(foregroundWindow?.style.zIndex),
    );
  });
});
