import { useMemo } from 'react';
import type { AppWindowsActions } from '../AppWindows.actionTypes';
import type { DetailTooltipHandlers } from './appDeferredWindows/types';

type DetailTooltipActions = Pick<
  AppWindowsActions['tooltip'],
  'onShowTooltip' | 'onCloseTooltip'
>;

export function useDetailTooltipHandlers({
  onShowTooltip,
  onCloseTooltip,
}: DetailTooltipActions): DetailTooltipHandlers {
  return useMemo(
    () => ({
      onHoverDetail: onShowTooltip,
      onLeaveDetail: onCloseTooltip,
    }),
    [onCloseTooltip, onShowTooltip],
  );
}
