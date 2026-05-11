import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createSkillRecord } from '@realmfall/core/game/skillRecords';
import { createGame } from '@realmfall/core/game/stateFactory';
import * as skillRecordModule from '@realmfall/core/game/skillRecords';
import * as stateSelectors from '@realmfall/core/game/stateSelectors';
import type { GameState, LogKind } from '@realmfall/core/game/stateTypes';
import { DEFAULT_LOG_FILTERS } from '../constants';
import { useHexGameplayView } from './hooks/useHexGameplayView';
import { useAppGameView } from './useAppGameView';

vi.mock('./hooks/useHexGameplayView', () => ({
  useHexGameplayView: vi.fn(),
}));

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

describe('useAppGameView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('skips deferred log and recipe derivation when those windows are hidden', async () => {
    const game = createGame(3, 'use-app-game-view-hidden-demand');
    game.player.learnedRecipeIds = ['cook-cooked-fish'];
    game.player.favoriteRecipeIds = ['cook-cooked-fish'];
    game.player.inventory.push({
      id: 'fiber-hidden-demand',
      itemKey: 'fiber',
      name: 'Fiber',
      quantity: 2,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const logs = [...game.logs];
    const originalFilter = logs.filter.bind(logs);
    const filterSpy = vi.fn(originalFilter);
    logs.filter = filterSpy as typeof logs.filter;

    const recipeBookEntriesSpy = vi.spyOn(
      stateSelectors,
      'getRecipeBookEntries',
    );
    const expectedHiddenRecipeSkillLevels = createSkillRecord(() => 0);
    const createSkillRecordSpy = vi.spyOn(
      skillRecordModule,
      'createSkillRecord',
    );

    vi.mocked(useHexGameplayView).mockReturnValue(createHexGameplayViewStub());

    const baseProps = createUseAppGameViewOptions(game, logs);
    const harness = await renderHook(baseProps);

    expect(filterSpy).not.toHaveBeenCalled();
    expect(recipeBookEntriesSpy).not.toHaveBeenCalled();
    expect(createSkillRecordSpy).not.toHaveBeenCalled();
    expect(vi.mocked(useHexGameplayView)).toHaveBeenCalledWith(
      expect.objectContaining({
        viewDemand: { hexTownStock: false },
      }),
    );
    expect(harness.result.filteredLogs).toEqual([]);
    expect(harness.result.recipes).toEqual([]);
    expect(harness.result.recipeSkillLevels).toEqual(
      expectedHiddenRecipeSkillLevels,
    );
    expect(harness.result.heroOverview.level).toBe(game.player.level);
    expect(harness.result.inventoryCountsByItemKey.fiber).toBe(2);

    const initialFilteredLogs = harness.result.filteredLogs;
    const initialRecipes = harness.result.recipes;
    const initialRecipeSkillLevels = harness.result.recipeSkillLevels;

    await harness.rerender({
      ...baseProps,
      worldDayIndex: 1,
    });

    expect(filterSpy).not.toHaveBeenCalled();
    expect(recipeBookEntriesSpy).not.toHaveBeenCalled();
    expect(createSkillRecordSpy).not.toHaveBeenCalled();
    expect(harness.result.filteredLogs).toBe(initialFilteredLogs);
    expect(harness.result.recipes).toBe(initialRecipes);
    expect(harness.result.recipeSkillLevels).toBe(initialRecipeSkillLevels);

    await harness.unmount();
  });

  it('keeps deferred log and recipe outputs unchanged when those windows are visible', async () => {
    const game = createGame(3, 'use-app-game-view-visible-demand');
    game.player.learnedRecipeIds = ['cook-cooked-fish'];
    game.player.favoriteRecipeIds = ['cook-cooked-fish'];

    const logs = [...game.logs];
    const visibleLogFilters = {
      ...DEFAULT_LOG_FILTERS,
      motd: false,
    } satisfies Record<LogKind, boolean>;
    const expectedFilteredLogs = logs.filter(
      (entry) => visibleLogFilters[entry.kind],
    );
    const expectedRecipes = stateSelectors.getRecipeBookEntries(
      game.player.learnedRecipeIds,
      game.player.favoriteRecipeIds,
    );
    const expectedRecipeSkillLevels = createSkillRecord(
      (skill) => game.player.skills[skill].level,
    );
    const originalFilter = logs.filter.bind(logs);
    const filterSpy = vi.fn(originalFilter);
    logs.filter = filterSpy as typeof logs.filter;

    const recipeBookEntriesSpy = vi.spyOn(
      stateSelectors,
      'getRecipeBookEntries',
    );
    const createSkillRecordSpy = vi.spyOn(
      skillRecordModule,
      'createSkillRecord',
    );

    vi.mocked(useHexGameplayView).mockReturnValue(createHexGameplayViewStub());

    const harness = await renderHook(
      createUseAppGameViewOptions(game, logs, visibleLogFilters, {
        logs: true,
        recipes: true,
        hexTownStock: true,
      }),
    );

    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(recipeBookEntriesSpy).toHaveBeenCalledTimes(1);
    expect(createSkillRecordSpy).toHaveBeenCalledTimes(1);
    expect(vi.mocked(useHexGameplayView)).toHaveBeenCalledWith(
      expect.objectContaining({
        viewDemand: { hexTownStock: true },
      }),
    );
    expect(harness.result.filteredLogs).toEqual(expectedFilteredLogs);
    expect(harness.result.recipes).toEqual(expectedRecipes);
    expect(harness.result.recipeSkillLevels).toEqual(expectedRecipeSkillLevels);

    await harness.unmount();
  });
});

