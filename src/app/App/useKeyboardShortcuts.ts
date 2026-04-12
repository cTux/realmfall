import { useEffect } from 'react';
import type { WindowVisibilityState } from '../constants';
import { isEditableTarget, WINDOW_HOTKEYS } from './appHelpers';

interface UseKeyboardShortcutsOptions {
  interactLabel: string | null;
  lootSnapshotLength: number;
  lootWindowVisible: boolean;
  renderLootWindow: boolean;
  onInteract: () => void;
  onTakeAllLoot: () => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  windowShownLoot: boolean;
}

export function useKeyboardShortcuts({
  interactLabel,
  lootSnapshotLength,
  lootWindowVisible,
  renderLootWindow,
  onInteract,
  onTakeAllLoot,
  onToggleDockWindow,
  windowShownLoot,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
      if (
        lowerKey === 'e' &&
        renderLootWindow &&
        windowShownLoot &&
        lootWindowVisible &&
        lootSnapshotLength > 0
      ) {
        event.preventDefault();
        onTakeAllLoot();
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
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    interactLabel,
    lootSnapshotLength,
    lootWindowVisible,
    onInteract,
    onTakeAllLoot,
    onToggleDockWindow,
    renderLootWindow,
    windowShownLoot,
  ]);
}
