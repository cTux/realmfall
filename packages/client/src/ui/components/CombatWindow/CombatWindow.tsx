import { t } from '../../../i18n';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import inventoryStyles from '../InventoryWindow/styles.module.scss';
import type { CombatWindowProps } from './types';
import styles from './styles.module.scss';

type CombatWindowContentProps = Parameters<
  (typeof import('./CombatWindowContent'))['CombatWindowContent']
>[0];

export const CombatWindow = createDeferredWindowComponent<
  CombatWindowProps,
  CombatWindowContentProps
>({
  displayName: 'CombatWindow',
  memoize: false,
  loadContent: () =>
    import('./CombatWindowContent').then((module) => ({
      default: module.CombatWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    combat,
    onStart,
    onHoverDetail,
    onLeaveDetail,
    onHoverHeaderAction,
  }) => ({
    title: t('ui.window.combat.plain'),
    headerActions: !combat.started ? (
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
    ) : null,
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    onHoverDetail,
    onLeaveDetail,
  }),
  mapContentProps: ({
    combat,
    playerParty,
    enemies,
    worldTimeMs,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    combat,
    playerParty,
    enemies,
    worldTimeMs,
    onHoverDetail,
    onLeaveDetail,
  }),
});
