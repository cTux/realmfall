import { DEFAULT_LOG_FILTERS } from '../../constants';
import { CombatWindow } from '../../../ui/components/CombatWindow';
import { EquipmentWindow } from '../../../ui/components/EquipmentWindow';
import { GameSettingsWindow } from '../../../ui/components/GameSettingsWindow';
import { HexInfoWindow } from '../../../ui/components/HexInfoWindow';
import { InventoryWindow } from '../../../ui/components/InventoryWindow';
import { LogWindow } from '../../../ui/components/LogWindow';
import { LootWindow } from '../../../ui/components/LootWindow';
import { RecipeBookWindow } from '../../../ui/components/RecipeBookWindow';
import { SkillsWindow } from '../../../ui/components/SkillsWindow';
import type { AppWindowsProps } from '../AppWindows.types';

interface AppDeferredWindowsProps {
  combatPlayerParty: ReturnType<
    typeof import('../hooks/useCombatPlayerParty').useCombatPlayerParty
  >;
  hexInfoView: ReturnType<
    typeof import('../hooks/useHexInfoView').useHexInfoView
  >;
  loadedWindows: ReturnType<
    typeof import('../hooks/useDeferredWindows').useDeferredWindows
  >;
  managedWindowProps: ReturnType<
    typeof import('../hooks/useManagedWindowProps').useManagedWindowProps
  >;
  recipeWindowStructure: ReturnType<
    typeof import('../hooks/useRecipeWindowStructure').useRecipeWindowStructure
  >;
}

export function AppDeferredWindows({
  combatPlayerParty,
  hexInfoView,
  loadedWindows,
  managedWindowProps,
  recipeWindowStructure,
  ...props
}: AppWindowsProps & AppDeferredWindowsProps) {
  const { actions, views } = props;
  const detailTooltipHandlers = {
    onHoverDetail: actions.tooltip.onShowTooltip,
    onLeaveDetail: actions.tooltip.onCloseTooltip,
  };

  return (
    <>
      {loadedWindows.skills ? (
        <SkillsWindow
          {...managedWindowProps.skills}
          skills={views.hero.stats.skills}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.recipes ? (
        <RecipeBookWindow
          {...managedWindowProps.recipes}
          currentStructure={recipeWindowStructure}
          recipes={views.recipes.entries}
          recipeSkillLevels={views.recipes.skillLevels}
          inventoryCountsByItemKey={views.recipes.inventoryCountsByItemKey}
          materialFilterItemKey={views.recipes.materialFilterItemKey}
          onResetMaterialFilter={actions.recipes.onClearMaterialFilter}
          onCraft={actions.inventory.onCraftRecipe}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.hexInfo ? (
        <HexInfoWindow
          {...managedWindowProps.hexInfo}
          isHome={hexInfoView.isHome}
          canSetHome={hexInfoView.canSetHome}
          onSetHome={actions.world.onSetHome}
          terrain={hexInfoView.terrain}
          structure={hexInfoView.structure}
          enemyCount={hexInfoView.enemyCount}
          interactLabel={views.world.interactLabel}
          canInteract={Boolean(views.world.interactLabel)}
          canProspectInventoryEquipment={
            views.world.canProspectInventoryEquipment
          }
          canSellInventoryEquipment={views.world.canSellInventoryEquipment}
          canTerritoryAction={views.world.claimStatus.canClaim}
          territoryActionLabel={views.world.claimStatus.actionLabel}
          territoryActionExplanation={views.world.claimStatus.reason}
          prospectInventoryEquipmentExplanation={
            views.world.prospectInventoryEquipmentExplanation
          }
          sellInventoryEquipmentExplanation={
            views.world.sellInventoryEquipmentExplanation
          }
          onInteract={actions.world.onInteract}
          onProspect={actions.world.onProspect}
          onSellAll={actions.world.onSellAll}
          onTerritoryAction={actions.world.onClaimHex}
          structureHp={views.world.currentTile.structureHp}
          structureMaxHp={views.world.currentTile.structureMaxHp}
          territoryName={views.world.currentTile.claim?.ownerName ?? null}
          territoryOwnerType={views.world.currentTile.claim?.ownerType ?? null}
          territoryNpc={views.world.currentTile.claim?.npc ?? null}
          townStock={views.world.townStock}
          gold={views.world.gold}
          onBuyItem={actions.world.onBuyTownItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.equipment ? (
        <EquipmentWindow
          {...managedWindowProps.equipment}
          equipment={views.player.equipment}
          onHoverItem={actions.tooltip.onEquipmentHover}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          onUnequip={actions.inventory.onUnequip}
          onContextItem={actions.inventory.onEquippedContextItem}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.inventory ? (
        <InventoryWindow
          {...managedWindowProps.inventory}
          inventory={views.player.inventory}
          equipment={views.player.equipment}
          learnedRecipeIds={views.player.learnedRecipeIds}
          onSort={actions.inventory.onSort}
          onEquip={actions.inventory.onEquip}
          onContextItem={actions.inventory.onContextItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.loot ? (
        <LootWindow
          {...managedWindowProps.loot}
          visible={managedWindowProps.loot.visible && views.loot.visible}
          equipment={views.player.equipment}
          loot={views.loot.snapshot}
          onTakeAll={actions.inventory.onTakeAllLoot}
          onTakeItem={actions.inventory.onTakeLootItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.log ? (
        <LogWindow
          {...managedWindowProps.log}
          filters={views.logs.filters}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={views.logs.showFilterMenu}
          onToggleMenu={actions.logs.onToggleFilterMenu}
          onToggleFilter={actions.logs.onToggleLogFilter}
          logs={views.logs.filtered}
          {...detailTooltipHandlers}
        />
      ) : null}
      {loadedWindows.combat && views.combat.snapshot ? (
        <CombatWindow
          {...managedWindowProps.combat}
          visible={managedWindowProps.combat.visible && views.combat.visible}
          combat={views.combat.snapshot.combat}
          playerParty={combatPlayerParty}
          enemies={views.combat.snapshot.enemies}
          worldTimeMs={views.hero.worldTimeMs}
          onStart={actions.world.onStartCombat}
          {...detailTooltipHandlers}
          onHoverHeaderAction={actions.tooltip.onShowTooltip}
        />
      ) : null}
      {loadedWindows.settings ? (
        <GameSettingsWindow
          {...managedWindowProps.settings}
          graphicsSettings={views.settings.graphics}
          onSave={actions.settings.onSaveGraphicsSettings}
          onSaveAndReload={actions.settings.onSaveGraphicsSettingsAndReload}
          onResetSaveData={actions.settings.onResetSaveData}
        />
      ) : null}
    </>
  );
}
