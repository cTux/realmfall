import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { HeroWindowProps } from './types';

const HeroWindowContent = lazy(() =>
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
}: HeroWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(
        WINDOW_LABELS.hero,
        labelStyles.hotkey,
        <>
          {' '}
          {' · Lv '}
          {stats.level}
          {stats.masteryLevel > 0 ? ` (${stats.masteryLevel})` : ''}
        </>,
      )}
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <HeroWindowContent stats={stats} hunger={hunger} />
      </Suspense>
    </DraggableWindow>
  );
});
