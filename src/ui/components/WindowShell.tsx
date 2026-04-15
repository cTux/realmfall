import type { ReactNode } from 'react';
import type { WindowLabelDefinition } from '../windowLabels';
import { DraggableWindow } from './DraggableWindow';
import type { DraggableWindowProps } from './DraggableWindow/types';
import { WindowLabel } from './WindowLabel/WindowLabel';
import labelStyles from './windowLabels.module.scss';

interface WindowShellProps extends Omit<
  DraggableWindowProps,
  'title' | 'children'
> {
  children: ReactNode;
  hotkeyLabel?: WindowLabelDefinition;
  title: ReactNode;
  titleSuffix?: ReactNode;
}

export function WindowShell({
  children,
  hotkeyLabel,
  title,
  titleSuffix,
  ...windowProps
}: WindowShellProps) {
  return (
    <DraggableWindow
      {...windowProps}
      title={
        hotkeyLabel ? (
          <WindowLabel
            label={hotkeyLabel}
            hotkeyClassName={labelStyles.hotkey}
            suffix={titleSuffix}
          />
        ) : (
          title
        )
      }
    >
      {children}
    </DraggableWindow>
  );
}
