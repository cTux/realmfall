import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.css';

const SkillsWindowContent = lazy(() =>
  import('./SkillsWindowContent').then((module) => ({
    default: module.SkillsWindowContent,
  })),
);

export const SkillsWindow = memo(function SkillsWindow({
  position,
  onMove,
  visible,
  onClose,
  skills,
}: SkillsWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(WINDOW_LABELS.skills, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <SkillsWindowContent skills={skills} />
      </Suspense>
    </DraggableWindow>
  );
});
