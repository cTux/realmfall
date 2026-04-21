import { memo } from 'react';
import { t } from '../../../i18n';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.scss';

const LootWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./LootWindowContent'))['LootWindowContent']>[0]
>(() =>
  import('./LootWindowContent').then((module) => ({
    default: module.LootWindowContent,
  })),
);

export const LootWindow = memo(function LootWindow({
  position,
  onMove,
  visible,
  loot,
  equipment,
  onClose,
  onTakeAll,
  onTakeItem,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: LootWindowProps) {
  return (
    <DeferredWindowShell
      title={t('ui.loot.title')}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 320, minHeight: 220 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <WindowHeaderActionButton
              className={styles.headerButton}
              disabled={loot.length === 0}
              onClick={onTakeAll}
              tooltipTitle={t('ui.loot.takeAllAction')}
              tooltipLines={[
                { kind: 'text', text: t('ui.tooltip.window.takeAllLoot') },
              ]}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.loot.takeAllAction')}
            </WindowHeaderActionButton>
          </div>
        </div>
      }
      content={LootWindowContent}
      contentProps={{
        loot,
        equipment,
        onTakeItem,
        onHoverItem,
        onLeaveItem,
      }}
    />
  );
});
