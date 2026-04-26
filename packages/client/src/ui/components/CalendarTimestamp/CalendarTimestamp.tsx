import type { MouseEvent as ReactMouseEvent } from 'react';
import type { TooltipLine } from '../../tooltips';
import {
  formatWorldCalendarDateTime,
  formatWorldTime,
  getWorldTimeMinutesFromTimestamp,
} from '../../world/timeOfDay';

interface CalendarTimestampProps {
  timestampMs: number;
  display: 'full' | 'time';
  className?: string;
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}

export function CalendarTimestamp({
  timestampMs,
  display,
  className,
  onHoverDetail,
  onLeaveDetail,
}: CalendarTimestampProps) {
  const fullLabel = formatWorldCalendarDateTime(timestampMs);
  const timeLabel = formatWorldTime(
    getWorldTimeMinutesFromTimestamp(timestampMs),
  );

  return (
    <span
      className={className}
      onMouseEnter={(event) =>
        onHoverDetail?.(event, fullLabel, [], 'rgba(125, 211, 252, 0.9)')
      }
      onMouseLeave={onLeaveDetail}
    >
      {display === 'full' ? fullLabel : timeLabel}
    </span>
  );
}
