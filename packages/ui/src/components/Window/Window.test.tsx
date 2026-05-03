import { act, type CSSProperties } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Window } from './Window';

describe('Window', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
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

  it('renders the title close button with the shared small size', async () => {
    await act(async () => {
      root.render(
        <Window title="Window" position={{ x: 24, y: 32 }} onMove={() => {}}>
          Body
        </Window>,
      );
    });

    const closeButton = host.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
    const closeIcon = closeButton?.querySelector(
      '[data-close-icon="true"]',
    ) as HTMLSpanElement | null;
    expect(closeButton?.getAttribute('data-size')).toBe('small');
    expect(closeButton?.textContent?.trim()).toBe('');
    expect(closeIcon).not.toBeNull();
  });

  it('uses the shared app window opacity variable when it is provided', async () => {
    await act(async () => {
      root.render(
        <div style={{ '--app-window-opacity': '0.35' } as CSSProperties}>
          <Window
            title="Window"
            position={{ x: 24, y: 32, width: 560, height: 567 }}
            onMove={() => {}}
            resizeBounds={{ minWidth: 280, minHeight: 180 }}
          >
            Body
          </Window>
        </div>,
      );
    });

    const windowElement = host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
    const windowSurface = host.querySelector(
      'div[class*="windowSurface"]',
    ) as HTMLDivElement | null;
    const resizeHandle = host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;

    expect(windowElement).not.toBeNull();
    expect(windowSurface).not.toBeNull();
    expect(resizeHandle).not.toBeNull();
    expect(windowElement?.style.opacity).toBe(
      'var(--window-opacity, var(--app-window-opacity, 1))',
    );
    expect(windowElement?.style.getPropertyValue('--window-base-width')).toBe(
      '560px',
    );
    expect(windowElement?.style.getPropertyValue('--window-base-height')).toBe(
      '567px',
    );
    expect(getComputedStyle(windowElement!).pointerEvents).toBe('auto');
    expect(windowSurface?.style.width).toBe('var(--window-base-width)');
    expect(windowSurface?.style.height).toBe('var(--window-base-height)');
    expect(resizeHandle?.parentElement).toBe(windowSurface);
  });
});
