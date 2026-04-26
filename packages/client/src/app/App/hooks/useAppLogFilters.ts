import { useCallback, useState } from 'react';
import type { LogKind } from '../../../game/stateTypes';
import { DEFAULT_LOG_FILTERS } from '../../constants';

export function useAppLogFilters() {
  const [logFilters, setLogFilters] =
    useState<Record<LogKind, boolean>>(DEFAULT_LOG_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const toggleFilterMenu = useCallback(() => {
    setShowFilterMenu((current) => !current);
  }, []);

  const toggleLogFilter = useCallback((kind: LogKind) => {
    setLogFilters((current) => ({ ...current, [kind]: !current[kind] }));
  }, []);

  return {
    logFilters,
    setLogFilters,
    showFilterMenu,
    toggleFilterMenu,
    toggleLogFilter,
  };
}
