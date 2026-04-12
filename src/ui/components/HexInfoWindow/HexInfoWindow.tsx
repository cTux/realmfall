import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.css';

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
      title={renderWindowLabel(WINDOW_LABELS.hexInfo, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
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
