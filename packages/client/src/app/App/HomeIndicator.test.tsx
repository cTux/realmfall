import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeIndicator } from './HomeIndicator';

describe('HomeIndicator', () => {
  beforeAll(() => {
    class ResizeObserverMock {
      constructor(private readonly callback: () => void) {}

      observe() {
        this.callback();
      }

      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('renders a claimed-territory pointer when the first claimed hex is offscreen', async () => {
    const hostRef = {
      current: document.createElement('div') as HTMLDivElement | null,
    };
    Object.defineProperty(hostRef.current, 'clientWidth', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(hostRef.current, 'clientHeight', {
      configurable: true,
      value: 600,
    });

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <HomeIndicator
          claimedHex={{ q: 6, r: 0 }}
          homeHex={{ q: 1, r: 0 }}
          hostRef={hostRef}
          playerCoord={{ q: 0, r: 0 }}
          radius={8}
        />,
      );
    });

    expect(host.innerHTML).toContain('Claimed');
    expect(host.innerHTML).not.toContain('Home');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
