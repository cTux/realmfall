import React, {
  act,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import type { GameState } from '../../../game/stateTypes';
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
  getGame: () => GameState;
  getHeroWindowPosition: () => WindowPositions['hero'];
  getHeroWindowVisible: () => boolean;
  persistNow: () => Promise<void>;
  setLiveWorldTimeMs: (worldTimeMs: number) => void;
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
      getGame: () => gameRef.current,
      getHeroWindowPosition: () => windows.hero,
      getHeroWindowVisible: () => windowShown.hero,
      persistNow,
      setLiveWorldTimeMs: (nextWorldTimeMs: number) => {
        worldTimeMsRef.current = nextWorldTimeMs;
        lastDisplayedWorldSecondRef.current = Math.floor(
          nextWorldTimeMs / 1000,
        );
      },
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
    act(() => {
      vi.runAllTicks();
    });
    if (host.querySelector('[data-hydrated="ready"]')) break;
  }

  return {
    handle: harnessRef.current!,
    host,
    root,
  };
}

async function flushAutosaveTimers(ms = 5000) {
  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(2_000, remaining);
    await vi.advanceTimersByTimeAsync(step);
    remaining -= step;
  }
  await vi.runOnlyPendingTimersAsync();
}

async function advanceForTest(ms = 4_000) {
  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(2_000, remaining);
    await vi.advanceTimersByTimeAsync(step);
    remaining -= step;
  }
}

describe.skip('useAppPersistence', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.stubGlobal('cancelIdleCallback', undefined);
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
      await flushAutosaveTimers();
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
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);

    await act(async () => {
      await flushAutosaveTimers();
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
      await advanceForTest(4_000);
    });

    await act(async () => {
      handle.setHeroWindowVisible(false);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999);
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(0);

    await act(async () => {
      await flushAutosaveTimers(1);
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

  it('persists only the changed UI segment for UI-only autosaves', async () => {
    const game = createGame(2, 'use-app-persistence-ui-segment-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    saveEncryptedState.mockResolvedValue(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    await act(async () => {
      handle.toggleHeroWindow();
    });

    await act(async () => {
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);
    expect(saveEncryptedState.mock.calls[0][0]).toEqual({
      ui: expect.objectContaining({
        windowShown: expect.objectContaining({ hero: true }),
      }),
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('persists live world time from the clock ref on the autosave interval', async () => {
    const game = createGame(2, 'use-app-persistence-world-time-ref-seed');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    saveEncryptedState.mockResolvedValue(undefined);

    const { handle, host, root } = await renderPersistenceHarness();

    await act(async () => {
      handle.setLiveWorldTimeMs(game.worldTimeMs + 12_000);
      await flushAutosaveTimers();
    });

    expect(saveEncryptedState).toHaveBeenCalledTimes(1);
    expect(saveEncryptedState.mock.calls[0][0]).toEqual({
      game: expect.objectContaining({
        worldTimeMs: game.worldTimeMs + 12_000,
      }),
    });

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

  it('hydrates gameplay saves with per-field defaults instead of replacing them', async () => {
    const game = createGame(2, 'use-app-persistence-default-fallback-seed');
    const saved = structuredClone(game);

    delete (saved.player.skills as Partial<typeof saved.player.skills>)
      .crafting;
    saved.player.level = 8;

    loadEncryptedState.mockResolvedValue({ game: saved, ui: {} });
    saveEncryptedState.mockResolvedValue(undefined);

    const { handle, host, root } = await renderPersistenceHarness();
    const hydratedGame = handle.getGame();

    expect(host.querySelector('[data-hydrated="ready"]')).toBeTruthy();
    expect(hydratedGame.player.level).toBe(8);
    expect(hydratedGame.player.skills.crafting).toEqual(
      game.player.skills.crafting,
    );
    expect(saveEncryptedState).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
