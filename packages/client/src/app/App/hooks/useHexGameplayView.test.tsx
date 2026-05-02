import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
});
