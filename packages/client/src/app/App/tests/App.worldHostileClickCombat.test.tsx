import {
  act,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  WORLD_MOVE_HEX_COOLDOWN_MS,
  WORLD_MOVE_VISUAL_DURATION_MS,
} from '@realmfall/core/game/config';
import { syncCombatEncounterEnemies } from '@realmfall/core/game/stateCombatEncounterSync';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { WORLD_COMBAT_LUNGE_DURATION_MS } from '@realmfall/core/game/worldCombatPresentation';
import { getWorldCombatLungeOffset } from '../../../ui/world/worldCombatLunge';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
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
  getRenderedGame,
  renderTickerFrame,
} from './appWorldMovementTestkit';

const WORLD_HOSTILE_CLICK_COMBAT_TIMEOUT_MS = 20_000;

let setGameRef: MutableRefObject<Dispatch<SetStateAction<GameState>> | null> = {
  current: null,
};

function mockUseCombatAutomation() {
  vi.doMock('../useCombatAutomation', () => ({
    useCombatAutomation: ({
      setGame,
    }: {
      setGame: Dispatch<SetStateAction<GameState>>;
    }) => {
      setGameRef.current = setGame;
    },
  }));
}

describe('App world hostile click combat', () => {
  beforeEach(() => {
    setGameRef = { current: null };
    mockUseCombatAutomation();
  });

  afterEach(() => {
    vi.doUnmock('../useCombatAutomation');
  });

  it(
    'starts adjacent hostile combat in place, auto-steps after victory, and enforces movement cooldown',
    async () => {
      const game = createHydratedAppGame();
      game.tiles['2,0'] = {
        coord: { q: 2, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      };
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

        const pendingGame = getRenderedGame();
        expect(pendingGame?.player.coord).toEqual({ q: 0, r: 0 });
        expect(pendingGame?.combat?.started).toBe(false);
        expect(pendingGame?.combat?.engagement).toMatchObject({
          autoStepOnVictory: true,
          engageMode: 'adjacent-click',
          stagingCoord: { q: 0, r: 0 },
          targetCoord: { q: 1, r: 0 },
        });
        expect(pendingGame?.combat?.startedAtMs).toBeDefined();

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_COMBAT_LUNGE_DURATION_MS);
        });
        await flushLazyModules();
        await renderTickerFrame();

        const engagedGame = getRenderedGame();
        expect(engagedGame?.combat?.started).toBe(true);

        await act(async () => {
          setGameRef.current?.((current) => {
            const next = structuredClone(current) as GameState;
            next.enemies['enemy-1,0-0']!.hp = 0;
            delete next.enemies['enemy-1,0-0'];
            syncCombatEncounterEnemies(next);
            return next;
          });
        });
        await flushLazyModules();
        await renderTickerFrame();

        const resolvedGame = getRenderedGame();
        expect(resolvedGame?.combat).toBeNull();
        expect(resolvedGame?.player.coord).toEqual({ q: 1, r: 0 });

        await clickWorldTile(canvas);
        await flushLazyModules();
        await renderTickerFrame();

        expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_MOVE_HEX_COOLDOWN_MS);
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
    },
    WORLD_HOSTILE_CLICK_COMBAT_TIMEOUT_MS,
  );

  it(
    'walks only to the safe staging tile for a distant hostile click, then auto-steps after victory and enforces movement cooldown',
    async () => {
      const game = createHydratedAppGame();
      game.tiles['1,0'] = {
        ...game.tiles['1,0'],
        enemyIds: [],
      };
      delete game.enemies['enemy-1,0-0'];
      game.tiles['2,0'] = {
        coord: { q: 2, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: ['enemy-2,0-0'],
      };
      game.tiles['3,0'] = {
        coord: { q: 3, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      };
      game.enemies['enemy-2,0-0'] = {
        id: 'enemy-2,0-0',
        name: 'Wolf',
        coord: { q: 2, r: 0 },
        tier: 1,
        hp: 999,
        maxHp: 999,
        attack: 0,
        defense: 0,
        xp: 2,
        elite: false,
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

        const stagedArrivalGame = getRenderedGame();
        expect(stagedArrivalGame?.player.coord).toEqual({ q: 1, r: 0 });
        expect(stagedArrivalGame?.player.coord).not.toEqual({ q: 2, r: 0 });
        expect(stagedArrivalGame?.combat?.started).toBe(false);
        expect(stagedArrivalGame?.combat?.startedAtMs).toBeUndefined();
        expect(stagedArrivalGame?.combat?.engagement).toMatchObject({
          autoStepOnVictory: true,
          engageMode: 'staged-click',
          stagingCoord: { q: 1, r: 0 },
          targetCoord: { q: 2, r: 0 },
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_MOVE_VISUAL_DURATION_MS - 1);
        });
        await flushLazyModules();
        await renderTickerFrame();

        expect(getRenderedGame()?.combat?.started).toBe(false);
        expect(getRenderedGame()?.combat?.startedAtMs).toBeUndefined();

        await act(async () => {
          await vi.advanceTimersByTimeAsync(1);
        });
        await flushLazyModules();
        await renderTickerFrame();

        expect(getRenderedGame()?.combat?.started).toBe(false);
        expect(getRenderedGame()?.combat?.startedAtMs).toBeDefined();

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_COMBAT_LUNGE_DURATION_MS);
        });
        await flushLazyModules();
        await renderTickerFrame();

        const stagedCombatGame = getRenderedGame();
        expect(stagedCombatGame?.combat?.started).toBe(true);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_MOVE_HEX_COOLDOWN_MS);
        });
        await flushLazyModules();
        const renderCallCountBeforeResolution = renderScene.mock.calls.length;

        await act(async () => {
          setGameRef.current?.((current) => {
            const next = structuredClone(current) as GameState;
            next.enemies['enemy-2,0-0']!.hp = 0;
            delete next.enemies['enemy-2,0-0'];
            syncCombatEncounterEnemies(next);
            return next;
          });
        });
        await flushLazyModules();
        await renderTickerFrame();
        await renderTickerFrame();

        const resolvedGame = getRenderedGame();
        expect(resolvedGame?.combat).toBeNull();
        expect(resolvedGame?.player.coord).toEqual({ q: 2, r: 0 });

        const postResolutionCall = renderScene.mock.calls
          .slice(renderCallCountBeforeResolution)
          .find((call) => call[8]?.movementCooldown != null);
        const app = postResolutionCall?.[0];
        const renderOptions = postResolutionCall?.[8];
        const expectedHeldOffset =
          app && renderOptions?.movementTransition
            ? getWorldCombatLungeOffset({
                hexSize: getWorldHexSize(app.screen, resolvedGame?.radius ?? 0),
                phase: 'held',
                stagingCoord: { q: 1, r: 0 },
                startedAtMs: 0,
                targetCoord: { q: 2, r: 0 },
                worldTimeMs: WORLD_COMBAT_LUNGE_DURATION_MS,
              })
            : null;
        expect(renderOptions?.movementTransition).toMatchObject({
          durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
          fromCoord: { q: 1, r: 0 },
          toCoord: { q: 2, r: 0 },
        });
        expect(
          renderOptions?.movementTransition?.playerOffsetAtStart?.x ?? 0,
        ).toBeCloseTo(expectedHeldOffset?.x ?? 0, 5);
        expect(
          renderOptions?.movementTransition?.playerOffsetAtStart?.y ?? 0,
        ).toBeCloseTo(expectedHeldOffset?.y ?? 0, 5);
        expect(renderOptions?.movementCooldown).toMatchObject({
          durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
        });
        expect(renderOptions?.movementCooldown?.endAtMs).toBeGreaterThan(
          renderOptions?.movementCooldown?.nowMs ?? 0,
        );

        hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });
        await clickWorldTile(canvas);
        await flushLazyModules();
        await renderTickerFrame();

        expect(getRenderedGame()?.player.coord).toEqual({ q: 2, r: 0 });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(WORLD_MOVE_HEX_COOLDOWN_MS);
        });
        await flushLazyModules();
        await renderTickerFrame();

        expect(getRenderedGame()?.player.coord).toEqual({ q: 3, r: 0 });

        await act(async () => {
          root.unmount();
        });
        host.remove();
      } finally {
        hexAtPointSpy.mockRestore();
      }
    },
    WORLD_HOSTILE_CLICK_COMBAT_TIMEOUT_MS,
  );
});
