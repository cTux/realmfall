import { Suspense } from 'react';
import { useWorldClockTime } from '../../../app/App/worldClockStore';
import { t } from '../../../i18n';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import { WindowShell } from '../WindowShell';
import type { CombatWindowProps } from './types';
import styles from './styles.module.scss';

const CombatWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./CombatWindowContent'))['CombatWindowContent']>[0]
>(() =>
  import('./CombatWindowContent').then((module) => ({
    default: module.CombatWindowContent,
  })),
);

export const CombatWindow = ({
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
}: CombatWindowProps) => {
  const liveWorldTimeMs = useWorldClockTime();
  const resolvedWorldTimeMs = liveWorldTimeMs || worldTimeMs || 0;
  const startButton = !combat.started ? (
    <WindowHeaderActionButton
      className={inventoryStyles.headerButton}
      onClick={onStart}
      tooltipTitle={t('ui.combat.startAction')}
      tooltipLines={[
        { kind: 'text', text: t('ui.tooltip.window.startCombat') },
      ]}
      tooltipBorderColor="rgba(248, 250, 252, 0.9)"
      onHoverDetail={onHoverHeaderAction}
      onLeaveDetail={onLeaveDetail}
    >
      {t('ui.combat.startAction')}
    </WindowHeaderActionButton>
  ) : null;

  return (
    <WindowShell
      title={t('ui.window.combat.plain')}
      headerActions={startButton}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <CombatWindowContent
          combat={combat}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={resolvedWorldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
};
