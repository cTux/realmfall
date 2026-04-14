import { lazy, Suspense } from 'react';
import { t } from '../../../i18n';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import type { CombatWindowProps } from './types';
import styles from './styles.module.scss';

const CombatWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./CombatWindowContent').then((module) => ({
      default: module.CombatWindowContent,
    })),
  ),
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
  onHoverHeaderAction,
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
      onMouseEnter={(event) =>
        onHoverHeaderAction?.(
          event,
          t('ui.combat.startAction'),
          [{ kind: 'text', text: t('ui.tooltip.window.startCombat') }],
          'rgba(248, 250, 252, 0.9)',
        )
      }
      onMouseLeave={onLeaveDetail}
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
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
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
