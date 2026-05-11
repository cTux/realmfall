import type { WindowPosition } from '../../app/constants';

export interface ManagedWindowShellProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
}
