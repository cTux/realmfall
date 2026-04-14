import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import labelStyles from '../windowLabels.module.scss';
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
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.hero}
          hotkeyClassName={labelStyles.hotkey}
          suffix={
            <>
              {' '}
              {' · Lv '}
              {stats.level}
              {stats.masteryLevel > 0 ? ` (${stats.masteryLevel})` : ''}
            </>
          }
        />
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
    </DraggableWindow>
  );
});
