import React, {
  act,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '../../../game/state';
import { useAppWorldClock } from '../hooks/useAppWorldClock';

interface ClockHarnessHandle {
  getRenderCount: () => number;
}

const DAYTIME_WORLD_TIME_MS = 30_000;

const ClockHarness = forwardRef<ClockHarnessHandle>(
  function ClockHarness(_, ref) {
    const [, setGame] = useState(() => {
      const initialGame = createGame(2, 'use-app-world-clock-test-seed');
      initialGame.worldTimeMs = DAYTIME_WORLD_TIME_MS;
      initialGame.dayPhase = 'day';
      return initialGame;
    });
    const renderCountRef = useRef(0);
    const worldTimeMsRef = useRef(DAYTIME_WORLD_TIME_MS);
    const worldTimeTickRef = useRef<number | null>(null);
    const lastDisplayedWorldSecondRef = useRef(
      Math.floor(DAYTIME_WORLD_TIME_MS / 1000),
    );

    renderCountRef.current += 1;

    useAppWorldClock({
      initialWorldTimeMs: DAYTIME_WORLD_TIME_MS,
      lastDisplayedWorldSecondRef,
      paused: false,
      setGame,
      worldTimeMsRef,
      worldTimeTickRef,
    });

    useImperativeHandle(ref, () => ({
      getRenderCount: () => renderCountRef.current,
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

describe('useAppWorldClock', () => {
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
    setDocumentVisibilityState('visible');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    harnessRef = React.createRef<ClockHarnessHandle>();

    await act(async () => {
      root.render(<ClockHarness ref={harnessRef} />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps ordinary live clock ticks out of React game state', async () => {
    const initialRenderCount = harnessRef.current?.getRenderCount() ?? 0;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(harnessRef.current?.getRenderCount()).toBe(initialRenderCount);
  });
});
