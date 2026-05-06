import { useLayoutEffect, useRef } from 'react';
import { isEnemyInitiatedCombat } from '../../../game/stateCombatEngagement';
import type { GameState, HexCoord } from '../../../game/stateTypes';

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

  useLayoutEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!combatAutoOpenReadyRef.current) {
      combatAutoOpenReadyRef.current = true;
      previousCombatRef.current = combat;
      previousPlayerCoordRef.current = playerCoord;
      return;
    }

    const hadCombat = Boolean(previousCombatRef.current);
    const hasCombat = Boolean(combat);
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

    previousCombatRef.current = combat;
    previousPlayerCoordRef.current = playerCoord;
  }, [
    combat,
    hydrated,
    playerCoord,
    setWindowVisibility,
    suppressHexInfoAutoOpen,
    windowShownHexInfo,
  ]);
}
