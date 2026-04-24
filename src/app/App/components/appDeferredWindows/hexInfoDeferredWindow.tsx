import { t } from '../../../../i18n';
import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import type { HexViewState } from '../../AppWindows.types';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const HexInfoWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/HexInfoWindow'))['HexInfoWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/HexInfoWindow').then(
      (module) => module.HexInfoWindow,
    ),
  ),
);

export const hexInfoDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'hexInfo',
  render: ({
    actions,
    combatPlayerParty,
    detailTooltipHandlers,
    hexInfoView,
    managedWindowProps,
    views,
  }) => (
    <HexInfoWindow
      {...managedWindowProps.hexInfo}
      isHome={hexInfoView.isHome}
      canSetHome={hexInfoView.canSetHome}
      onSetHome={actions.hex.onSetHome}
      terrain={hexInfoView.terrain}
      structure={hexInfoView.structure}
      enemyCount={hexInfoView.enemyCount}
      interactLabel={views.hex.interactLabel}
      canInteract={Boolean(views.hex.interactLabel)}
      canBulkProspectEquipment={views.hex.canBulkProspectEquipment}
      canBulkSellEquipment={views.hex.canBulkSellEquipment}
      itemModification={views.hex.itemModification}
      canTerritoryAction={views.hex.claimStatus.canClaim}
      territoryActionKind={
        views.hex.claimStatus.action === 'none'
          ? undefined
          : views.hex.claimStatus.action
      }
      territoryActionLabel={claimStatusActionLabel(
        views.hex.claimStatus.action,
      )}
      territoryActionExplanation={views.hex.claimStatus.reason}
      bulkProspectEquipmentExplanation={
        views.hex.bulkProspectEquipmentExplanation
      }
      bulkSellEquipmentExplanation={views.hex.bulkSellEquipmentExplanation}
      onInteract={actions.hex.onInteract}
      onProspect={actions.hex.onProspect}
      onSellAll={actions.hex.onSellAll}
      onApplyItemModification={actions.hex.onApplySelectedItemModification}
      onClearItemModificationSelection={
        actions.hex.onClearSelectedItemModification
      }
      onSelectItemModificationReforgeStat={
        actions.hex.onSelectItemModificationReforgeStat
      }
      onToggleItemModificationPicker={
        actions.hex.onToggleItemModificationPicker
      }
      onTerritoryAction={actions.hex.onClaimHex}
      canHealTerritoryNpc={views.hex.territoryNpcHealStatus.canHeal}
      territoryNpcHealExplanation={views.hex.territoryNpcHealStatus.reason}
      onHealTerritoryNpc={actions.hex.onHealTerritoryNpc}
      structureHp={views.hex.currentTile.structureHp}
      structureMaxHp={views.hex.currentTile.structureMaxHp}
      territoryName={views.hex.currentTile.claim?.ownerName ?? null}
      territoryOwnerType={views.hex.currentTile.claim?.ownerType ?? null}
      territoryNpc={views.hex.currentTile.claim?.npc ?? null}
      townStock={views.hex.townStock}
      gold={views.hex.gold}
      equipment={views.inventory.equipment}
      loot={views.hex.currentTile.items}
      combat={views.hex.combat}
      combatPlayerParty={combatPlayerParty}
      combatEnemies={views.combat.snapshot?.enemies ?? []}
      onBuyItem={actions.hex.onBuyTownItem}
      onTakeAll={actions.inventory.onTakeAllLoot}
      onTakeItem={actions.inventory.onTakeLootItem}
      onStartCombat={actions.hex.onStartCombat}
      onForfeitCombat={actions.hex.onForfeitCombat}
      onHoverItem={actions.tooltip.onShowItemTooltip}
      onLeaveItem={actions.tooltip.onCloseTooltip}
      {...detailTooltipHandlers}
    />
  ),
};

function claimStatusActionLabel(action: HexViewState['claimStatus']['action']) {
  switch (action) {
    case 'unclaim':
      return t('ui.hexInfo.unclaimAction');
    default:
      return t('ui.hexInfo.claimAction');
  }
}
