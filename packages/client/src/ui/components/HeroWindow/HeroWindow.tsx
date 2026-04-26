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
    hero,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.hero.plain,
    hotkeyLabel: WINDOW_LABELS.hero,
    titleSuffix: (
      <>
        {' '}
        {'- Lv '}
        {hero.level}
        {hero.masteryLevel > 0 ? ` (${hero.masteryLevel})` : ''}
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
    hero,
    hunger,
    thirst,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    hero,
    hunger,
    thirst,
    onHoverDetail,
    onLeaveDetail,
  }),
});
