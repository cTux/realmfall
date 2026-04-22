import { useEffect, useEffectEvent } from 'react';
import type { WindowVisibilityState } from '../constants';
import {
  isEditableTarget,
  isFocusableControlTarget,
} from './utils/isEditableTarget';
import { WINDOW_HOTKEYS } from './utils/windowHotkeys';

interface UseKeyboardShortcutsOptions {
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  canHealTerritoryNpc: boolean;
  canSetHomeAction: boolean;
  canTerritoryAction: boolean;
  combatDeathAvailable: boolean;
  combatStartAvailable: boolean;
  hexContentWindowShown: boolean;
  interactLabel: string | null;
  lootSnapshotLength: number;
  onForfeitCombat: () => void;
  onStartCombat: () => void;
  onInteract: () => void;
  onHealTerritoryNpc: () => void;
  onSetHome: () => void;
  onTerritoryAction: () => void;
  onTakeAllLoot: () => void;
  onCloseAllWindows: () => void;
  onCloseAllWindowsSound?: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onTogglePause: () => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  onUseActionBarSlot: (slotIndex: number) => void;
  onWindowToggleSound?: (opened: boolean) => void;
  windowShown: WindowVisibilityState;
}

export function useKeyboardShortcuts({
  canBulkProspectEquipment,
  canBulkSellEquipment,
  canHealTerritoryNpc,
  canSetHomeAction,
  canTerritoryAction,
  combatDeathAvailable,
  combatStartAvailable,
  hexContentWindowShown,
  interactLabel,
  lootSnapshotLength,
  onForfeitCombat,
  onStartCombat,
  onInteract,
  onHealTerritoryNpc,
  onSetHome,
  onTerritoryAction,
  onTakeAllLoot,
  onCloseAllWindows,
  onCloseAllWindowsSound,
  onProspect,
  onSellAll,
  onTogglePause,
  onToggleDockWindow,
  onUseActionBarSlot,
  onWindowToggleSound,
  windowShown,
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

    if (event.code === 'Space') {
      if (isFocusableControlTarget(event.target)) {
        return;
      }
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      onTogglePause();
      return;
    }

    const lowerKey = event.key.toLowerCase();
    if (lowerKey === 'escape') {
      event.preventDefault();
      onCloseAllWindowsSound?.();
      onCloseAllWindows();
      return;
    }

    if (lowerKey === 'e' && hexContentWindowShown && lootSnapshotLength > 0) {
      event.preventDefault();
      onTakeAllLoot();
      return;
    }

    if (lowerKey === 'q' && combatStartAvailable) {
      event.preventDefault();
      onStartCombat();
      return;
    }

    if (lowerKey === 'q' && hexContentWindowShown && canHealTerritoryNpc) {
      event.preventDefault();
      onHealTerritoryNpc();
      return;
    }

    if (lowerKey === 'q' && interactLabel) {
      event.preventDefault();
      onInteract();
      return;
    }

    if (lowerKey === 'q' && hexContentWindowShown && canBulkProspectEquipment) {
      event.preventDefault();
      onProspect();
      return;
    }

    if (lowerKey === 'q' && hexContentWindowShown && canBulkSellEquipment) {
      event.preventDefault();
      onSellAll();
      return;
    }

    if (lowerKey === 't' && combatDeathAvailable) {
      event.preventDefault();
      onForfeitCombat();
      return;
    }

    if (lowerKey === 'a' && hexContentWindowShown && canTerritoryAction) {
      event.preventDefault();
      onTerritoryAction();
      return;
    }

    if (lowerKey === 'o' && hexContentWindowShown && canSetHomeAction) {
      event.preventDefault();
      onSetHome();
      return;
    }

    if (/^[1-9]$/.test(lowerKey)) {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      onUseActionBarSlot(Number(lowerKey) - 1);
      return;
    }

    const key = WINDOW_HOTKEYS[lowerKey];
    if (!key) return;

    event.preventDefault();
    onWindowToggleSound?.(!windowShown[key]);
    onToggleDockWindow(key);
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
