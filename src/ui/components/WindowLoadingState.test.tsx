import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { t } from '../../i18n';
import {
  WindowLoadingState,
  WINDOW_LOADING_WARNING_DELAY_MS,
} from './WindowLoadingState';

describe('WindowLoadingState', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.useFakeTimers();
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

  it('shows a delayed warning when window content is still loading', async () => {
    await act(async () => {
      root.render(<WindowLoadingState />);
    });

    expect(host.textContent).not.toContain(t('ui.loading.windowDelayed'));

    await act(async () => {
      vi.advanceTimersByTime(WINDOW_LOADING_WARNING_DELAY_MS - 1);
    });
    expect(host.textContent).not.toContain(t('ui.loading.windowDelayed'));

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(host.textContent).toContain(t('ui.loading.windowDelayed'));
  });
});
