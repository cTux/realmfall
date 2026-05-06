import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useDeferredWindowLifecycle } from './useDeferredWindowLifecycle';

describe('useDeferredWindowLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(16), 0),
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      (handle: number) => window.clearTimeout(handle),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retains the last active snapshot while hiding and unmounts after the delay', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      active: true,
      snapshot: { value: 'loot' },
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('loot');

    await renderHarness(root, {
      active: false,
      snapshot: { value: 'ignored' },
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('false');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('loot');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('false');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('false');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('loot');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('updates the snapshot on reactivation and clears the pending unmount', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await renderHarness(root, {
      active: false,
      snapshot: { value: 'initial' },
    });

    await renderHarness(root, {
      active: true,
      snapshot: { value: 'combat-1' },
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('false');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('combat-1');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('true');

    await renderHarness(root, {
      active: false,
      snapshot: { value: 'ignored' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await renderHarness(root, {
      active: true,
      snapshot: { value: 'combat-2' },
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('false');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('combat-2');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(host.firstElementChild?.getAttribute('data-mounted')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-visible')).toBe('true');
    expect(host.firstElementChild?.getAttribute('data-value')).toBe('combat-2');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

function Harness({
  active,
  snapshot,
}: {
  active: boolean;
  snapshot: { value: string };
}) {
  const state = useDeferredWindowLifecycle({ active, snapshot });

  return (
    <div
      data-mounted={state.mounted ? 'true' : 'false'}
      data-value={state.snapshot.value}
      data-visible={state.visible ? 'true' : 'false'}
    />
  );
}

async function renderHarness(
  root: ReturnType<typeof createRoot>,
  props: Parameters<typeof Harness>[0],
) {
  await act(async () => {
    root.render(<Harness {...props} />);
  });
}
