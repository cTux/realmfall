import type { WindowPosition } from '../../../app/constants';

export interface LegendWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}
