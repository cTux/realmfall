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
        />
      </Suspense>
    </DraggableWindow>
  );
});
