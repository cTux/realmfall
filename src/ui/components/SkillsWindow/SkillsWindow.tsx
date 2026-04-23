import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { SkillsWindowProps } from './types';
import styles from './styles.module.scss';

type SkillsWindowContentProps = Parameters<
  (typeof import('./SkillsWindowContent'))['SkillsWindowContent']
>[0];

export const SkillsWindow = createDeferredWindowComponent<
  SkillsWindowProps,
  SkillsWindowContentProps
>({
  displayName: 'SkillsWindow',
  loadContent: () =>
    import('./SkillsWindowContent').then((module) => ({
      default: module.SkillsWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.skills.plain,
    hotkeyLabel: WINDOW_LABELS.skills,
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    resizeBounds: { minWidth: 300, minHeight: 240 },
    onHoverDetail,
    onLeaveDetail,
  }),
  mapContentProps: ({ skills, onHoverDetail, onLeaveDetail }) => ({
    skills,
    onHoverDetail,
    onLeaveDetail,
  }),
});
