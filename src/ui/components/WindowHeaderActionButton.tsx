import type { ReactNode } from 'react';
import type { TooltipLine } from '../tooltips';
import type { WindowDetailTooltipHandlers } from './windowTooltipTypes';

interface WindowHeaderActionButtonProps extends WindowDetailTooltipHandlers {
  children: ReactNode;
  className: string;
  disabled?: boolean;
  ariaPressed?: boolean;
  tooltipTitle: string;
  tooltipLines: TooltipLine[];
  tooltipBorderColor?: string;
  onClick: () => void;
}

export const WindowHeaderActionButton = ({
  children,
  className,
  disabled,
  ariaPressed,
  tooltipTitle,
  tooltipLines,
  tooltipBorderColor,
  onClick,
  onHoverDetail,
  onLeaveDetail,
}: WindowHeaderActionButtonProps) => (
  <button
    type="button"
    className={className}
    disabled={disabled}
    aria-pressed={ariaPressed}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    onMouseEnter={(event) =>
      onHoverDetail?.(event, tooltipTitle, tooltipLines, tooltipBorderColor)
    }
    onMouseLeave={onLeaveDetail}
  >
    {children}
  </button>
);
