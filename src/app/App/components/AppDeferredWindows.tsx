import { memo, Suspense, useMemo } from 'react';
import { WindowLoadingState } from '../../../ui/components/WindowLoadingState';
import {
  getAppDeferredWindowEntries,
  type AppDeferredWindowsProps,
} from './appDeferredWindowRegistry';

export const AppDeferredWindows = memo(function AppDeferredWindows({
  appReady,
  actions,
  combatPlayerParty,
  hexInfoView,
  managedWindowProps,
  mountedWindows,
  recipeWindowStructure,
  views,
}: AppDeferredWindowsProps) {
  const fallback = appReady ? <WindowLoadingState /> : null;
  const detailTooltipHandlers = useMemo(
    () => ({
      onHoverDetail: actions.tooltip.onShowTooltip,
      onLeaveDetail: actions.tooltip.onCloseTooltip,
    }),
    [actions.tooltip.onCloseTooltip, actions.tooltip.onShowTooltip],
  );
  const windowEntries = useMemo(
    () =>
      getAppDeferredWindowEntries({
        actions,
        appReady,
        combatPlayerParty,
        detailTooltipHandlers,
        hexInfoView,
        managedWindowProps,
        mountedWindows,
        recipeWindowStructure,
        views,
      }),
    [
      actions,
      appReady,
      combatPlayerParty,
      detailTooltipHandlers,
      hexInfoView,
      managedWindowProps,
      mountedWindows,
      recipeWindowStructure,
      views,
    ],
  );

  return (
    <>
      {windowEntries.map(({ key, element }) => (
        <Suspense key={key} fallback={fallback}>
          {element}
        </Suspense>
      ))}
    </>
  );
});