function createUseAppGameViewOptions(
  game: GameState,
  logs: GameState['logs'],
  logFilters: Record<LogKind, boolean> = DEFAULT_LOG_FILTERS,
  viewDemand = {
    logs: false,
    recipes: false,
    hexTownStock: false,
  },
) {
  return {
    activeWorldId: game.activeWorldId,
    bloodMoonActive: game.bloodMoonActive,
    combat: game.combat,
    enemies: game.enemies,
    hexItemModificationPickerActive: false,
    homeHex: game.homeHex,
    logFilters,
    logs,
    player: game.player,
    seed: game.seed,
    selectedHexItemModificationItem: null,
    selectedHexItemReforgeStatIndex: null,
    tiles: game.tiles,
    viewDemand,
    worlds: game.worlds,
    worldDayIndex: 0,
  };
}

function createHexGameplayViewStub() {
  return {
    bulkProspectEquipmentExplanation: null,
    bulkSellEquipmentExplanation: null,
    canBulkProspectEquipment: false,
    canBulkSellEquipment: false,
    claimStatus: { canClaim: false, reason: null },
    combatEnemies: [],
    currentTile: {
      coord: { q: 0, r: 0 },
      enemyIds: [],
      items: [],
      terrain: 'plains',
      structure: null,
    },
    currentTileHostileEnemyCount: 0,
    currentWorldKind: 'surface',
    gold: 0,
    interactAction: null,
    itemModification: null,
    outpostBuildStatus: {
      buildables: [],
      canBuild: false,
      reason: null,
    },
    territoryNpcHealStatus: {
      canHeal: false,
      cost: 0,
      reason: null,
    },
    townStock: [],
  } as unknown as ReturnType<typeof useHexGameplayView>;
}

async function renderHook(initialProps: Parameters<typeof useAppGameView>[0]) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  let latestResult!: ReturnType<typeof useAppGameView>;

  function Harness(props: Parameters<typeof useAppGameView>[0]) {
    latestResult = useAppGameView(props);
    return null;
  }

  await act(async () => {
    root.render(createElement(Harness, initialProps));
  });

  return {
    get result() {
      return latestResult;
    },
    async rerender(nextProps: Parameters<typeof useAppGameView>[0]) {
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
