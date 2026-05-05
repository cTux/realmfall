import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '../../../game/stateTypes';
import type { UiAudioController } from '../../audio/UiAudioContext';
import type { WindowVisibilityState } from '../../constants';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

interface UseAppShortcutBindingsArgs {
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  canHealTerritoryNpc: boolean;
  canSetHomeAction: boolean;
  canTerritoryAction: boolean;
  currentTileItemsLength: number;
  combat: GameState['combat'];
  hexContentWindowShown: boolean;
  interactLabel: string | null;
  onCloseAllWindows: () => void;
  onForfeitCombat: () => void;
  onHealTerritoryNpc: () => void;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onSetHome: () => void;
  onTakeAllLoot: () => void;
  onTerritoryAction: () => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  onUseActionBarSlot: (slotIndex: number) => void;
  setPaused: Dispatch<SetStateAction<boolean>>;
  uiAudio: UiAudioController;
  windowShown: WindowVisibilityState;
  worldTimeMs: number;
}

export function useAppShortcutBindings({
  canBulkProspectEquipment,
  canBulkSellEquipment,
  canHealTerritoryNpc,
  canSetHomeAction,
  canTerritoryAction,
  currentTileItemsLength,
  combat,
  hexContentWindowShown,
  interactLabel,
  onCloseAllWindows,
  onForfeitCombat,
  onHealTerritoryNpc,
  onInteract,
  onProspect,
  onSellAll,
  onSetHome,
  onTakeAllLoot,
  onTerritoryAction,
  onToggleDockWindow,
  onUseActionBarSlot,
  setPaused,
  uiAudio,
  windowShown,
  worldTimeMs,
}: UseAppShortcutBindingsArgs) {
  const handleTogglePause = useCallback(() => {
    setPaused((current) => !current);
  }, [setPaused]);

  const combatDeathAvailable = Boolean(
    combat?.started &&
    combat.startedAtMs != null &&
    worldTimeMs - combat.startedAtMs >= 60_000,
  );

  useKeyboardShortcuts({
    canBulkProspectEquipment,
    canBulkSellEquipment,
    canHealTerritoryNpc,
    canSetHomeAction,
    canTerritoryAction,
    combatDeathAvailable,
    hexContentWindowShown,
    interactLabel,
    lootSnapshotLength: currentTileItemsLength,
    onForfeitCombat,
    onInteract,
    onHealTerritoryNpc,
    onSetHome,
    onTerritoryAction,
    onTakeAllLoot,
    onCloseAllWindows,
    onProspect,
    onSellAll,
    onTogglePause: handleTogglePause,
    onToggleDockWindow,
    onWindowToggleSound: (opened) => {
      if (opened) {
        uiAudio.pop();
        return;
      }

      uiAudio.swoosh();
    },
    onCloseAllWindowsSound: uiAudio.swoosh,
    onUseActionBarSlot,
    windowShown,
  });
}
