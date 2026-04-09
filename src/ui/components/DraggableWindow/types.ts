import type { ReactNode } from 'react';
import type { WindowPosition } from '../../../app/constants';

export interface DraggableWindowProps {
  title: string;
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
  className?: string;
}
