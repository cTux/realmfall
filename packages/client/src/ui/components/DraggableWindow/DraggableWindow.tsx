import { ResizableWindow, Window } from '@realmfall/ui-react';
import type { DraggableWindowProps } from './types';

export function DraggableWindow(props: DraggableWindowProps) {
  if (props.resizeBounds) {
    return <ResizableWindow {...props} />;
  }

  return <Window {...props} />;
}
