import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useVersionStatus, VERSION_POLL_INTERVAL_MS } from './useVersionStatus';

function VersionStatusHarness() {
  const state = useVersionStatus('1.0.0');

  return (
    <div data-status={state.status} data-version={state.remoteVersion ?? ''} />
  );
}

describe('useVersionStatus', () => {
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
    vi.restoreAllMocks();
  });

  it('keeps polling after a failed request until the remote version differs', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ version: '1.0.1' }),
      } as unknown as Response);

    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(<VersionStatusHarness />);
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
      vi.runAllTicks();
    });

    const statusNode = host.firstElementChild as HTMLDivElement | null;
    expect(statusNode?.dataset.status).toBe('fetching');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(VERSION_POLL_INTERVAL_MS);
      vi.runAllTicks();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(statusNode?.dataset.status).toBe('outdated');
    expect(statusNode?.dataset.version).toBe('1.0.1');
  });
});
