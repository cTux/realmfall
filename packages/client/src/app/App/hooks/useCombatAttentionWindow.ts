import { useEffect, useLayoutEffect, useRef } from 'react';
import { isEnemyInitiatedCombat } from '@realmfall/core/game/stateCombatEngagement';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';

export function useCombatAttentionWindow({
  combat,
  hydrated,
  playerCoord,
  suppressHexInfoAutoOpen,
  setWindowVisibility,
  windowShownHexInfo,
}: {
  combat: GameState['combat'];
  hydrated: boolean;
  playerCoord: HexCoord;
  suppressHexInfoAutoOpen: boolean;
  setWindowVisibility: (windowKey: 'hexInfo', visible: boolean) => void;
  windowShownHexInfo: boolean;
}) {
  const combatAutoOpenReadyRef = useRef(false);
  const previousCombatRef = useRef<GameState['combat']>(combat);
  const previousPlayerCoordRef = useRef(playerCoord);
  const previousWindowShownHexInfoRef = useRef(windowShownHexInfo);
  const reopenAfterCombatEndRef = useRef(false);

  useLayoutEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!combatAutoOpenReadyRef.current) {
      combatAutoOpenReadyRef.current = true;
      previousCombatRef.current = combat;
      previousPlayerCoordRef.current = playerCoord;
      previousWindowShownHexInfoRef.current = windowShownHexInfo;
      return;
    }

    const hadCombat = Boolean(previousCombatRef.current);
    const hasCombat = Boolean(combat);
    const hadHexInfoWindow = previousWindowShownHexInfoRef.current;
    const playerMoved =
      previousPlayerCoordRef.current.q !== playerCoord.q ||
      previousPlayerCoordRef.current.r !== playerCoord.r;

    if (
      hasCombat &&
      !hadCombat &&
      playerMoved &&
      !isEnemyInitiatedCombat(combat) &&
      !windowShownHexInfo &&
      !suppressHexInfoAutoOpen
    ) {
      setWindowVisibility('hexInfo', true);
    }
    if (!hasCombat && hadCombat && (hadHexInfoWindow || windowShownHexInfo)) {
      reopenAfterCombatEndRef.current = true;
    }

    previousCombatRef.current = combat;
    previousPlayerCoordRef.current = playerCoord;
    previousWindowShownHexInfoRef.current = windowShownHexInfo;
  }, [
    combat,
    hydrated,
    playerCoord,
    setWindowVisibility,
    suppressHexInfoAutoOpen,
    windowShownHexInfo,
  ]);

  useEffect(() => {
    if (!hydrated || combat != null || !reopenAfterCombatEndRef.current) {
      return;
    }

    reopenAfterCombatEndRef.current = false;
    setWindowVisibility('hexInfo', true);
  }, [combat, hydrated, setWindowVisibility]);
}
