import { memo, Suspense } from 'react';
import { WindowLoadingState } from '../../../ui/components/WindowLoadingState';
import {
  getAppDeferredWindowEntries,
  type AppDeferredWindowsProps,
} from './appDeferredWindowRegistry';

export const AppDeferredWindows = memo(function AppDeferredWindows({
  appReady,
  ...windowContext
}: AppDeferredWindowsProps) {
  const fallback = appReady ? <WindowLoadingState /> : null;
  const windowEntries = getAppDeferredWindowEntries({
    appReady,
    ...windowContext,
  });

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
