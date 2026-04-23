import type { WindowPosition } from '../../../app/constants';
import type { SkillName } from '../../../game/stateTypes';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface SkillsWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  skills: Record<SkillName, { level: number; xp: number }>;
}
