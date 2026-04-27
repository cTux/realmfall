import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

export interface WindowPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WindowTooltipLine {
  text?: string;
  label?: string;
  value?: string;
  icon?: string;
  iconTint?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?:
    | 'positive'
    | 'negative'
    | 'item'
    | 'reforged'
    | 'enchanted'
    | 'section'
    | 'subtle';
}

export interface WindowDetailTooltipHandlers {
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: WindowTooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}

export type WindowStackLayer = 'standard' | 'modal';

export interface WindowResizeBounds {
  minWidth: number;
  minHeight: number;
}

export interface WindowProps extends WindowDetailTooltipHandlers {
  title: ReactNode;
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
  headerActions?: ReactNode;
  className?: string;
  visible?: boolean;
  externalUnmount?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  resizeBounds?: WindowResizeBounds;
  closeButtonTooltip?: string;
  closeButtonTooltipColor?: string;
  closeButtonAriaLabel?: string;
  closeButtonContent?: ReactNode;
  stackLayer?: WindowStackLayer;
}
