import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import labelStyles from '../windowLabels.module.scss';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.scss';

const SkillsWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./SkillsWindowContent').then((module) => ({
      default: module.SkillsWindowContent,
    })),
  ),
);

export const SkillsWindow = memo(function SkillsWindow({
  position,
  onMove,
  visible,
  onClose,
  skills,
  onHoverDetail,
  onLeaveDetail,
}: SkillsWindowProps) {
  return (
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.skills}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <SkillsWindowContent
          skills={skills}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </DraggableWindow>
  );
});
