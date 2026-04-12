import type { ReactNode } from 'react';
import type { WindowPosition } from '../../../app/constants';

export interface DraggableWindowProps {
  title: ReactNode;
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
  titleClassName?: string;
  headerActions?: ReactNode;
  className?: string;
  visible?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
}
