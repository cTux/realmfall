import { LOG_KINDS, type Item, type LogKind } from '../game/stateTypes';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  WINDOW_VISIBILITY_KEYS,
  createLogFilters,
  createWindowVisibilityState,
  type WindowPosition,
  type WindowPositions,
  type WindowVisibilityState,
} from './constants';
import { normalizeItem } from './normalizeItems';
import { isFiniteNumber, isRecord } from './normalizeShared';

export interface NormalizedPersistedUiState {
  actionBarSlots: Array<{ item: Item } | null>;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
}

export function normalizePersistedUiState(
  persistedUi: unknown,
): NormalizedPersistedUiState {
  if (!isRecord(persistedUi)) {
    return {
      actionBarSlots: Array.from({ length: 9 }, () => null),
      logFilters: DEFAULT_LOG_FILTERS,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      windows: DEFAULT_WINDOWS,
    };
  }

  return {
    actionBarSlots: normalizeActionBarSlots(persistedUi.actionBarSlots),
    logFilters: normalizeLogFilters(persistedUi.logFilters),
    windowShown: normalizeWindowVisibility(persistedUi.windowShown),
    windows: normalizeWindowPositions(persistedUi.windows),
  };
}

function normalizeActionBarSlots(slots: unknown) {
  if (!Array.isArray(slots)) {
    return Array.from({ length: 9 }, () => null);
  }

  return Array.from({ length: 9 }, (_, index) => {
    const slot = slots[index];
    if (!isRecord(slot)) {
      return null;
    }

    const item = normalizeItem(slot.item);
    return item ? { item } : null;
  });
}

function normalizeLogFilters(filters: unknown): Record<LogKind, boolean> {
  if (!isRecord(filters)) {
    return DEFAULT_LOG_FILTERS;
  }

  const normalized = createLogFilters();

  for (const kind of LOG_KINDS) {
    normalized[kind] = filters[kind] === false ? false : true;
  }

  return normalized;
}

function normalizeWindowVisibility(value: unknown): WindowVisibilityState {
  if (!isRecord(value)) {
    return DEFAULT_WINDOW_VISIBILITY;
  }

  const normalized = createWindowVisibilityState();

  for (const key of WINDOW_VISIBILITY_KEYS) {
    normalized[key] = value[key] === true;
  }

  return normalized;
}

function normalizeWindowPositions(value: unknown): WindowPositions {
  if (!isRecord(value)) {
    return DEFAULT_WINDOWS;
  }

  return {
    hero: normalizeWindowPosition(value.hero, 'hero'),
    skills: normalizeWindowPosition(value.skills, 'skills'),
    recipes: normalizeWindowPosition(value.recipes, 'recipes'),
    hexInfo: normalizeWindowPosition(value.hexInfo, 'hexInfo'),
    equipment: normalizeWindowPosition(value.equipment, 'equipment'),
    inventory: normalizeWindowPosition(value.inventory, 'inventory'),
    loot: normalizeWindowPosition(value.loot, 'loot'),
    log: normalizeWindowPosition(value.log, 'log'),
    combat: normalizeWindowPosition(value.combat, 'combat'),
    settings: normalizeWindowPosition(value.settings, 'settings'),
  };
}

function normalizeWindowPosition(
  value: unknown,
  key: keyof WindowPositions,
): WindowPosition {
  const fallback = DEFAULT_WINDOWS[key];
  if (!isRecord(value)) {
    return { ...fallback };
  }

  const width =
    isFiniteNumber(value.width) && value.width > 0
      ? value.width
      : fallback.width;
  const height =
    isFiniteNumber(value.height) && value.height > 0
      ? value.height
      : fallback.height;

  return {
    x: isFiniteNumber(value.x) ? value.x : fallback.x,
    y: isFiniteNumber(value.y) ? value.y : fallback.y,
    ...(width == null ? {} : { width }),
    ...(height == null ? {} : { height }),
  };
}
