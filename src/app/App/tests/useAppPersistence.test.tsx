import React, {
  act,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { createGame, type GameState } from '../../../game/state';
import { createDefaultActionBarSlots } from '../actionBar';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPositions,
  type WindowVisibilityState,
} from '../../constants';

const { loadEncryptedState, saveEncryptedState } = vi.hoisted(() => ({
  loadEncryptedState: vi.fn(),
  saveEncryptedState: vi.fn(),
}));

vi.mock('../../../persistence/storage', () => ({
  loadEncryptedState,
  saveEncryptedState,
}));

import { useAppPersistence } from '../useAppPersistence';

interface PersistenceHarnessHandle {
  getHeroWindowPosition: () => WindowPositions['hero'];
  getHeroWindowVisible: () => boolean;
  persistNow: () => Promise<void>;
  toggleHeroWindow: () => void;
  setHeroWindowVisible: (visible: boolean) => void;
}

function createDeferredPromise() {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

const PersistenceHarness = forwardRef<PersistenceHarnessHandle>(
  function PersistenceHarness(_, ref) {
    const initialGameRef = useRef<GameState>(
      createGame(2, 'use-app-persistence-test-seed'),
    );
    const gameRef = useRef(initialGameRef.current);
    const [game, setGame] = useState(initialGameRef.current);
    const [logFilters, setLogFilters] = useState(DEFAULT_LOG_FILTERS);
    const [actionBarSlots, setActionBarSlots] = useState(
      createDefaultActionBarSlots,
    );
    const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
    const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
      DEFAULT_WINDOW_VISIBILITY,
    );
    const [worldTimeMs, setWorldTimeMs] = useState(
      initialGameRef.current.worldTimeMs,
    );
    const worldTimeMsRef = useRef(worldTimeMs);
    const worldTimeTickRef = useRef<number | null>(null);
    const lastDisplayedWorldSecondRef = useRef(Math.floor(worldTimeMs / 1000));

    useEffect(() => {
      gameRef.current = game;
    }, [game]);

    useEffect(() => {
      worldTimeMsRef.current = worldTimeMs;
      lastDisplayedWorldSecondRef.current = Math.floor(worldTimeMs / 1000);
    }, [worldTimeMs]);

    const { hydrated, persistNow } = useAppPersistence({
      game,
      gameRef,
      logFilters,
      actionBarSlots,
      setGame,
      setLogFilters,
      setActionBarSlots,
      setWindows,
      setWindowShown,
      setWorldTimeMs,
      windows,
      windowShown,
      worldTimeMsRef,
      worldTimeTickRef,
      lastDisplayedWorldSecondRef,
    });

    useImperativeHandle(ref, () => ({
      getHeroWindowPosition: () => windows.hero,
      getHeroWindowVisible: () => windowShown.hero,
      persistNow,
      toggleHeroWindow: () =>
        setWindowShown((current) => ({ ...current, hero: !current.hero })),
      setHeroWindowVisible: (visible: boolean) =>
        setWindowShown((current) => ({ ...current, hero: visible })),
    }));

    return <div data-hydrated={hydrated ? 'ready' : 'loading'} />;
  },
);

async function renderPersistenceHarness() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const harnessRef = React.createRef<PersistenceHarnessHandle>();

  await act(async () => {
    root.render(<PersistenceHarness ref={harnessRef} />);
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await act(async () => {
      await Promise.resolve();
    });
    if (host.querySelector('[data-hydrated="ready"]')) break;
  }

  return {
    handle: harnessRef.current!,
    host,
    root,
  };
}

describe('useAppPersistence', () => {
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
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('serializes manual saves behind an in-flight autosave', async () => {
    const firstSave = createDeferredPromise();
    loadEncryptedState.mockResolvedValue(undefined);
    saveEncryptedState.mockImplementationOnce(() => firstSave.promise);
    saveEncryptedState.mockResolvedValueOnce(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    await act(async () => {
      handle.toggleHeroWindow();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);
    expect(saveEncryptedState.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: true }),
        }),
      }),
    );

    await act(async () => {
      handle.toggleHeroWindow();
    });

    let persistNowPromise!: Promise<void>;
    await act(async () => {
      persistNowPromise = handle.persistNow();
      await Promise.resolve();
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSave.resolve();
      await persistNowPromise;
    });

    expect(saveEncryptedState.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(saveEncryptedState.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: false }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('retries the latest unchanged snapshot after a failed save', async () => {
    loadEncryptedState.mockResolvedValue(undefined);
    saveEncryptedState.mockRejectedValueOnce(new Error('quota exceeded'));
    saveEncryptedState.mockResolvedValueOnce(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    await act(async () => {
      handle.toggleHeroWindow();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(2);
    expect(saveEncryptedState.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: true }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('flushes on the interval during continuous activity', async () => {
    loadEncryptedState.mockResolvedValue(undefined);
    saveEncryptedState.mockResolvedValue(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    await act(async () => {
      handle.setHeroWindowVisible(true);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    await act(async () => {
      handle.setHeroWindowVisible(false);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);
    expect(saveEncryptedState.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: false }),
        }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps hydrating ui when the saved game slice is malformed', async () => {
    loadEncryptedState.mockResolvedValue({
      game: {
        seed: 'broken-save',
        player: {
          inventory: [{ id: 'bad-item' }],
        },
      },
      ui: {
        windows: {
          hero: { x: 42, y: 96 },
        },
        windowShown: {
          hero: true,
        },
      },
    });
    saveEncryptedState.mockResolvedValue(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    expect(host.querySelector('[data-hydrated="ready"]')).toBeTruthy();
    expect(handle.getHeroWindowPosition()).toEqual({ x: 42, y: 96 });
    expect(handle.getHeroWindowVisible()).toBe(true);
    expect(saveEncryptedState).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
