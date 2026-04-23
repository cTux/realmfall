import { t } from '../../../i18n';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.scss';

type LootWindowContentProps = Parameters<
  (typeof import('./LootWindowContent'))['LootWindowContent']
>[0];

export const LootWindow = createDeferredWindowComponent<
  LootWindowProps,
  LootWindowContentProps
>({
  displayName: 'LootWindow',
  loadContent: () =>
    import('./LootWindowContent').then((module) => ({
      default: module.LootWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    loot,
    onClose,
    onTakeAll,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: t('ui.loot.title'),
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    resizeBounds: { minWidth: 320, minHeight: 220 },
    onHoverDetail,
    onLeaveDetail,
    headerActions: (
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
    ),
  }),
  mapContentProps: ({
    loot,
    equipment,
    onTakeItem,
    onHoverItem,
    onLeaveItem,
  }) => ({
    loot,
    equipment,
    onTakeItem,
    onHoverItem,
    onLeaveItem,
  }),
});
