import { memo, useEffect, useState } from 'react';
import { useWorldClockTime } from '../../../app/App/worldClockStore';
import { t } from '../../../i18n';
import { TOOLTIP_BORDER_COLORS } from '../../../theme.config';
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
  showTooltipTags,
  terrain,
  structure,
  hexDescription,
  enemyCount,
  interactLabel,
  canInteract,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  canBuildOutpost = false,
  outpostBuildOptions = [],
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
  onBuildOutpost = () => undefined,
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
  onBuyItem,
  onTakeAll,
  onTakeItem,
  onForfeitCombat = () => undefined,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowProps) {
  const [outpostBuildPickerActive, setOutpostBuildPickerActive] =
    useState(false);

  useEffect(() => {
    if (!canBuildOutpost) {
      setOutpostBuildPickerActive(false);
    }
  }, [canBuildOutpost]);

  const liveWorldTimeMs = useWorldClockTime();
  const headerInteractLabel =
    interactLabel && interactLabel.includes('(')
      ? interactLabel
      : interactLabel
        ? t('ui.hexInfo.interactAction')
        : null;
  const showForfeitAction = Boolean(
    combat?.started &&
    combat.startedAtMs != null &&
    liveWorldTimeMs - combat.startedAtMs >= COMBAT_FORFEIT_DELAY_MS,
  );
  const primaryHeaderAction = combat ? (
    showForfeitAction ? (
      <WindowHeaderActionButton
        className={inventoryStyles.headerButton}
        onClick={onForfeitCombat}
        tooltipTitle={t('ui.combat.forfeitAction')}
        tooltipLines={[
          { kind: 'text', text: t('ui.tooltip.window.forfeitCombat') },
        ]}
        tooltipBorderColor={TOOLTIP_BORDER_COLORS.danger}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      >
        {t('ui.combat.forfeitAction')}
      </WindowHeaderActionButton>
    ) : null
  ) : headerInteractLabel ? (
    <WindowHeaderActionButton
      className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
      disabled={!canInteract}
      onClick={onInteract}
      tooltipTitle={headerInteractLabel}
      tooltipLines={[{ kind: 'text', text: t('ui.tooltip.window.interact') }]}
      tooltipBorderColor={TOOLTIP_BORDER_COLORS.positive}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      {headerInteractLabel}
    </WindowHeaderActionButton>
  ) : null;
  const territoryActionTooltipLines = getTerritoryActionTooltipLines({
    territoryActionExplanation,
    territoryActionKind,
  });
  const territoryNpcHealTooltipLines = getTerritoryNpcHealTooltipLines(
    territoryNpcHealExplanation,
  );
  const sellAllTooltipLines = getSellAllTooltipLines(
    bulkSellEquipmentExplanation,
  );
  const territoryActionTooltipBorderColor =
    territoryActionKind === 'unclaim'
      ? TOOLTIP_BORDER_COLORS.danger
      : TOOLTIP_BORDER_COLORS.positive;
  const handleBuildOutpost = (
    outpostType: (typeof outpostBuildOptions)[number]['type'],
  ) => {
    setOutpostBuildPickerActive(false);
    onBuildOutpost(outpostType);
  };

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
              tooltipBorderColor={TOOLTIP_BORDER_COLORS.positive}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.healAction')}
            </WindowHeaderActionButton>
          ) : null}
          {canBulkSellEquipment ? (
            <WindowHeaderActionButton
              className={inventoryStyles.headerButton}
              onClick={onSellAll}
              tooltipTitle={t('ui.hexInfo.sellAllAction')}
              tooltipLines={sellAllTooltipLines}
              tooltipBorderColor={TOOLTIP_BORDER_COLORS.neutral}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.sellAllAction')}
            </WindowHeaderActionButton>
          ) : null}
          {canBuildOutpost ? (
            <WindowHeaderActionButton
              className={inventoryStyles.headerButton}
              ariaPressed={outpostBuildPickerActive}
              onClick={() => setOutpostBuildPickerActive((current) => !current)}
              tooltipTitle={t('ui.hexInfo.buildOutpostAction')}
              tooltipLines={[
                { kind: 'text', text: t('ui.tooltip.window.buildOutpost') },
              ]}
              tooltipBorderColor={TOOLTIP_BORDER_COLORS.warning}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.buildOutpostAction')}
            </WindowHeaderActionButton>
          ) : null}
          {canTerritoryAction ? (
            <WindowHeaderActionButton
              className={inventoryStyles.headerButton}
              onClick={onTerritoryAction}
              tooltipTitle={territoryActionLabel}
              tooltipLines={territoryActionTooltipLines}
              tooltipBorderColor={territoryActionTooltipBorderColor}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {territoryActionLabel}
            </WindowHeaderActionButton>
          ) : null}
          {canSetHome && !isHome ? (
            <WindowHeaderActionButton
              className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
              ariaPressed={isHome}
              onClick={onSetHome}
              tooltipTitle={t('ui.hexInfo.setHomeAction')}
              tooltipLines={[
                { kind: 'text', text: t('ui.tooltip.window.setHome') },
              ]}
              tooltipBorderColor={TOOLTIP_BORDER_COLORS.info}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.setHomeAction')}
            </WindowHeaderActionButton>
          ) : null}
        </>
      }
      content={HexInfoWindowContent}
      contentProps={{
        terrain,
        structure,
        hexDescription,
        enemyCount,
        showTooltipTags,
        interactLabel,
        canInteract,
        canBulkProspectEquipment,
        canBulkSellEquipment,
        canBuildOutpost,
        outpostBuildPickerActive,
        outpostBuildOptions,
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
        onBuildOutpost: handleBuildOutpost,
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
        onBuyItem,
        onTakeAll,
        onTakeItem,
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

function getSellAllTooltipLines(reason?: string | null) {
  const lines: TooltipLine[] = [
    { kind: 'text', text: t('ui.tooltip.window.sellAll') },
  ];

  if (reason) {
    lines.push({ kind: 'text', text: reason });
  }

  return lines;
}
