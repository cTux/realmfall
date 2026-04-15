import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import { WindowShell } from '../WindowShell';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.scss';

const HexInfoWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./HexInfoWindowContent').then((module) => ({
      default: module.HexInfoWindowContent,
    })),
  ),
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
  canProspect,
  canSell,
  canClaim,
  claimExplanation,
  prospectExplanation,
  sellExplanation,
  onInteract,
  onProspect,
  onSellAll,
  onClaim,
  structureHp,
  structureMaxHp,
  territoryName,
  territoryOwnerType,
  territoryNpc,
  townStock,
  gold,
  onBuyItem,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowProps) {
  return (
    <WindowShell
      title={WINDOW_LABELS.hexInfo.plain}
      hotkeyLabel={WINDOW_LABELS.hexInfo}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <>
          {interactLabel ? (
            <WindowHeaderActionButton
              className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
              disabled={!canInteract}
              onClick={onInteract}
              tooltipTitle={t('ui.hexInfo.interactAction')}
              tooltipLines={[
                { kind: 'text', text: t('ui.tooltip.window.interact') },
              ]}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.hexInfo.interactAction')}
            </WindowHeaderActionButton>
          ) : null}
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
    >
      <Suspense fallback={<WindowLoadingState />}>
        <HexInfoWindowContent
          terrain={terrain}
          structure={structure}
          enemyCount={enemyCount}
          interactLabel={interactLabel}
          canInteract={canInteract}
          canProspect={canProspect}
          canSell={canSell}
          canClaim={canClaim}
          claimExplanation={claimExplanation}
          prospectExplanation={prospectExplanation}
          sellExplanation={sellExplanation}
          onInteract={onInteract}
          onProspect={onProspect}
          onSellAll={onSellAll}
          onClaim={onClaim}
          structureHp={structureHp}
          structureMaxHp={structureMaxHp}
          territoryName={territoryName}
          territoryOwnerType={territoryOwnerType}
          territoryNpc={territoryNpc}
          townStock={townStock}
          gold={gold}
          onBuyItem={onBuyItem}
          onHoverItem={onHoverItem}
          onLeaveItem={onLeaveItem}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
