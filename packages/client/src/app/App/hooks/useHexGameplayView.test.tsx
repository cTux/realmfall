import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createStartedCombatEncounter } from './useHexGameplayViewTestkit';
import { createGame } from '../../../game/stateFactory';

describe('useHexGameplayView', () => {
  afterEach(() => {
    vi.doUnmock('../../../game/world');
    vi.resetModules();
  });

  it('uses only resolved current-hex state when the player tile is pending', async () => {
    const game = createGame(3, 'resolved-current-hex-only');
    game.player.coord = { q: 1, r: 0 };
    delete game.tiles['1,0'];

    const buildTileSpy = vi.fn(() => {
      throw new Error('buildTile should not run for pending current hexes');
    });
    vi.doMock('../../../game/world', async (importOriginal) => {
      const actual =
        await importOriginal<typeof import('../../../game/world')>();
      return {
        ...actual,
        buildTile: buildTileSpy,
      };
    });

    const { loadI18n } = await import('../../../i18n');
    await loadI18n();
    const { useHexGameplayView } = await import('./useHexGameplayView');

    let latestCurrentTile: {
      coord: { q: number; r: number };
      terrain: string;
      items: unknown[];
      enemyIds: string[];
    } | null = null;
    function TestComponent() {
      latestCurrentTile = useHexGameplayView({
        bloodMoonActive: game.bloodMoonActive,
        combat: game.combat,
        enemies: game.enemies,
        hexItemModificationPickerActive: false,
        homeHex: game.homeHex,
        player: game.player,
        seed: game.seed,
        selectedHexItemModificationItem: null,
        selectedHexItemReforgeStatIndex: null,
        tiles: game.tiles,
        worldDayIndex: 0,
      }).currentTile;
      return null;
    }

    const host = document.createElement('div');
    const root: Root = createRoot(host);
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(buildTileSpy).not.toHaveBeenCalled();
    expect(latestCurrentTile).toEqual({
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    });

    await act(async () => {
      root.unmount();
    });

    host.remove();
  });

  it('reads combat enemies from the preserved encounter target when it differs from the staging hex', async () => {
    const game = createGame(3, 'combat-target-enemy-view');
    const enemyId = 'enemy-1,0-0';
    game.tiles['0,0'] = {
      coord: { q: 0, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 2,
      hp: 5,
      maxHp: 5,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: false,
      engageMode: 'enemy-chase',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
      worldTimeMs: game.worldTimeMs,
    });

    const { loadI18n } = await import('../../../i18n');
    await loadI18n();
    const { useHexGameplayView } = await import('./useHexGameplayView');

    let latestCombatEnemyIds: string[] = [];
    function TestComponent() {
      latestCombatEnemyIds = useHexGameplayView({
        bloodMoonActive: game.bloodMoonActive,
        combat: game.combat,
        enemies: game.enemies,
        hexItemModificationPickerActive: false,
        homeHex: game.homeHex,
        player: game.player,
        seed: game.seed,
        selectedHexItemModificationItem: null,
        selectedHexItemReforgeStatIndex: null,
        tiles: game.tiles,
        worldDayIndex: 0,
      }).combatEnemies.map((enemy) => enemy.id);
      return null;
    }

    const host = document.createElement('div');
    const root: Root = createRoot(host);
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(latestCombatEnemyIds).toEqual([enemyId]);

    await act(async () => {
      root.unmount();
    });

    host.remove();
  });
});
