import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { HeroWindowProps } from './types';
import styles from './styles.module.scss';

type HeroWindowContentProps = Parameters<
  (typeof import('./HeroWindowContent'))['HeroWindowContent']
>[0];

export const HeroWindow = createDeferredWindowComponent<
  HeroWindowProps,
  HeroWindowContentProps
>({
  displayName: 'HeroWindow',
  loadContent: () =>
    import('./HeroWindowContent').then((module) => ({
      default: module.HeroWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    stats,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.hero.plain,
    hotkeyLabel: WINDOW_LABELS.hero,
    titleSuffix: (
      <>
        {' '}
        {'- Lv '}
        {stats.level}
        {stats.masteryLevel > 0 ? ` (${stats.masteryLevel})` : ''}
      </>
    ),
    position,
    onMove,
    className: styles.window,
    bodyClassName: styles.windowBody,
    visible,
    onClose,
    resizeBounds: { minWidth: 320, minHeight: 260 },
    onHoverDetail,
    onLeaveDetail,
  }),
  mapContentProps: ({
    stats,
    hunger,
    thirst,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    stats,
    hunger,
    thirst,
    onHoverDetail,
    onLeaveDetail,
  }),
});
