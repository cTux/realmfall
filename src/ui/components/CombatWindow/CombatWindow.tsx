import { lazy, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import inventoryStyles from '../InventoryWindow/styles.module.css';
import type { CombatWindowProps } from './types';
import styles from './styles.module.css';

const CombatWindowContent = lazy(() =>
  import('./CombatWindowContent').then((module) => ({
    default: module.CombatWindowContent,
  })),
);

export function CombatWindow({
  position,
  onMove,
  visible,
  onClose,
  combat,
  playerParty,
  enemies,
  worldTimeMs,
  onStart,
  onHoverDetail,
  onLeaveDetail,
}: CombatWindowProps) {
  const startButton = !combat.started ? (
    <button
      type="button"
      className={inventoryStyles.headerButton}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onStart();
      }}
    >
      (Q) Start
    </button>
  ) : null;

  return (
    <DraggableWindow
      title="Combat"
      headerActions={startButton}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <CombatWindowContent
          combat={combat}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </DraggableWindow>
  );
}
