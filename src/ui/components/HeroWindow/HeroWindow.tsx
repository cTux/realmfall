import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { HeroWindowProps } from './types';

const HeroWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./HeroWindowContent').then((module) => ({
      default: module.HeroWindowContent,
    })),
  ),
);

export const HeroWindow = memo(function HeroWindow({
  position,
  onMove,
  visible,
  onClose,
  stats,
  hunger,
  thirst,
  worldTimeMs,
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
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
