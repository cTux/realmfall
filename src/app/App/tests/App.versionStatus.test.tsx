import { act } from 'react';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';
import { VERSION_POLL_INTERVAL_MS } from '../hooks/useVersionStatus';

function createVersionResponse(version: string) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ version }),
  };
}

describe('App version status', () => {
  it('shows the current version state when the remote manifest matches', async () => {
    loadEncryptedState.mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createVersionResponse(__APP_VERSION__)),
    );

    const { host, root } = await renderApp();
    await flushLazyModules();

    const widget = host.querySelector('[data-version-status="current"]');

    expect(widget).not.toBeNull();
    expect(host.textContent).toContain(`Current: ${__APP_VERSION__}`);
    expect(host.textContent).toContain(`Remote: ${__APP_VERSION__}`);
    expect(host.textContent).not.toContain('Refresh');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps retrying silently after fetch failures and offers refresh when a newer version appears', async () => {
    loadEncryptedState.mockResolvedValue(null);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(createVersionResponse('0.2.0'));

    vi.stubGlobal('fetch', fetchMock);

    const { host, root } = await renderApp();
    await flushLazyModules();

    expect(
      host.querySelector('[data-version-status="fetching"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('Remote: checking...');

    await act(async () => {
      vi.advanceTimersByTime(VERSION_POLL_INTERVAL_MS);
      await Promise.resolve();
    });
    await flushLazyModules();

    const widget = host.querySelector('[data-version-status="outdated"]');

    expect(widget).not.toBeNull();
    expect(host.textContent).toContain('Remote: 0.2.0');
    expect(host.textContent).toContain('Refresh');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
