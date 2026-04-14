import type { WindowPosition } from '../../../app/constants';
import type { LogEntry, LogKind } from '../../../game/state';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface LogWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  filters: Record<LogKind, boolean>;
  defaultFilters: Record<LogKind, boolean>;
  showFilterMenu: boolean;
  onToggleMenu: () => void;
  onToggleFilter: (kind: LogKind) => void;
  logs: LogEntry[];
}
