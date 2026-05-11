import React, {
  act,
  forwardRef,
  useImperativeHandle,
  useRef,
  type SetStateAction,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getWorldTimeMinutesFromTimestamp } from '@realmfall/core/game/worldTime';
import { useWorldClockTime } from '../worldClockStore';
import { useWorldClockFps } from './useWorldClockFpsTestkit';

interface ClockHarnessHandle {
  getWorldTimeMs: () => number;
  getPublishedWorldTimeMs: () => number;
  setWorldTimeMs: (nextWorldTimeMs: SetStateAction<number>) => void;
}

const onWorldMinuteChange = vi.fn();
const onWorldSecondChange = vi.fn();

const ClockHarness = forwardRef<
  ClockHarnessHandle,
  { initialWorldTimeMs: number; paused: boolean }
>(function ClockHarness({ initialWorldTimeMs, paused }, ref) {
  const worldTimeMsRef = useRef(initialWorldTimeMs);
  const publishedWorldTimeMs = useWorldClockTime();
  const worldTimeTickRef = useRef<number | null>(null);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(initialWorldTimeMs / 1_000),
  );

  const { setWorldTimeMs } = useWorldClockFps({
    initialWorldTimeMs,
    paused,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
    onWorldMinuteChange,
    onWorldSecondChange,
  });

  useImperativeHandle(
    ref,
    () => ({
      getWorldTimeMs: () => worldTimeMsRef.current,
      getPublishedWorldTimeMs: () => publishedWorldTimeMs,
      setWorldTimeMs,
    }),
    [publishedWorldTimeMs, setWorldTimeMs],
  );

  return null;
});

function setDocumentVisibilityState(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  });
}

describe('useWorldClockFps', () => {
  let host: HTMLDivElement;
  let root: Root;
  let harnessRef: React.RefObject<ClockHarnessHandle | null>;

  async function renderClockHarness({
    initialWorldTimeMs = 1_000,
    paused = false,
  }: {
    initialWorldTimeMs?: number;
    paused?: boolean;
  } = {}) {
    await act(async () => {
      root.render(
        <ClockHarness
          ref={harnessRef}
          initialWorldTimeMs={initialWorldTimeMs}
          paused={paused}
        />,
      );
    });
  }

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
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('publishes second changes at the next boundary without requestAnimationFrame churn', async () => {
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

    await renderClockHarness({ initialWorldTimeMs: 59_250 });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(59_250);
    expect(onWorldSecondChange).not.toHaveBeenCalled();
    expect(onWorldMinuteChange).not.toHaveBeenCalled();
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(749);
    });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(59_250);
    expect(onWorldSecondChange).not.toHaveBeenCalled();
    expect(onWorldMinuteChange).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(harnessRef.current?.getWorldTimeMs()).toBe(60_000);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(60_000);
    expect(onWorldSecondChange).toHaveBeenCalledTimes(1);
    expect(onWorldMinuteChange).toHaveBeenCalledWith(
      getWorldTimeMinutesFromTimestamp(60_000),
    );
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });

  it('pauses the world clock while the tab is hidden and resumes on return', async () => {
    await renderClockHarness({ initialWorldTimeMs: 1_250 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(1_250);

    await act(async () => {
      setDocumentVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const hiddenWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;

    expect(hiddenWorldTime).toBe(1_650);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(1_250);

    await act(async () => {
      setDocumentVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(349);
    });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(1_250);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(harnessRef.current?.getWorldTimeMs()).toBe(2_000);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(2_000);
  });

  it('keeps explicit world time jumps aligned to the next published second boundary', async () => {
    await renderClockHarness({ initialWorldTimeMs: 1_250 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      harnessRef.current?.setWorldTimeMs(2_250);
    });

    expect(harnessRef.current?.getWorldTimeMs()).toBe(2_250);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(2_250);
    expect(onWorldSecondChange).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(749);
    });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(2_250);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(harnessRef.current?.getWorldTimeMs()).toBe(3_000);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(3_000);
    expect(onWorldSecondChange).toHaveBeenCalledTimes(1);
  });

  it('pauses the world clock while the game pause state is active and resumes afterward', async () => {
    await renderClockHarness({ initialWorldTimeMs: 1_250 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      root.render(
        <ClockHarness ref={harnessRef} initialWorldTimeMs={1_250} paused />,
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const pausedWorldTime = harnessRef.current?.getWorldTimeMs() ?? 0;
    expect(pausedWorldTime).toBe(1_650);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(1_250);

    await act(async () => {
      root.render(
        <ClockHarness
          ref={harnessRef}
          initialWorldTimeMs={1_250}
          paused={false}
        />,
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(349);
    });

    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(1_250);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(harnessRef.current?.getWorldTimeMs()).toBe(2_000);
    expect(harnessRef.current?.getPublishedWorldTimeMs()).toBe(2_000);
  });
});
