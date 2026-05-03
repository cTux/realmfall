import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  BootstrapErrorScreen,
  BOOTSTRAP_ERROR_RELOAD_DELAY_MS,
} from './BootstrapErrorScreen';

describe('BootstrapErrorScreen', () => {
  let host: HTMLDivElement;
  let root: Root;
  let reloadPage: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    reloadPage = vi.fn();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.useRealTimers();
  });

  it('counts down from 2 seconds and reloads automatically', async () => {
    await act(async () => {
      root.render(
        <BootstrapErrorScreen reloadPage={reloadPage as () => void} />,
      );
    });

    expect(host.textContent).toContain('Realmfall failed to load.');
    expect(host.textContent).toContain(
      'Trying to recover automatically in 2 sec.',
    );
    expect(reloadPage).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(BOOTSTRAP_ERROR_RELOAD_DELAY_MS / 2);
    });

    expect(host.textContent).toContain(
      'Trying to recover automatically in 1 sec.',
    );
    expect(reloadPage).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(BOOTSTRAP_ERROR_RELOAD_DELAY_MS / 2);
    });

    expect(reloadPage).toHaveBeenCalledTimes(1);
  });
});
