import type { SkillName } from '@realmfall/core/game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface SkillsWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  showTooltipTags?: boolean;
  skills: Record<SkillName, { level: number; xp: number }>;
}
