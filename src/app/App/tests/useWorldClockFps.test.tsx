import React, { act, forwardRef, useImperativeHandle, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useWorldClockFps } from '../useWorldClockFps';

interface ClockHarnessHandle {
  getWorldTimeMs: () => number;
}

const onWorldMinuteChange = vi.fn();
const onWorldSecondChange = vi.fn();

const ClockHarness = forwardRef<ClockHarnessHandle, { paused: boolean }>(
  function ClockHarness({ paused }: { paused: boolean }, ref) {
    const worldTimeMsRef = useRef(1_000);
    const worldTimeTickRef = useRef<number | null>(null);
    const lastDisplayedWorldSecondRef = useRef(1);

    useWorldClockFps({
      initialWorldTimeMs: 1_000,
      paused,
      worldTimeMsRef,
      worldTimeTickRef,
      lastDisplayedWorldSecondRef,
      onWorldMinuteChange,
      onWorldSecondChange,
    });

    useImperativeHandle(ref, () => ({
      getWorldTimeMs: () => worldTimeMsRef.current,
    }));

    return null;
  },
);

function setDocumentVisibilityState(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  });
}

describe.skip('useWorldClockFps', () => {
  let host: HTMLDivElement;
  let root: Root;
  let harnessRef: React.RefObject<ClockHarnessHandle | null>;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    setDocumentVisibilityState('visible');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    harnessRef = React.createRef<ClockHarnessHandle>();

    await act(async () => {
      root.render(<ClockHarness ref={harnessRef} paused={false} />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('pauses the world clock while the tab is hidden and resumes on return', async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    const visibleWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;

    expect(visibleWorldTime).toBeGreaterThan(1_000);

    await act(async () => {
      setDocumentVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const hiddenWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;

    expect(hiddenWorldTime).toBe(visibleWorldTime);

    await act(async () => {
      setDocumentVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(harnessRef.current?.getWorldTimeMs() ?? 0).toBeGreaterThan(
      hiddenWorldTime,
    );
  });

  it('pauses the world clock while the game pause state is active and resumes afterward', async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    const activeWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;

    await act(async () => {
      root.render(<ClockHarness ref={harnessRef} paused />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const pausedWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;
    expect(pausedWorldTime).toBe(activeWorldTime);

    await act(async () => {
      root.render(<ClockHarness ref={harnessRef} paused={false} />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(harnessRef.current?.getWorldTimeMs() ?? 0).toBeGreaterThan(
      pausedWorldTime,
    );
  });
});
