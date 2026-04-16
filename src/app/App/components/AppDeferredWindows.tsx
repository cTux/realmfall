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
  recipeWindowStructure: ReturnType<
    typeof import('../hooks/useRecipeWindowStructure').useRecipeWindowStructure
  >;
  windowCloseHandlers: ReturnType<
    typeof import('../hooks/useAppWindowHandlers').useAppWindowHandlers
  >['windowCloseHandlers'];
  windowMoveHandlers: ReturnType<
    typeof import('../hooks/useAppWindowHandlers').useAppWindowHandlers
  >['windowMoveHandlers'];
}

export function AppDeferredWindows({
  combatPlayerParty,
  hexInfoView,
  loadedWindows,
  recipeWindowStructure,
  windowCloseHandlers,
  windowMoveHandlers,
  ...props
}: AppWindowsProps & AppDeferredWindowsProps) {
  const { actions, layout, views } = props;

  return (
    <>
      {loadedWindows.skills ? (
        <SkillsWindow
          position={layout.windows.skills}
          onMove={windowMoveHandlers.skills}
          visible={layout.windowShown.skills}
          onClose={windowCloseHandlers.skills}
          skills={views.stats.skills}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.recipes ? (
        <RecipeBookWindow
          position={layout.windows.recipes}
          onMove={windowMoveHandlers.recipes}
          visible={layout.windowShown.recipes}
          onClose={windowCloseHandlers.recipes}
          currentStructure={recipeWindowStructure}
          recipes={views.recipes}
          inventoryCounts={views.inventoryCounts}
          onCraft={actions.inventory.onCraftRecipe}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.hexInfo ? (
        <HexInfoWindow
          position={layout.windows.hexInfo}
          onMove={windowMoveHandlers.hexInfo}
          visible={layout.windowShown.hexInfo}
          onClose={windowCloseHandlers.hexInfo}
          isHome={hexInfoView.isHome}
          canSetHome={hexInfoView.canSetHome}
          onSetHome={actions.world.onSetHome}
          terrain={hexInfoView.terrain}
          structure={hexInfoView.structure}
          enemyCount={hexInfoView.enemyCount}
          interactLabel={views.interactLabel}
          canInteract={Boolean(views.interactLabel)}
          canProspect={views.canProspect}
          canSell={views.canSell}
          canClaim={views.claimStatus.canClaim}
          claimExplanation={views.claimStatus.reason}
          prospectExplanation={views.prospectExplanation}
          sellExplanation={views.sellExplanation}
          onInteract={actions.world.onInteract}
          onProspect={actions.world.onProspect}
          onSellAll={actions.world.onSellAll}
          onClaim={actions.world.onClaimHex}
          structureHp={views.currentTile.structureHp}
          structureMaxHp={views.currentTile.structureMaxHp}
          territoryName={views.currentTile.claim?.ownerName ?? null}
          territoryOwnerType={views.currentTile.claim?.ownerType ?? null}
          territoryNpc={views.currentTile.claim?.npc ?? null}
          townStock={views.townStock}
          gold={views.gold}
          onBuyItem={actions.world.onBuyTownItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.equipment ? (
        <EquipmentWindow
          position={layout.windows.equipment}
          onMove={windowMoveHandlers.equipment}
          visible={layout.windowShown.equipment}
          onClose={windowCloseHandlers.equipment}
          equipment={views.game.player.equipment}
          onHoverItem={actions.tooltip.onEquipmentHover}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          onUnequip={actions.inventory.onUnequip}
          onContextItem={actions.inventory.onEquippedContextItem}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.inventory ? (
        <InventoryWindow
          position={layout.windows.inventory}
          onMove={windowMoveHandlers.inventory}
          visible={layout.windowShown.inventory}
          onClose={windowCloseHandlers.inventory}
          inventory={views.game.player.inventory}
          equipment={views.game.player.equipment}
          onSort={actions.inventory.onSort}
          onEquip={actions.inventory.onEquip}
          onContextItem={actions.inventory.onContextItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.loot ? (
        <LootWindow
          position={layout.windows.loot}
          onMove={windowMoveHandlers.loot}
          visible={layout.windowShown.loot && views.lootWindowVisible}
          loot={views.lootSnapshot}
          equipment={views.game.player.equipment}
          onClose={windowCloseHandlers.loot}
          onTakeAll={actions.inventory.onTakeAllLoot}
          onTakeItem={actions.inventory.onTakeLootItem}
          onHoverItem={actions.tooltip.onShowItemTooltip}
          onLeaveItem={actions.tooltip.onCloseTooltip}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.log ? (
        <LogWindow
          position={layout.windows.log}
          onMove={windowMoveHandlers.log}
          visible={layout.windowShown.log}
          onClose={windowCloseHandlers.log}
          filters={views.logFilters}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={views.showFilterMenu}
          onToggleMenu={actions.logs.onToggleFilterMenu}
          onToggleFilter={actions.logs.onToggleLogFilter}
          logs={views.filteredLogs}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.combat && views.combatSnapshot ? (
        <CombatWindow
          position={layout.windows.combat}
          onMove={windowMoveHandlers.combat}
          visible={layout.windowShown.combat && views.combatWindowVisible}
          onClose={windowCloseHandlers.combat}
          combat={views.combatSnapshot.combat}
          playerParty={combatPlayerParty}
          enemies={views.combatSnapshot.enemies}
          worldTimeMs={views.worldTimeMs}
          onStart={actions.world.onStartCombat}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
          onHoverHeaderAction={actions.tooltip.onShowTooltip}
        />
      ) : null}
      {loadedWindows.settings ? (
        <GameSettingsWindow
          position={layout.windows.settings}
          onMove={windowMoveHandlers.settings}
          visible={layout.windowShown.settings}
          onClose={windowCloseHandlers.settings}
          graphicsSettings={views.graphicsSettings}
          onSave={actions.settings.onSaveGraphicsSettings}
          onSaveAndReload={actions.settings.onSaveGraphicsSettingsAndReload}
          onResetSaveData={actions.settings.onResetSaveData}
        />
      ) : null}
    </>
  );
}
