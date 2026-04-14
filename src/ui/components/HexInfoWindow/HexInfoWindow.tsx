import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import labelStyles from '../windowLabels.module.scss';
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
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.hexInfo}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
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
            <button
              type="button"
              className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
              disabled={!canInteract}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onInteract();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  t('ui.hexInfo.interactAction'),
                  [{ kind: 'text', text: t('ui.tooltip.window.interact') }],
                  'rgba(74, 222, 128, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              {t('ui.hexInfo.interactAction')}
            </button>
          ) : null}
          <button
            type="button"
            className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
            aria-pressed={isHome}
            disabled={!canSetHome || isHome}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onSetHome();
            }}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                t('ui.hexInfo.setHomeAction'),
                [{ kind: 'text', text: t('ui.tooltip.window.setHome') }],
                'rgba(125, 211, 252, 0.9)',
              )
            }
            onMouseLeave={onLeaveDetail}
          >
            {t('ui.hexInfo.setHomeAction')}
          </button>
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
    </DraggableWindow>
  );
});
