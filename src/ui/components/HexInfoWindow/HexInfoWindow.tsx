import { memo } from 'react';
import { t } from '../../../i18n';
import type { TooltipLine } from '../../tooltips';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.scss';

const COMBAT_FORFEIT_DELAY_MS = 60_000;

const HexInfoWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./HexInfoWindowContent'))['HexInfoWindowContent']
  >[0]
>(() =>
  import('./HexInfoWindowContent').then((module) => ({
    default: module.HexInfoWindowContent,
  })),
);

export const HexInfoWindow = memo(function HexInfoWindow({
  position,
  onMove,
  visible,
  onClose,
  isHome,
  onSetHome,
  canSetHome = true,
  terrain,
  structure,
  enemyCount,
  interactLabel,
  canInteract,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  itemModification,
  canTerritoryAction,
  territoryActionKind = 'claim',
  territoryActionLabel,
  territoryActionExplanation,
  canHealTerritoryNpc,
  territoryNpcHealExplanation,
  bulkProspectEquipmentExplanation,
  bulkSellEquipmentExplanation,
  onInteract,
  onProspect,
  onSellAll,
  onApplyItemModification = () => undefined,
  onClearItemModificationSelection = () => undefined,
  onSelectItemModificationReforgeStat = () => undefined,
  onToggleItemModificationPicker = () => undefined,
  onTerritoryAction,
  onHealTerritoryNpc,
  structureHp,
  structureMaxHp,
  territoryName,
  territoryOwnerType,
  territoryNpc,
  townStock,
  gold,
  equipment = {},
  loot = [],
  combat = null,
  combatPlayerParty = [],
  combatEnemies = [],
  combatWorldTimeMs,
  onBuyItem,
  onTakeAll,
  onTakeItem,
  onStartCombat = () => undefined,
  onForfeitCombat = () => undefined,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowProps) {
  const showForfeitAction = Boolean(
    combat?.started &&
    combat.startedAtMs != null &&
    combatWorldTimeMs != null &&
    combatWorldTimeMs - combat.startedAtMs >= COMBAT_FORFEIT_DELAY_MS,
  );
  const primaryHeaderAction = combat ? (
    combat.started ? (
      showForfeitAction ? (
        <WindowHeaderActionButton
          className={inventoryStyles.headerButton}
          onClick={onForfeitCombat}
          tooltipTitle={t('ui.combat.forfeitAction')}
          tooltipLines={[
            { kind: 'text', text: t('ui.tooltip.window.forfeitCombat') },
          ]}
          tooltipBorderColor="rgba(248, 113, 113, 0.9)"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        >
          {t('ui.combat.forfeitAction')}
        </WindowHeaderActionButton>
      ) : null
    ) : (
      <WindowHeaderActionButton
        className={inventoryStyles.headerButton}
        onClick={onStartCombat}
        tooltipTitle={t('ui.combat.startAction')}
        tooltipLines={[
          { kind: 'text', text: t('ui.tooltip.window.startCombat') },
        ]}
        tooltipBorderColor="rgba(248, 250, 252, 0.9)"
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      >
        {t('ui.combat.startAction')}
      </WindowHeaderActionButton>
    )
  ) : interactLabel ? (
    <WindowHeaderActionButton
      className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
      disabled={!canInteract}
      onClick={onInteract}
      tooltipTitle={t('ui.hexInfo.interactAction')}
      tooltipLines={[{ kind: 'text', text: t('ui.tooltip.window.interact') }]}
      tooltipBorderColor="rgba(74, 222, 128, 0.9)"
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      {t('ui.hexInfo.interactAction')}
    </WindowHeaderActionButton>
  ) : null;
  const territoryActionTooltipLines = getTerritoryActionTooltipLines({
    territoryActionExplanation,
    territoryActionKind,
  });
  const territoryNpcHealTooltipLines = getTerritoryNpcHealTooltipLines(
    territoryNpcHealExplanation,
  );
  const territoryActionTooltipBorderColor =
    territoryActionKind === 'unclaim'
      ? 'rgba(248, 113, 113, 0.9)'
      : 'rgba(74, 222, 128, 0.9)';

  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.hexInfo.plain}
      hotkeyLabel={WINDOW_LABELS.hexInfo}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 420, minHeight: 320 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <>
          {primaryHeaderAction}
          {territoryNpc ? (
            <WindowHeaderActionButton
              className={inventoryStyles.headerButton}
              disabled={!canHealTerritoryNpc}
              onClick={onHealTerritoryNpc}
              tooltipTitle={t('ui.hexInfo.healAction')}
              tooltipLines={territoryNpcHealTooltipLines}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.healAction')}
            </WindowHeaderActionButton>
          ) : null}
          <WindowHeaderActionButton
            className={inventoryStyles.headerButton}
            disabled={!canTerritoryAction}
            onClick={onTerritoryAction}
            tooltipTitle={territoryActionLabel}
            tooltipLines={territoryActionTooltipLines}
            tooltipBorderColor={territoryActionTooltipBorderColor}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          >
            {territoryActionLabel}
          </WindowHeaderActionButton>
          <WindowHeaderActionButton
            className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
            ariaPressed={isHome}
            disabled={!canSetHome || isHome}
            onClick={onSetHome}
            tooltipTitle={t('ui.hexInfo.setHomeAction')}
            tooltipLines={[
              { kind: 'text', text: t('ui.tooltip.window.setHome') },
            ]}
            tooltipBorderColor="rgba(125, 211, 252, 0.9)"
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          >
            {t('ui.hexInfo.setHomeAction')}
          </WindowHeaderActionButton>
        </>
      }
      content={HexInfoWindowContent}
      contentProps={{
        terrain,
        structure,
        enemyCount,
        interactLabel,
        canInteract,
        canBulkProspectEquipment,
        canBulkSellEquipment,
        itemModification,
        territoryActionKind,
        canTerritoryAction,
        territoryActionLabel,
        territoryActionExplanation,
        canHealTerritoryNpc,
        territoryNpcHealExplanation,
        bulkProspectEquipmentExplanation,
        bulkSellEquipmentExplanation,
        onInteract,
        onProspect,
        onSellAll,
        onApplyItemModification,
        onClearItemModificationSelection,
        onSelectItemModificationReforgeStat,
        onToggleItemModificationPicker,
        onTerritoryAction,
        onHealTerritoryNpc,
        structureHp,
        structureMaxHp,
        territoryName,
        territoryOwnerType,
        territoryNpc,
        townStock,
        gold,
        equipment,
        loot,
        combat,
        combatPlayerParty,
        combatEnemies,
        combatWorldTimeMs,
        onBuyItem,
        onTakeAll,
        onTakeItem,
        onStartCombat,
        onForfeitCombat,
        onHoverItem,
        onLeaveItem,
        onHoverDetail,
        onLeaveDetail,
      }}
    />
  );
});

function getTerritoryActionTooltipLines({
  territoryActionExplanation,
  territoryActionKind,
}: {
  territoryActionExplanation?: string | null;
  territoryActionKind: 'claim' | 'unclaim';
}) {
  const lines: TooltipLine[] = [];
  const claimMaterialExplanation = t(
    'game.message.claim.status.needsBannerMaterials',
  );

  if (
    territoryActionExplanation &&
    territoryActionExplanation !== claimMaterialExplanation
  ) {
    lines.push({ kind: 'text', text: territoryActionExplanation });
  }

  lines.push({
    kind: 'text',
    text:
      territoryActionKind === 'unclaim'
        ? t('ui.tooltip.window.unclaim')
        : t('ui.tooltip.window.claim'),
  });

  return lines;
}

function getTerritoryNpcHealTooltipLines(reason?: string | null) {
  const lines: TooltipLine[] = [
    { kind: 'text', text: t('ui.tooltip.window.healAtFactionNpc') },
  ];

  if (reason) {
    lines.push({ kind: 'text', text: reason });
  }

  return lines;
}
