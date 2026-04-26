import { memo, Suspense, useMemo } from 'react';
import { WindowLoadingState } from '../../../ui/components/WindowLoadingState';
import {
  getAppDeferredWindowEntries,
  type AppDeferredWindowsProps,
} from './appDeferredWindowRegistry';
import { useDetailTooltipHandlers } from './useDetailTooltipHandlers';

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
  const detailTooltipHandlers = useDetailTooltipHandlers(actions.tooltip);
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
