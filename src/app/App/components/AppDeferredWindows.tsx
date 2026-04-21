import { memo, Suspense } from 'react';
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

const LootWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/LootWindow'))['LootWindow']
  >[0]
>(() =>
  import('../../../ui/components/LootWindow').then((module) => ({
    default: module.LootWindow,
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

const CombatWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/CombatWindow'))['CombatWindow']
  >[0]
>(() =>
  import('../../../ui/components/CombatWindow').then((module) => ({
    default: module.CombatWindow,
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
  playerView: AppWindowsViewState['player'];
  worldView: AppWindowsViewState['world'];
  recipesView: AppWindowsViewState['recipes'];
  lootView: AppWindowsViewState['loot'];
  combatView: AppWindowsViewState['combat'];
  logsView: AppWindowsViewState['logs'];
  settingsView: AppWindowsViewState['settings'];
  tooltipActions: AppWindowsActions['tooltip'];
  inventoryActions: AppWindowsActions['inventory'];
  worldActions: AppWindowsActions['world'];
  recipeActions: AppWindowsActions['recipes'];
  logActions: AppWindowsActions['logs'];
  settingsActions: AppWindowsActions['settings'];
}

export const AppDeferredWindows = memo(function AppDeferredWindows({
  combatView,
  combatPlayerParty,
  hexInfoView,
  heroStats,
  inventoryActions,
  logsView,
  logActions,
  lootView,
  mountedWindows,
  managedWindowProps,
  playerView,
  recipeActions,
  recipesView,
  recipeWindowStructure,
  settingsActions,
  settingsView,
  tooltipActions,
  worldActions,
  worldView,
}: AppDeferredWindowsProps) {
  const detailTooltipHandlers = {
    onHoverDetail: tooltipActions.onShowTooltip,
    onLeaveDetail: tooltipActions.onCloseTooltip,
  };
  const fallback = <WindowLoadingState />;

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
            onSetHome={worldActions.onSetHome}
            terrain={hexInfoView.terrain}
            structure={hexInfoView.structure}
            enemyCount={hexInfoView.enemyCount}
            interactLabel={worldView.interactLabel}
            canInteract={Boolean(worldView.interactLabel)}
            canProspectInventoryEquipment={
              worldView.canProspectInventoryEquipment
            }
            canSellInventoryEquipment={worldView.canSellInventoryEquipment}
            canTerritoryAction={worldView.claimStatus.canClaim}
            territoryActionLabel={worldView.claimStatus.actionLabel}
            territoryActionExplanation={worldView.claimStatus.reason}
            prospectInventoryEquipmentExplanation={
              worldView.prospectInventoryEquipmentExplanation
            }
            sellInventoryEquipmentExplanation={
              worldView.sellInventoryEquipmentExplanation
            }
            onInteract={worldActions.onInteract}
            onProspect={worldActions.onProspect}
            onSellAll={worldActions.onSellAll}
            onTerritoryAction={worldActions.onClaimHex}
            structureHp={worldView.currentTile.structureHp}
            structureMaxHp={worldView.currentTile.structureMaxHp}
            territoryName={worldView.currentTile.claim?.ownerName ?? null}
            territoryOwnerType={worldView.currentTile.claim?.ownerType ?? null}
            territoryNpc={worldView.currentTile.claim?.npc ?? null}
            townStock={worldView.townStock}
            gold={worldView.gold}
            onBuyItem={worldActions.onBuyTownItem}
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
            equipment={playerView.equipment}
            onHoverItem={tooltipActions.onEquipmentHover}
            onLeaveItem={tooltipActions.onCloseTooltip}
            onUnequip={inventoryActions.onUnequip}
            onContextItem={inventoryActions.onEquippedContextItem}
            {...detailTooltipHandlers}
          />
        </Suspense>
      ) : null}
      {mountedWindows.inventory ? (
        <Suspense fallback={fallback}>
          <InventoryWindow
            {...managedWindowProps.inventory}
            inventory={playerView.inventory}
            equipment={playerView.equipment}
            learnedRecipeIds={playerView.learnedRecipeIds}
            onSort={inventoryActions.onSort}
            onActivateItem={inventoryActions.onActivateItem}
            onContextItem={inventoryActions.onContextItem}
            onHoverItem={tooltipActions.onShowItemTooltip}
            onLeaveItem={tooltipActions.onCloseTooltip}
            {...detailTooltipHandlers}
          />
        </Suspense>
      ) : null}
      {mountedWindows.loot ? (
        <Suspense fallback={fallback}>
          <LootWindow
            {...managedWindowProps.loot}
            visible={managedWindowProps.loot.visible && lootView.visible}
            equipment={playerView.equipment}
            loot={lootView.snapshot}
            onTakeAll={inventoryActions.onTakeAllLoot}
            onTakeItem={inventoryActions.onTakeLootItem}
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
      {mountedWindows.combat && combatView.snapshot ? (
        <Suspense fallback={fallback}>
          <CombatWindow
            {...managedWindowProps.combat}
            visible={managedWindowProps.combat.visible && combatView.visible}
            combat={combatView.snapshot.combat}
            playerParty={combatPlayerParty}
            enemies={combatView.snapshot.enemies}
            onStart={worldActions.onStartCombat}
            {...detailTooltipHandlers}
            onHoverHeaderAction={tooltipActions.onShowTooltip}
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
            onResetSaveData={settingsActions.onResetSaveData}
          />
        </Suspense>
      ) : null}
    </>
  );
});
