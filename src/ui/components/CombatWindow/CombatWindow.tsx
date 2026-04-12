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
  enemies,
  player,
  onAttack,
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
          enemies={enemies}
          player={player}
          onAttack={onAttack}
        />
      </Suspense>
    </DraggableWindow>
  );
}
