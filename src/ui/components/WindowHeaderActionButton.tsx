import type { ReactNode } from 'react';
import { useUiAudio } from '../../app/audio/UiAudioContext';
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
}: WindowHeaderActionButtonProps) => {
  const audio = useUiAudio();

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-pressed={ariaPressed}
      data-ui-audio-click="off"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        audio.click();
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
};
