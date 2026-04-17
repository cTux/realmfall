import { useEffect, useEffectEvent } from 'react';
import type { WindowVisibilityState } from '../constants';
import { isEditableTarget } from './utils/isEditableTarget';
import { WINDOW_HOTKEYS } from './utils/windowHotkeys';

interface UseKeyboardShortcutsOptions {
  combatStartAvailable: boolean;
  interactLabel: string | null;
  lootSnapshotLength: number;
  lootWindowVisible: boolean;
  onStartCombat: () => void;
  keepLootWindowMounted: boolean;
  onInteract: () => void;
  onTakeAllLoot: () => void;
  onCloseAllWindows: () => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  windowShownLoot: boolean;
}

export function useKeyboardShortcuts({
  combatStartAvailable,
  interactLabel,
  lootSnapshotLength,
  lootWindowVisible,
  onStartCombat,
  keepLootWindowMounted,
  onInteract,
  onTakeAllLoot,
  onCloseAllWindows,
  onToggleDockWindow,
  windowShownLoot,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    const lowerKey = event.key.toLowerCase();
    if (lowerKey === 'escape') {
      event.preventDefault();
      onCloseAllWindows();
      return;
    }

    if (
      lowerKey === 'e' &&
      keepLootWindowMounted &&
      windowShownLoot &&
      lootWindowVisible &&
      lootSnapshotLength > 0
    ) {
      event.preventDefault();
      onTakeAllLoot();
      return;
    }

    if (lowerKey === 'q' && combatStartAvailable) {
      event.preventDefault();
      onStartCombat();
      return;
    }

    if (lowerKey === 'q' && interactLabel) {
      event.preventDefault();
      onInteract();
      return;
    }

    const key = WINDOW_HOTKEYS[lowerKey];
    if (!key) return;

    event.preventDefault();
    onToggleDockWindow(key);
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
