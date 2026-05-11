import {
  act,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '@realmfall/core/game/config';
import { syncCombatEncounterEnemies } from '@realmfall/core/game/stateCombatEncounterSync';
import { createGame } from '@realmfall/core/game/stateFactory';
import type { GameState } from '@realmfall/core/game/stateTypes';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderScene,
  renderApp,
  waitForAppSelector,
} from './appTestkit';
import {
  clickWorldTile,
  findRecipeBookDockButton,
  getRenderedGame,
  getTab,
  renderTickerFrame,
} from './appWorldMovementTestkit';

let combatAutomationSetGameRef: MutableRefObject<Dispatch<
  SetStateAction<GameState>
> | null> = {
  current: null,
};

function mockUseCombatAutomation() {
  vi.doMock('../useCombatAutomation', () => ({
    useCombatAutomation: ({
      setGame,
    }: {
      setGame: Dispatch<SetStateAction<GameState>>;
    }) => {
      combatAutomationSetGameRef.current = setGame;
    },
  }));
}

describe('App world movement cooldown', () => {
  it('moves one resolved hex per cooldown window while auto-continuing a queued path', async () => {
    const game = createGame(3, 'app-movement-cooldown');
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });
      expect(
        renderScene.mock.calls[renderScene.mock.calls.length - 1]?.[8],
      ).toMatchObject({
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          toCoord: { q: 1, r: 0 },
        },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(999);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 2, r: 0 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('replaces queued travel during cooldown without resetting the active cooldown', async () => {
    const game = createGame(3, 'app-movement-replacement');
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'workshop',
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      structure: 'camp',
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy
      .mockReturnValueOnce({ q: 2, r: 0 })
      .mockReturnValueOnce({ q: 0, r: -1 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      await flushLazyModules();

      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: -1 });
      expect(findRecipeBookDockButton(host)?.dataset.opened).toBe('true');
      expect(getTab(host, 'Cooking')?.getAttribute('aria-selected')).toBe(
        'true',
      );
      expect(getTab(host, 'Crafting')?.getAttribute('aria-selected')).toBe(
        'false',
      );

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('passes the remaining queued path into world rendering after the first approved far-hex move', async () => {
    const game = createGame(3, 'app-movement-queued-path-render');
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(
        renderScene.mock.calls[renderScene.mock.calls.length - 1]?.[8],
      ).toMatchObject({
        queuedPath: [{ q: 2, r: 0 }],
      });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('seeds the normal movement cooldown ring after a combat victory auto-step', async () => {
    combatAutomationSetGameRef = { current: null };
    mockUseCombatAutomation();
    const game = createHydratedAppGame();
    game.enemies['enemy-1,0-0'] = {
      ...game.enemies['enemy-1,0-0']!,
      attack: 0,
      defense: 0,
      hp: 999,
      maxHp: 999,
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();
      const renderCallCountBeforeResolution = renderScene.mock.calls.length;

      await act(async () => {
        combatAutomationSetGameRef.current?.((current) => {
          const next = structuredClone(current) as GameState;
          next.enemies['enemy-1,0-0']!.hp = 0;
          delete next.enemies['enemy-1,0-0'];
          syncCombatEncounterEnemies(next);
          return next;
        });
      });
      await flushLazyModules();
      await renderTickerFrame();
      await renderTickerFrame();

      const postResolutionCall = renderScene.mock.calls
        .slice(renderCallCountBeforeResolution)
        .find((call) => call[8]?.movementCooldown != null);
      const renderOptions = postResolutionCall?.[8];
      expect(renderOptions?.movementCooldown).toMatchObject({
        durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
      });
      expect(renderOptions?.movementCooldown?.endAtMs).toBeGreaterThan(
        renderOptions?.movementCooldown?.nowMs ?? 0,
      );

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      vi.doUnmock('../useCombatAutomation');
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
