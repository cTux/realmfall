import { DEFAULT_LOG_FILTERS } from '../../../constants';
import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const LogWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../../ui/components/LogWindow'))['LogWindow']>[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/LogWindow').then(
      (module) => module.LogWindow,
    ),
  ),
);

export const logDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'log',
  render: ({ actions, detailTooltipHandlers, managedWindowProps, views }) => (
    <LogWindow
      {...managedWindowProps.log}
      filters={views.logs.filters}
      defaultFilters={DEFAULT_LOG_FILTERS}
      showFilterMenu={views.logs.showFilterMenu}
      onToggleMenu={actions.logs.onToggleFilterMenu}
      onToggleFilter={actions.logs.onToggleLogFilter}
      logs={views.logs.filtered}
      {...detailTooltipHandlers}
    />
  ),
};
