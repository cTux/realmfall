import { lazy, Suspense } from 'react';
import { t } from '../../../i18n';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import type { CombatWindowProps } from './types';
import styles from './styles.module.scss';

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
      {t('ui.combat.startAction')}
    </button>
  ) : null;

  return (
    <DraggableWindow
      title={t('ui.window.combat.plain')}
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
