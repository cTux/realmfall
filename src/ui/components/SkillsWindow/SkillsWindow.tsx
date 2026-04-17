import { memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.scss';

const SkillsWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./SkillsWindowContent'))['SkillsWindowContent']>[0]
>(() =>
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
  onHoverDetail,
  onLeaveDetail,
}: SkillsWindowProps) {
  return (
    <WindowShell
      title={WINDOW_LABELS.skills.plain}
      hotkeyLabel={WINDOW_LABELS.skills}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 300, minHeight: 240 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <SkillsWindowContent
          skills={skills}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
