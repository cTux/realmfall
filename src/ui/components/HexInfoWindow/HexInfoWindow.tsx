import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import labelStyles from '../windowLabels.module.scss';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.scss';

const HexInfoWindowContent = lazy(() =>
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
  terrain,
  structure,
  enemyCount,
  interactLabel,
  canInteract,
  canProspect,
  canSell,
  prospectExplanation,
  sellExplanation,
  onInteract,
  onProspect,
  onSellAll,
  structureHp,
  structureMaxHp,
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
            disabled={isHome}
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
          prospectExplanation={prospectExplanation}
          sellExplanation={sellExplanation}
          onInteract={onInteract}
          onProspect={onProspect}
          onSellAll={onSellAll}
          structureHp={structureHp}
          structureMaxHp={structureMaxHp}
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
