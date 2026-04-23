import type { SkillName } from '../../../game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface SkillsWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  skills: Record<SkillName, { level: number; xp: number }>;
}
