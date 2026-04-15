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
  return (
    <>
      {loadedWindows.skills ? (
        <SkillsWindow
          position={props.windows.skills}
          onMove={windowMoveHandlers.skills}
          visible={props.windowShown.skills}
          onClose={windowCloseHandlers.skills}
          skills={props.stats.skills}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.recipes ? (
        <RecipeBookWindow
          position={props.windows.recipes}
          onMove={windowMoveHandlers.recipes}
          visible={props.windowShown.recipes}
          onClose={windowCloseHandlers.recipes}
          hasRecipeBook={props.recipeBookKnown}
          currentStructure={recipeWindowStructure}
          recipes={props.recipes}
          inventoryCounts={props.inventoryCounts}
          onCraft={props.onCraftRecipe}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.hexInfo ? (
        <HexInfoWindow
          position={props.windows.hexInfo}
          onMove={windowMoveHandlers.hexInfo}
          visible={props.windowShown.hexInfo}
          onClose={windowCloseHandlers.hexInfo}
          isHome={hexInfoView.isHome}
          canSetHome={hexInfoView.canSetHome}
          onSetHome={props.onSetHome}
          terrain={hexInfoView.terrain}
          structure={hexInfoView.structure}
          enemyCount={hexInfoView.enemyCount}
          interactLabel={props.interactLabel}
          canInteract={Boolean(props.interactLabel)}
          canProspect={props.canProspect}
          canSell={props.canSell}
          canClaim={props.claimStatus.canClaim}
          claimExplanation={props.claimStatus.reason}
          prospectExplanation={props.prospectExplanation}
          sellExplanation={props.sellExplanation}
          onInteract={props.onInteract}
          onProspect={props.onProspect}
          onSellAll={props.onSellAll}
          onClaim={props.onClaimHex}
          structureHp={props.currentTile.structureHp}
          structureMaxHp={props.currentTile.structureMaxHp}
          territoryName={props.currentTile.claim?.ownerName ?? null}
          territoryOwnerType={props.currentTile.claim?.ownerType ?? null}
          territoryNpc={props.currentTile.claim?.npc ?? null}
          townStock={props.townStock}
          gold={props.gold}
          onBuyItem={props.onBuyTownItem}
          onHoverItem={props.onShowItemTooltip}
          onLeaveItem={props.onCloseTooltip}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.equipment ? (
        <EquipmentWindow
          position={props.windows.equipment}
          onMove={windowMoveHandlers.equipment}
          visible={props.windowShown.equipment}
          onClose={windowCloseHandlers.equipment}
          equipment={props.game.player.equipment}
          onHoverItem={props.onEquipmentHover}
          onLeaveItem={props.onCloseTooltip}
          onUnequip={props.onUnequip}
          onContextItem={props.onEquippedContextItem}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.inventory ? (
        <InventoryWindow
          position={props.windows.inventory}
          onMove={windowMoveHandlers.inventory}
          visible={props.windowShown.inventory}
          onClose={windowCloseHandlers.inventory}
          inventory={props.game.player.inventory}
          equipment={props.game.player.equipment}
          onSort={props.onSort}
          onEquip={props.onEquip}
          onContextItem={props.onContextItem}
          onHoverItem={props.onShowItemTooltip}
          onLeaveItem={props.onCloseTooltip}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.loot ? (
        <LootWindow
          position={props.windows.loot}
          onMove={windowMoveHandlers.loot}
          visible={props.windowShown.loot && props.lootWindowVisible}
          loot={props.lootSnapshot}
          equipment={props.game.player.equipment}
          onClose={windowCloseHandlers.loot}
          onTakeAll={props.onTakeAllLoot}
          onTakeItem={props.onTakeLootItem}
          onHoverItem={props.onShowItemTooltip}
          onLeaveItem={props.onCloseTooltip}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.log ? (
        <LogWindow
          position={props.windows.log}
          onMove={windowMoveHandlers.log}
          visible={props.windowShown.log}
          onClose={windowCloseHandlers.log}
          filters={props.logFilters}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={props.showFilterMenu}
          onToggleMenu={props.onToggleFilterMenu}
          onToggleFilter={props.onToggleLogFilter}
          logs={props.filteredLogs}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      {loadedWindows.combat && props.combatSnapshot ? (
        <CombatWindow
          position={props.windows.combat}
          onMove={windowMoveHandlers.combat}
          visible={props.windowShown.combat && props.combatWindowVisible}
          onClose={windowCloseHandlers.combat}
          combat={props.combatSnapshot.combat}
          playerParty={combatPlayerParty}
          enemies={props.combatSnapshot.enemies}
          worldTimeMs={props.worldTimeMs}
          onStart={props.onStartCombat}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
          onHoverHeaderAction={props.onShowTooltip}
        />
      ) : null}
      {loadedWindows.settings ? (
        <GameSettingsWindow
          position={props.windows.settings}
          onMove={windowMoveHandlers.settings}
          visible={props.windowShown.settings}
          onClose={windowCloseHandlers.settings}
          graphicsSettings={props.graphicsSettings}
          onSave={props.onSaveGraphicsSettings}
          onSaveAndReload={props.onSaveGraphicsSettingsAndReload}
          onResetSaveData={props.onResetSaveData}
        />
      ) : null}
    </>
  );
}
