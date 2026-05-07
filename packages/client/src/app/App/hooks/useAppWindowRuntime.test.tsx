import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_WINDOWS, DEFAULT_WINDOW_VISIBILITY } from '../../constants';
import type { AppWindowsActions, AppWindowsProps } from '../AppWindows.types';
import { useAppWindowRuntime } from './useAppWindowRuntime';
import { useAppWindowActions } from './useAppWindowActions';
import { useAppWindowViews } from './useAppWindowViews';
import { useAppWindowsProps } from './useAppWindowsProps';

vi.mock('./useAppWindowViews', () => ({
  useAppWindowViews: vi.fn(),
}));

vi.mock('./useAppWindowActions', () => ({
  useAppWindowActions: vi.fn(),
}));

vi.mock('./useAppWindowsProps', () => ({
  useAppWindowsProps: vi.fn(),
}));

describe('useAppWindowRuntime', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('adapts grouped runtime slices into window view and action inputs', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    const mockedActions = {} as AppWindowsActions;
    const mockedViews = { itemMenu: null } as ReturnType<
      typeof useAppWindowViews
    >;
    const mockedProps = {
      actions: mockedActions,
      layout: {
        appReady: true,
        keepCombatWindowMounted: false,
        keepLootWindowMounted: true,
        tooltipPositionRef: { current: null },
        windowShown: DEFAULT_WINDOW_VISIBILITY,
        windows: DEFAULT_WINDOWS,
      },
      views: mockedViews,
    } as AppWindowsProps;

    vi.mocked(useAppWindowViews).mockReturnValue(mockedViews);
    vi.mocked(useAppWindowActions).mockReturnValue(mockedActions);
    vi.mocked(useAppWindowsProps).mockReturnValue(mockedProps);

    const controllerActions = {
      applySelectedItemModification: vi.fn(),
      clearSelectedItem: vi.fn(),
      closeItemMenu: vi.fn(),
      closeTooltip: vi.fn(),
      handleActivateInventoryItem: vi.fn(),
      handleAssignActionBarSlot: vi.fn(),
      handleContextItem: vi.fn(),
      handleEquipmentHover: vi.fn(),
      handleOpenRecipeBookWithMaterialFilter: vi.fn(),
      handleSelectHexModificationInventoryItem: vi.fn(),
      handleTakeAllLoot: vi.fn(),
      showTooltip: vi.fn(),
      toggleDockWindow: vi.fn(),
      toggleFilterMenu: vi.fn(),
      toggleHexItemModificationPicker: vi.fn(),
      toggleLogFilter: vi.fn(),
    } as const;
    const controllerMutators = {
      moveWindow: vi.fn(),
      setSelectedHexItemReforgeStatIndex: vi.fn(),
      setWindowVisibility: vi.fn(),
    } as const;
    const controllerState = {
      actionBarSlots: [],
      audioSettings: { musicVolume: 0.5, muted: false, uiVolume: 0.5 },
      gameplaySettings: {},
      graphicsSettings: {},
      interfaceSettings: { showTooltipTags: true },
      itemMenu: { item: null, x: 12, y: 16 },
      logFilters: {},
      preferredRecipeSkill: null,
      recipeMaterialFilterItemKey: 'fiber',
      showFilterMenu: true,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      windows: DEFAULT_WINDOWS,
    } as const;
    const windowTransitions = {
      combatSnapshot: null,
      combatWindowVisible: false,
      keepCombatWindowMounted: false,
      keepLootWindowMounted: true,
      lootWindowVisible: true,
      tileLootSnapshot: [],
    } as const;
    const settingsActions = {
      handleResetSaveArea: vi.fn(),
      handleSaveSettings: vi.fn(),
      handleSaveSettingsAndReload: vi.fn(),
      handleSetHome: vi.fn(),
    } as const;
    const gameView = {
      bulkProspectEquipmentExplanation: 'prospect',
      bulkSellEquipmentExplanation: 'sell',
      canBulkProspectEquipment: true,
      canBulkSellEquipment: false,
      claimStatus: { canClaim: false },
      currentTile: { coord: { q: 0, r: 0 }, items: [], structure: null },
      currentTileHostileEnemyCount: 1,
      filteredLogs: [],
      gold: 7,
      heroOverview: { level: 2 },
      inventoryCountsByItemKey: { fiber: 2 },
      itemModification: null,
      outpostBuildStatus: { canBuild: false, buildables: [], reason: null },
      recipes: [],
      recipeSkillLevels: {},
      territoryNpcHealStatus: { canHeal: false },
      townStock: [],
    } as const;

    let latestProps: AppWindowsProps | null = null;

    function Harness() {
      latestProps = useAppWindowRuntime({
        appReady: true,
        controllerActions: controllerActions as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['controllerActions'],
        controllerMutators: controllerMutators as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['controllerMutators'],
        controllerState: controllerState as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['controllerState'],
        gameSnapshot: {
          combat: null,
          homeHex: { q: 1, r: 2 },
          player: {
            coord: { q: 3, r: 4 },
            equipment: {},
            hunger: 5,
            inventory: [],
            learnedRecipeIds: [],
            level: 2,
            mana: 9,
            thirst: 6,
          },
        },
        gameView: gameView as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['gameView'],
        interactLabel: 'Gather',
        onInteract: vi.fn(),
        settingsActions: settingsActions as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['settingsActions'],
        tooltipPositionRef: { current: null },
        windowTransitions: windowTransitions as unknown as Parameters<
          typeof useAppWindowRuntime
        >[0]['windowTransitions'],
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    expect(latestProps).toBe(mockedProps);
    expect(useAppWindowViews).toHaveBeenCalledWith(
      expect.objectContaining({
        actionBarSlots: controllerState.actionBarSlots,
        combatSnapshot: windowTransitions.combatSnapshot,
        currentTile: gameView.currentTile,
        currentTileHostileEnemyCount: gameView.currentTileHostileEnemyCount,
        heroOverview: gameView.heroOverview,
        homeHex: { q: 1, r: 2 },
        interactLabel: 'Gather',
        lootWindowVisible: windowTransitions.lootWindowVisible,
        playerState: {
          coord: { q: 3, r: 4 },
          equipment: {},
          hunger: 5,
          inventory: [],
          learnedRecipeIds: [],
          level: 2,
          mana: 9,
          thirst: 6,
        },
        tileLootSnapshot: windowTransitions.tileLootSnapshot,
      }),
    );
    expect(useAppWindowActions).toHaveBeenCalledWith(
      expect.objectContaining({
        closeItemMenu: controllerActions.closeItemMenu,
        closeTooltip: controllerActions.closeTooltip,
        handleActivateInventoryItem:
          controllerActions.handleActivateInventoryItem,
        handleAssignActionBarSlot: controllerActions.handleAssignActionBarSlot,
        handleApplySelectedItemModification:
          controllerActions.applySelectedItemModification,
        handleContextItem: controllerActions.handleContextItem,
        handleEquipmentHover: controllerActions.handleEquipmentHover,
        handleInteract: expect.any(Function),
        handleOpenRecipeBookWithMaterialFilter:
          controllerActions.handleOpenRecipeBookWithMaterialFilter,
        handleResetSaveArea: settingsActions.handleResetSaveArea,
        handleSelectHexItemModificationItem:
          controllerActions.handleSelectHexModificationInventoryItem,
        handleSelectItemModificationReforgeStat:
          controllerMutators.setSelectedHexItemReforgeStatIndex,
        handleSetHome: settingsActions.handleSetHome,
        handleTakeAllLoot: controllerActions.handleTakeAllLoot,
        moveWindow: controllerMutators.moveWindow,
        setWindowVisibility: controllerMutators.setWindowVisibility,
        showTooltip: controllerActions.showTooltip,
        toggleDockWindow: controllerActions.toggleDockWindow,
        toggleFilterMenu: controllerActions.toggleFilterMenu,
        toggleItemModificationPicker:
          controllerActions.toggleHexItemModificationPicker,
        toggleLogFilter: controllerActions.toggleLogFilter,
      }),
    );
    expect(useAppWindowsProps).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: mockedActions,
        appReady: true,
        keepCombatWindowMounted: windowTransitions.keepCombatWindowMounted,
        keepLootWindowMounted: windowTransitions.keepLootWindowMounted,
        views: mockedViews,
        windowShown: controllerState.windowShown,
        windows: controllerState.windows,
      }),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
