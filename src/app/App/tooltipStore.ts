import { useSyncExternalStore } from 'react';
import type { TooltipState } from './types';

type TooltipListener = () => void;

let tooltipState: TooltipState | null = null;
const listeners = new Set<TooltipListener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getTooltipState() {
  return tooltipState;
}

export function setTooltipState(nextTooltip: TooltipState | null) {
  if (tooltipState === nextTooltip) {
    return;
  }

  tooltipState = nextTooltip;
  emitChange();
}

export function subscribeToTooltip(listener: TooltipListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTooltipState() {
  return useSyncExternalStore(
    subscribeToTooltip,
    getTooltipState,
    getTooltipState,
  );
}
