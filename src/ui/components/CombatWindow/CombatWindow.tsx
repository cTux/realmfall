import { lazy, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
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
  return (
    <DraggableWindow
      title="Combat"
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
          onStart={onStart}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </DraggableWindow>
  );
}
