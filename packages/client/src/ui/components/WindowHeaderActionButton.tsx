import type { ReactNode } from 'react';
import { useUiAudio } from '../../app/audio/UiAudioContext';
import { Button } from '@realmfall/ui';
import { stripBracketHotkeyLabel } from '../hotkeyLabels';
import type { TooltipLine } from '../tooltips';
import { BracketHotkeyLabel } from './BracketHotkeyLabel';
import labelStyles from './windowLabels.module.scss';
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
  const renderedChildren =
    typeof children === 'string' ? (
      <BracketHotkeyLabel
        label={children}
        hotkeyClassName={labelStyles.hotkey}
      />
    ) : (
      children
    );
  const renderedTooltipTitle = stripBracketHotkeyLabel(tooltipTitle);

  return (
    <Button
      type="button"
      size="small"
      unstyled
      className={className}
      aria-disabled={disabled ? 'true' : undefined}
      aria-pressed={ariaPressed}
      tabIndex={disabled ? -1 : undefined}
      data-ui-audio-click="off"
      onPointerDown={(event) => {
        event.stopPropagation();
        if (disabled) {
          event.preventDefault();
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) {
          return;
        }
        audio.click();
        onClick();
      }}
      onMouseEnter={(event) =>
        onHoverDetail?.(
          event,
          renderedTooltipTitle,
          tooltipLines,
          tooltipBorderColor,
        )
      }
      onMouseLeave={onLeaveDetail}
    >
      {renderedChildren}
    </Button>
  );
};
