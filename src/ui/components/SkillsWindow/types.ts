import type { WindowPosition } from '../../../app/constants';
import type { SkillName } from '../../../game/state';

export interface SkillsWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  skills: Record<SkillName, { level: number; xp: number }>;
}
