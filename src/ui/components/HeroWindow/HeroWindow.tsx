import { memo } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { HeroWindowProps } from './types';
import styles from './styles.module.scss';

const HeroWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./HeroWindowContent'))['HeroWindowContent']>[0]
>(() =>
  import('./HeroWindowContent').then((module) => ({
    default: module.HeroWindowContent,
  })),
);

export const HeroWindow = memo(function HeroWindow({
  position,
  onMove,
  visible,
  onClose,
  stats,
  hunger,
  thirst,
  onHoverDetail,
  onLeaveDetail,
}: HeroWindowProps) {
  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.hero.plain}
      hotkeyLabel={WINDOW_LABELS.hero}
      titleSuffix={
        <>
          {' '}
          {'- Lv '}
          {stats.level}
          {stats.masteryLevel > 0 ? ` (${stats.masteryLevel})` : ''}
        </>
      }
      position={position}
      onMove={onMove}
      className={styles.window}
      bodyClassName={styles.windowBody}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 320, minHeight: 260 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      content={HeroWindowContent}
      contentProps={{
        stats,
        hunger,
        thirst,
        onHoverDetail,
        onLeaveDetail,
      }}
    />
  );
});
