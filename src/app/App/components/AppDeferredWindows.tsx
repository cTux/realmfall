import { memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { DEFAULT_LOG_FILTERS } from '../../constants';
import { WindowLoadingState } from '../../../ui/components/WindowLoadingState';
import { createLazyWindowComponent } from '../../../ui/components/lazyWindowComponent';
import type {
  AppWindowsActions,
  AppWindowsViewState,
} from '../AppWindows.types';

const SkillsWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/SkillsWindow'))['SkillsWindow']
  >[0]
>(() =>
  import('../../../ui/components/SkillsWindow').then((module) => ({
    default: module.SkillsWindow,
  })),
);

const RecipeBookWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/RecipeBookWindow'))['RecipeBookWindow']
  >[0]
>(() =>
  import('../../../ui/components/RecipeBookWindow').then((module) => ({
    default: module.RecipeBookWindow,
  })),
);

const HexInfoWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/HexInfoWindow'))['HexInfoWindow']
  >[0]
>(() =>
  import('../../../ui/components/HexInfoWindow').then((module) => ({
    default: module.HexInfoWindow,
  })),
);

const EquipmentWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/EquipmentWindow'))['EquipmentWindow']
  >[0]
>(() =>
  import('../../../ui/components/EquipmentWindow').then((module) => ({
    default: module.EquipmentWindow,
  })),
);

const InventoryWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/InventoryWindow'))['InventoryWindow']
  >[0]
>(() =>
  import('../../../ui/components/InventoryWindow').then((module) => ({
    default: module.InventoryWindow,
  })),
);

const LogWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/LogWindow'))['LogWindow']
  >[0]
>(() =>
  import('../../../ui/components/LogWindow').then((module) => ({
    default: module.LogWindow,
  })),
);

const GameSettingsWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/GameSettingsWindow'))['GameSettingsWindow']
  >[0]
>(() =>
  import('../../../ui/components/GameSettingsWindow').then((module) => ({
    default: module.GameSettingsWindow,
  })),
);

interface AppDeferredWindowsProps {
  appReady: boolean;
  combatPlayerParty: ReturnType<
    typeof import('../hooks/useCombatPlayerParty').useCombatPlayerParty
  >;
  hexInfoView: ReturnType<
    typeof import('../hooks/useHexInfoView').useHexInfoView
  >;
  mountedWindows: ReturnType<
    typeof import('../hooks/useMountedWindows').useMountedWindows
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

export const AppDeferredWindows = memo(function AppDeferredWindows({
  appReady,
  combatView,
  combatPlayerParty,
  hexActions,
  hexView,
  hexInfoView,
  heroStats,
  inventoryView,
  inventoryActions,
  logsView,
  logActions,
  mountedWindows,
  managedWindowProps,
  recipeActions,
  recipesView,
  recipeWindowStructure,
  settingsActions,
  settingsView,
  tooltipActions,
}: AppDeferredWindowsProps) {
  const detailTooltipHandlers = {
    onHoverDetail: tooltipActions.onShowTooltip,
    onLeaveDetail: tooltipActions.onCloseTooltip,
  };
  const fallback = appReady ? <WindowLoadingState /> : null;

  return (
    <>
      {mountedWindows.skills ? (
        <Suspense fallback={fallback}>
          <SkillsWindow
            {...managedWindowProps.skills}
            skills={heroStats.skills}
            {...detailTooltipHandlers}
          />
        </Suspense>
      ) : null}
      {mountedWindows.recipes ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.hexInfo ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.equipment ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.inventory ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.log ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.settings ? (
        <Suspense fallback={fallback}>
          <GameSettingsWindow
            {...managedWindowProps.settings}
            audioSettings={settingsView.audio}
            graphicsSettings={settingsView.graphics}
            onSave={settingsActions.onSaveSettings}
            onSaveAndReload={settingsActions.onSaveSettingsAndReload}
            onResetSaveArea={settingsActions.onResetSaveArea}
          />
        </Suspense>
      ) : null}
    </>
  );
});

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
