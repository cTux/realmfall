import { useCallback } from 'react';
import { DEFAULT_LOG_FILTERS } from '../../../app/constants';
import { uiActions } from '../../../app/store/uiSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectFilteredLogs,
  selectLogFilters,
  selectShowFilterMenu,
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { LogWindow } from './LogWindow';
import type { LogWindowProps } from './types';

export function LogWindowConnected() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectLogFilters);
  const logs = useAppSelector(selectFilteredLogs);
  const showFilterMenu = useAppSelector(selectShowFilterMenu);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);

  const handleMove = useCallback(
    (position: LogWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'log', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'log', shown: false }));
  }, [dispatch]);

  const handleToggleMenu = useCallback(() => {
    dispatch(uiActions.toggleFilterMenu());
  }, [dispatch]);

  const handleToggleFilter = useCallback<LogWindowProps['onToggleFilter']>(
    (kind) => {
      dispatch(uiActions.toggleLogFilter(kind));
    },
    [dispatch],
  );

  return (
    <LogWindow
      position={windows.log}
      onMove={handleMove}
      visible={windowShown.log}
      onClose={handleClose}
      filters={filters}
      defaultFilters={DEFAULT_LOG_FILTERS}
      showFilterMenu={showFilterMenu}
      onToggleMenu={handleToggleMenu}
      onToggleFilter={handleToggleFilter}
      logs={logs}
    />
  );
}
