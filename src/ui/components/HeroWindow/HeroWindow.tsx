import { memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { HeroWindowProps } from './types';

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
    <WindowShell
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
      visible={visible}
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <HeroWindowContent
          stats={stats}
          hunger={hunger}
          thirst={thirst}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
