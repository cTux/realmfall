import type { WindowPosition } from '../../../app/constants';
import type { LogEntry, LogKind } from '../../../game/state';

export interface LogWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  filters: Record<LogKind, boolean>;
  defaultFilters: Record<LogKind, boolean>;
  showFilterMenu: boolean;
  onToggleMenu: () => void;
  onToggleFilter: (kind: LogKind) => void;
  logs: LogEntry[];
}
