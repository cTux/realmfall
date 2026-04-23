import type { ComponentType, ReactElement } from 'react';
import { t } from '../../../i18n';
import { createLazyWindowComponent } from '../../../ui/components/lazyWindowComponent';
import { DEFAULT_LOG_FILTERS } from '../../constants';
import type {
  AppWindowsActions,
  AppWindowsViewState,
} from '../AppWindows.types';

export const APP_DEFERRED_WINDOW_KEYS = [
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'log',
  'settings',
] as const;

type AppDeferredWindowKey = (typeof APP_DEFERRED_WINDOW_KEYS)[number];

interface DetailTooltipHandlers {
  onHoverDetail: AppWindowsActions['tooltip']['onShowTooltip'];
  onLeaveDetail: AppWindowsActions['tooltip']['onCloseTooltip'];
}

export interface AppDeferredWindowsProps {
  appReady: boolean;
  combatPlayerParty: ReturnType<
    typeof import('../hooks/useCombatPlayerParty').useCombatPlayerParty
  >;
  hexInfoView: ReturnType<
    typeof import('../hooks/useHexInfoView').useHexInfoView
  >;
  mountedWindows: Pick<
    ReturnType<typeof import('../hooks/useMountedWindows').useMountedWindows>,
    AppDeferredWindowKey
  >;
  managedWindowProps: ReturnType<
    typeof import('../hooks/useManagedWindowProps').useManagedWindowProps
  >;
  recipeWindowStructure: ReturnType<
    typeof import('../hooks/useRecipeWindowStructure').useRecipeWindowStructure
  >;
  heroStats: AppWindowsViewState['hero']['stats'];
  inventoryView: AppWindowsViewState['inventory'];
  hexView: AppWindowsViewState['hex'];
  recipesView: AppWindowsViewState['recipes'];
  combatView: AppWindowsViewState['combat'];
  logsView: AppWindowsViewState['logs'];
  settingsView: AppWindowsViewState['settings'];
  tooltipActions: AppWindowsActions['tooltip'];
  inventoryActions: AppWindowsActions['inventory'];
  hexActions: AppWindowsActions['hex'];
  recipeActions: AppWindowsActions['recipes'];
  logActions: AppWindowsActions['logs'];
  settingsActions: AppWindowsActions['settings'];
}

interface AppDeferredWindowEntry {
  key: AppDeferredWindowKey;
  element: ReactElement;
}

function loadNamedWindowModule<Props>(
  loadComponent: () => Promise<ComponentType<Props>>,
) {
  return () =>
    loadComponent().then((component) => ({
      default: component,
    }));
}

const deferredWindowComponents = {
  skills: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/SkillsWindow'))['SkillsWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/SkillsWindow').then(
        (module) => module.SkillsWindow,
      ),
    ),
  ),
  recipes: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/RecipeBookWindow'))['RecipeBookWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/RecipeBookWindow').then(
        (module) => module.RecipeBookWindow,
      ),
    ),
  ),
  hexInfo: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/HexInfoWindow'))['HexInfoWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/HexInfoWindow').then(
        (module) => module.HexInfoWindow,
      ),
    ),
  ),
  equipment: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/EquipmentWindow'))['EquipmentWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/EquipmentWindow').then(
        (module) => module.EquipmentWindow,
      ),
    ),
  ),
  inventory: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/InventoryWindow'))['InventoryWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/InventoryWindow').then(
        (module) => module.InventoryWindow,
      ),
    ),
  ),
  log: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/LogWindow'))['LogWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/LogWindow').then(
        (module) => module.LogWindow,
      ),
    ),
  ),
  settings: createLazyWindowComponent<
    Parameters<
      (typeof import('../../../ui/components/GameSettingsWindow'))['GameSettingsWindow']
    >[0]
  >(
    loadNamedWindowModule(() =>
      import('../../../ui/components/GameSettingsWindow').then(
        (module) => module.GameSettingsWindow,
      ),
    ),
  ),
};

const deferredWindowRenderers: Record<
  AppDeferredWindowKey,
  (
    context: AppDeferredWindowsProps & {
      detailTooltipHandlers: DetailTooltipHandlers;
    },
  ) => ReactElement
