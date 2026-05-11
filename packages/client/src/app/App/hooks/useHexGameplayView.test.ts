import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '@realmfall/core/game/stateFactory';
import { getGoldAmount } from '@realmfall/core/game/stateSelectors';
import * as stateSelectors from '@realmfall/core/game/stateSelectors';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { useHexGameplayView } from './useHexGameplayView';

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

describe('useHexGameplayView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips town-stock derivation when the hex window does not need it', async () => {
    const game = createTownStockGame('use-hex-gameplay-hidden-town-stock');
    const expectedGold = getGoldAmount(game.player.inventory);
    const townStockSpy = vi.spyOn(stateSelectors, 'getTownStockForDay');
    const baseProps = createUseHexGameplayViewOptions(game);
    const harness = await renderHook(baseProps);

    expect(townStockSpy).not.toHaveBeenCalled();
    expect(harness.result.townStock).toEqual([]);
    expect(harness.result.currentTile.structure).toBe('town');
    expect(harness.result.gold).toBe(expectedGold);

    const initialTownStock = harness.result.townStock;

    await harness.rerender({
      ...baseProps,
      worldDayIndex: 1,
    });

    expect(townStockSpy).not.toHaveBeenCalled();
    expect(harness.result.townStock).toBe(initialTownStock);
    expect(harness.result.currentTile.structure).toBe('town');

    await harness.unmount();
  });

  it('keeps town-stock output unchanged when the hex window is visible', async () => {
    const game = createTownStockGame('use-hex-gameplay-visible-town-stock');
    const expectedTownStock = stateSelectors.getTownStockForDay({
      player: { coord: game.player.coord },
      seed: game.seed,
      tiles: game.tiles,
      worldDayIndex: 0,
    });
    const townStockSpy = vi.spyOn(stateSelectors, 'getTownStockForDay');
    const harness = await renderHook(
      createUseHexGameplayViewOptions(game, {
        viewDemand: { hexTownStock: true },
      }),
    );

    expect(townStockSpy).toHaveBeenCalledTimes(1);
    expect(harness.result.townStock).toEqual(expectedTownStock);
    expect(harness.result.currentTile.structure).toBe('town');

    await harness.unmount();
  });
});

function createTownStockGame(seed: string) {
  const game = createGame(3, seed);
  game.tiles['0,0'] = {
    ...game.tiles['0,0'],
    structure: 'town',
  };
  game.player.inventory.push({
    id: `gold-${seed}`,
    name: 'Gold',
    itemKey: 'gold',
    quantity: 2_000,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  });
  return game;
}

function createUseHexGameplayViewOptions(
  game: GameState,
  overrides: Partial<Parameters<typeof useHexGameplayView>[0]> = {},
) {
  return {
    activeWorldId: game.activeWorldId,
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
    viewDemand: { hexTownStock: false },
    worlds: game.worlds,
    worldDayIndex: 0,
    ...overrides,
  };
}

async function renderHook(
  initialProps: Parameters<typeof useHexGameplayView>[0],
) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  let latestResult!: ReturnType<typeof useHexGameplayView>;

  function Harness(props: Parameters<typeof useHexGameplayView>[0]) {
    latestResult = useHexGameplayView(props);
    return null;
  }

  await act(async () => {
    root.render(createElement(Harness, initialProps));
  });

  return {
    get result() {
      return latestResult;
    },
    async rerender(nextProps: Parameters<typeof useHexGameplayView>[0]) {
      await act(async () => {
        root.render(createElement(Harness, nextProps));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      host.remove();
    },
  };
}
