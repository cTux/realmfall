import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LogWindowContent } from './LogWindowContent';

describe('LogWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
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

  it('reveals the newest log entry in larger chunks before completing', async () => {
    await act(async () => {
      root.render(
        <LogWindowContent
          logs={[
            {
              id: 'log-1',
              kind: 'system',
              text: 'Hunt',
              turn: 1,
            },
          ]}
        />,
      );
    });

    expect(host.textContent).toContain('#');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    expect(host.textContent).toContain('Hu');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    expect(host.textContent).toContain('Hunt');
    expect(host.textContent).not.toContain('#');
  });
});
