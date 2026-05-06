import { t } from '../../../i18n';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
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
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: t('ui.window.combat.plain'),
    headerActions: null,
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
