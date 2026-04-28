import { act } from 'react';
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
});
