import type { HexCoord, TileClaim } from '../../../game/stateTypes';

interface CanSetHomeActionArgs {
  currentTileClaim: TileClaim | null | undefined;
  homeHex: HexCoord;
  playerCoord: HexCoord;
}

export function canSetHomeAction({
  currentTileClaim,
  homeHex,
  playerCoord,
}: CanSetHomeActionArgs) {
  const playerOwnsCurrentTile =
    currentTileClaim == null || currentTileClaim.ownerType === 'player';
  const playerIsAwayFromHome =
    homeHex.q !== playerCoord.q || homeHex.r !== playerCoord.r;

  return playerOwnsCurrentTile && playerIsAwayFromHome;
}
