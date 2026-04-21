import { memo } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
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
    <DeferredWindowShell
      title={WINDOW_LABELS.skills.plain}
      hotkeyLabel={WINDOW_LABELS.skills}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 300, minHeight: 240 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      content={SkillsWindowContent}
      contentProps={{ skills, onHoverDetail, onLeaveDetail }}
    />
  );
});
