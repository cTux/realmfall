import type { WindowPosition } from '../../../app/constants';

export interface LegendWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
}
