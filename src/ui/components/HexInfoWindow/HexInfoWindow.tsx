import { memo } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.scss';

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
  itemModificationHint,
  canTerritoryAction,
  territoryActionLabel,
  territoryActionExplanation,
  bulkProspectEquipmentExplanation,
  bulkSellEquipmentExplanation,
  onInteract,
  onProspect,
  onSellAll,
  onTerritoryAction,
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
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowProps) {
  const primaryHeaderAction = combat ? (
    combat.started ? null : (
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
          <WindowHeaderActionButton
            className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
            aria-pressed={isHome}
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
        itemModificationHint,
        canTerritoryAction,
        territoryActionLabel,
        territoryActionExplanation,
        bulkProspectEquipmentExplanation,
        bulkSellEquipmentExplanation,
        onInteract,
        onProspect,
        onSellAll,
        onTerritoryAction,
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
        onHoverItem,
        onLeaveItem,
        onHoverDetail,
        onLeaveDetail,
      }}
    />
  );
});
