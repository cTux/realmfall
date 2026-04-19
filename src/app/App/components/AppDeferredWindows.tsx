import { Suspense } from 'react';
import { DEFAULT_LOG_FILTERS } from '../../constants';
import { WindowLoadingState } from '../../../ui/components/WindowLoadingState';
import { createLazyWindowComponent } from '../../../ui/components/lazyWindowComponent';
import type { AppWindowsProps } from '../AppWindows.types';

const SkillsWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/SkillsWindow'))['SkillsWindow']>[0]
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
  Parameters<(typeof import('../../../ui/components/HexInfoWindow'))['HexInfoWindow']>[0]
>(() =>
  import('../../../ui/components/HexInfoWindow').then((module) => ({
    default: module.HexInfoWindow,
  })),
);

const EquipmentWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/EquipmentWindow'))['EquipmentWindow']>[0]
>(() =>
  import('../../../ui/components/EquipmentWindow').then((module) => ({
    default: module.EquipmentWindow,
  })),
);

const InventoryWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/InventoryWindow'))['InventoryWindow']>[0]
>(() =>
  import('../../../ui/components/InventoryWindow').then((module) => ({
    default: module.InventoryWindow,
  })),
);

const LootWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/LootWindow'))['LootWindow']>[0]
>(() =>
  import('../../../ui/components/LootWindow').then((module) => ({
    default: module.LootWindow,
  })),
);

const LogWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/LogWindow'))['LogWindow']>[0]
>(() =>
  import('../../../ui/components/LogWindow').then((module) => ({
    default: module.LogWindow,
  })),
);

const CombatWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../ui/components/CombatWindow'))['CombatWindow']>[0]
>(() =>
  import('../../../ui/components/CombatWindow').then((module) => ({
    default: module.CombatWindow,
  })),
);

const AudioPlayerWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../ui/components/AudioPlayerWindow'))['AudioPlayerWindow']
  >[0]
>(() =>
  import('../../../ui/components/AudioPlayerWindow').then((module) => ({
    default: module.AudioPlayerWindow,
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
}

export function AppDeferredWindows({
  combatPlayerParty,
  hexInfoView,
  mountedWindows,
  managedWindowProps,
  recipeWindowStructure,
  ...props
}: AppWindowsProps & AppDeferredWindowsProps) {
  const { actions, views } = props;
  const detailTooltipHandlers = {
    onHoverDetail: actions.tooltip.onShowTooltip,
    onLeaveDetail: actions.tooltip.onCloseTooltip,
  };
  const fallback = <WindowLoadingState />;

  return (
    <>
      {mountedWindows.audioPlayer ? (
        <Suspense fallback={fallback}>
          <AudioPlayerWindow
            {...managedWindowProps.audioPlayer}
            area={views.audioPlayer.area}
            canPlay={views.audioPlayer.canPlay}
            currentTime={views.audioPlayer.currentTime}
            currentTrack={views.audioPlayer.currentTrack}
            currentTrackIndex={views.audioPlayer.currentTrackIndex}
            duration={views.audioPlayer.duration}
            isPlaying={views.audioPlayer.isPlaying}
            onNextTrack={actions.audioPlayer.onNextTrack}
            onPlayPause={actions.audioPlayer.onPlayPause}
            onPreviousTrack={actions.audioPlayer.onPreviousTrack}
            onSeek={actions.audioPlayer.onSeek}
            playlist={views.audioPlayer.playlist}
            progress={views.audioPlayer.progress}
          />
        </Suspense>
      ) : null}
      {mountedWindows.skills ? (
        <Suspense fallback={fallback}>
          <SkillsWindow
            {...managedWindowProps.skills}
            skills={views.hero.stats.skills}
            {...detailTooltipHandlers}
          />
        </Suspense>
      ) : null}
      {mountedWindows.recipes ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.hexInfo ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.equipment ? (
        <Suspense fallback={fallback}>
          <EquipmentWindow
            {...managedWindowProps.equipment}
            equipment={views.player.equipment}
            onHoverItem={actions.tooltip.onEquipmentHover}
            onLeaveItem={actions.tooltip.onCloseTooltip}
            onUnequip={actions.inventory.onUnequip}
            onContextItem={actions.inventory.onEquippedContextItem}
            {...detailTooltipHandlers}
          />
        </Suspense>
      ) : null}
      {mountedWindows.inventory ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.loot ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.log ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.combat && views.combat.snapshot ? (
        <Suspense fallback={fallback}>
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
        </Suspense>
      ) : null}
      {mountedWindows.settings ? (
        <Suspense fallback={fallback}>
          <GameSettingsWindow
            {...managedWindowProps.settings}
            audioSettings={views.settings.audio}
            graphicsSettings={views.settings.graphics}
            onSave={actions.settings.onSaveSettings}
            onSaveAndReload={actions.settings.onSaveSettingsAndReload}
            onResetSaveData={actions.settings.onResetSaveData}
          />
        </Suspense>
      ) : null}
    </>
  );
}