> = {
  skills: ({ detailTooltipHandlers, heroStats, managedWindowProps }) => {
    const SkillsWindow = deferredWindowComponents.skills;
    return (
      <SkillsWindow
        {...managedWindowProps.skills}
        skills={heroStats.skills}
        {...detailTooltipHandlers}
      />
    );
  },
  recipes: ({
    detailTooltipHandlers,
    inventoryActions,
    managedWindowProps,
    recipeActions,
    recipeWindowStructure,
    recipesView,
  }) => {
    const RecipeBookWindow = deferredWindowComponents.recipes;
    return (
      <RecipeBookWindow
        {...managedWindowProps.recipes}
        currentStructure={recipeWindowStructure}
        recipes={recipesView.entries}
        recipeSkillLevels={recipesView.skillLevels}
        inventoryCountsByItemKey={recipesView.inventoryCountsByItemKey}
        materialFilterItemKey={recipesView.materialFilterItemKey}
        onResetMaterialFilter={recipeActions.onClearMaterialFilter}
        onCraft={inventoryActions.onCraftRecipe}
        {...detailTooltipHandlers}
      />
    );
  },
  hexInfo: ({
    combatPlayerParty,
    combatView,
    detailTooltipHandlers,
    hexActions,
    hexInfoView,
    hexView,
    inventoryActions,
    inventoryView,
    managedWindowProps,
    tooltipActions,
  }) => {
    const HexInfoWindow = deferredWindowComponents.hexInfo;
    return (
      <HexInfoWindow
        {...managedWindowProps.hexInfo}
        isHome={hexInfoView.isHome}
        canSetHome={hexInfoView.canSetHome}
        onSetHome={hexActions.onSetHome}
        terrain={hexInfoView.terrain}
        structure={hexInfoView.structure}
        enemyCount={hexInfoView.enemyCount}
        interactLabel={hexView.interactLabel}
        canInteract={Boolean(hexView.interactLabel)}
        canBulkProspectEquipment={hexView.canBulkProspectEquipment}
        canBulkSellEquipment={hexView.canBulkSellEquipment}
        itemModification={hexView.itemModification}
        canTerritoryAction={hexView.claimStatus.canClaim}
        territoryActionKind={
          hexView.claimStatus.action === 'none'
            ? undefined
            : hexView.claimStatus.action
        }
        territoryActionLabel={claimStatusActionLabel(
          hexView.claimStatus.action,
        )}
        territoryActionExplanation={hexView.claimStatus.reason}
        bulkProspectEquipmentExplanation={
          hexView.bulkProspectEquipmentExplanation
        }
        bulkSellEquipmentExplanation={hexView.bulkSellEquipmentExplanation}
        onInteract={hexActions.onInteract}
        onProspect={hexActions.onProspect}
        onSellAll={hexActions.onSellAll}
        onApplyItemModification={hexActions.onApplySelectedItemModification}
        onClearItemModificationSelection={
          hexActions.onClearSelectedItemModification
        }
        onSelectItemModificationReforgeStat={
          hexActions.onSelectItemModificationReforgeStat
        }
        onToggleItemModificationPicker={
          hexActions.onToggleItemModificationPicker
        }
        onTerritoryAction={hexActions.onClaimHex}
        canHealTerritoryNpc={hexView.territoryNpcHealStatus.canHeal}
        territoryNpcHealExplanation={hexView.territoryNpcHealStatus.reason}
        onHealTerritoryNpc={hexActions.onHealTerritoryNpc}
        structureHp={hexView.currentTile.structureHp}
        structureMaxHp={hexView.currentTile.structureMaxHp}
        territoryName={hexView.currentTile.claim?.ownerName ?? null}
        territoryOwnerType={hexView.currentTile.claim?.ownerType ?? null}
        territoryNpc={hexView.currentTile.claim?.npc ?? null}
        townStock={hexView.townStock}
        gold={hexView.gold}
        equipment={inventoryView.equipment}
        loot={hexView.currentTile.items}
        combat={hexView.combat}
        combatPlayerParty={combatPlayerParty}
        combatEnemies={combatView.snapshot?.enemies ?? []}
        combatWorldTimeMs={hexView.worldTimeMs}
        onBuyItem={hexActions.onBuyTownItem}
        onTakeAll={inventoryActions.onTakeAllLoot}
        onTakeItem={inventoryActions.onTakeLootItem}
        onStartCombat={hexActions.onStartCombat}
        onForfeitCombat={hexActions.onForfeitCombat}
        onHoverItem={tooltipActions.onShowItemTooltip}
        onLeaveItem={tooltipActions.onCloseTooltip}
        {...detailTooltipHandlers}
      />
    );
  },
  equipment: ({
    detailTooltipHandlers,
    hexView,
    inventoryActions,
    inventoryView,
    managedWindowProps,
    tooltipActions,
  }) => {
    const EquipmentWindow = deferredWindowComponents.equipment;
    return (
      <EquipmentWindow
        {...managedWindowProps.equipment}
        equipment={inventoryView.equipment}
        onHoverItem={tooltipActions.onEquipmentHover}
        onLeaveItem={tooltipActions.onCloseTooltip}
        onUnequip={inventoryActions.onUnequip}
        onContextItem={inventoryActions.onEquippedContextItem}
        onSelectHexItemModificationItem={
          inventoryActions.onSelectHexItemModificationItem
        }
        hexItemModificationPickerActive={Boolean(
          hexView.itemModification?.pickerActive,
        )}
        {...detailTooltipHandlers}
      />
    );
  },
  inventory: ({
    detailTooltipHandlers,
    hexView,
    inventoryActions,
    inventoryView,
    managedWindowProps,
    tooltipActions,
  }) => {
    const InventoryWindow = deferredWindowComponents.inventory;
    return (
      <InventoryWindow
        {...managedWindowProps.inventory}
        inventory={inventoryView.inventory}
        equipment={inventoryView.equipment}
        learnedRecipeIds={inventoryView.learnedRecipeIds}
        onSort={inventoryActions.onSort}
        onActivateItem={inventoryActions.onActivateItem}
        onContextItem={inventoryActions.onContextItem}
        onSelectHexItemModificationItem={
          inventoryActions.onSelectHexItemModificationItem
        }
        hexItemModificationPickerActive={Boolean(
          hexView.itemModification?.pickerActive,
        )}
        onHoverItem={tooltipActions.onShowItemTooltip}
        onLeaveItem={tooltipActions.onCloseTooltip}
        {...detailTooltipHandlers}
      />
    );
  },
  log: ({
    detailTooltipHandlers,
    logActions,
    logsView,
    managedWindowProps,
  }) => {
    const LogWindow = deferredWindowComponents.log;
    return (
      <LogWindow
        {...managedWindowProps.log}
        filters={logsView.filters}
        defaultFilters={DEFAULT_LOG_FILTERS}
        showFilterMenu={logsView.showFilterMenu}
        onToggleMenu={logActions.onToggleFilterMenu}
        onToggleFilter={logActions.onToggleLogFilter}
        logs={logsView.filtered}
        {...detailTooltipHandlers}
      />
    );
  },
  settings: ({ managedWindowProps, settingsActions, settingsView }) => {
    const GameSettingsWindow = deferredWindowComponents.settings;
    return (
      <GameSettingsWindow
        {...managedWindowProps.settings}
        audioSettings={settingsView.audio}
        graphicsSettings={settingsView.graphics}
        onSave={settingsActions.onSaveSettings}
        onSaveAndReload={settingsActions.onSaveSettingsAndReload}
        onResetSaveArea={settingsActions.onResetSaveArea}
      />
    );
  },
};

export function getMountedDeferredWindowKeys(
  mountedWindows: AppDeferredWindowsProps['mountedWindows'],
) {
  return APP_DEFERRED_WINDOW_KEYS.filter((key) => mountedWindows[key]);
}

export function getAppDeferredWindowEntries(
  context: AppDeferredWindowsProps,
): AppDeferredWindowEntry[] {
  const detailTooltipHandlers = {
    onHoverDetail: context.tooltipActions.onShowTooltip,
    onLeaveDetail: context.tooltipActions.onCloseTooltip,
  };

  return getMountedDeferredWindowKeys(context.mountedWindows).map((key) => ({
    key,
    element: deferredWindowRenderers[key]({
      ...context,
      detailTooltipHandlers,
    }),
  }));
}

function claimStatusActionLabel(
  action: AppWindowsViewState['hex']['claimStatus']['action'],
) {
  switch (action) {
    case 'unclaim':
      return t('ui.hexInfo.unclaimAction');
    default:
      return t('ui.hexInfo.claimAction');
  }
}
