import { t } from '../i18n';
import { ItemId } from './content/ids';
import { hexKey, hexNeighbors, type HexCoord } from './hex';
import { isPassable } from './shared';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import {
  getCurrentTile,
  getPlayerClaimedTiles,
  getTileAt,
} from './stateWorldQueries';
import type { GameState, Item } from './types';
import { isPlayerClaim } from './territories';

type ClaimStatusState = Pick<
  GameState,
  'bloodMoonActive' | 'enemies' | 'homeHex' | 'seed' | 'tiles'
> & {
  player: Pick<GameState['player'], 'coord' | 'inventory'>;
};

function getConnectedPlayerClaimCount(
  claimedKeys: ReadonlySet<string>,
  startKey: string,
) {
  const visited = new Set<string>();
  const frontier = [startKey];

  while (frontier.length > 0) {
    const key = frontier.pop();
    if (!key || visited.has(key)) continue;
    visited.add(key);

    const [qString, rString] = key.split(',');
    const coord = { q: Number(qString), r: Number(rString) };
    for (const neighbor of hexNeighbors(coord)) {
      const neighborKey = hexKey(neighbor);
      if (claimedKeys.has(neighborKey) && !visited.has(neighborKey)) {
        frontier.push(neighborKey);
      }
    }
  }

  return visited.size;
}

function canUnclaimWithoutSplittingTerritory(
  claimedTiles: ReturnType<typeof getPlayerClaimedTiles>,
  coord: HexCoord,
) {
  const remainingClaimKeys = new Set(
    claimedTiles
      .map((tile) => hexKey(tile.coord))
      .filter((key) => key !== hexKey(coord)),
  );
  if (remainingClaimKeys.size <= 1) return true;

  const [firstRemainingKey] = remainingClaimKeys;
  return (
    getConnectedPlayerClaimCount(remainingClaimKeys, firstRemainingKey) ===
    remainingClaimKeys.size
  );
}

export function getCurrentHexClaimStatus(state: ClaimStatusState) {
  const tile = getCurrentTile(state);
  const playerClaims = getPlayerClaimedTiles(state);
  if (tile.claim) {
    if (isPlayerClaim(tile.claim)) {
      return canUnclaimWithoutSplittingTerritory(playerClaims, tile.coord)
        ? {
            action: 'unclaim' as const,
            canClaim: true,
            reason: null,
          }
        : {
            action: 'none' as const,
            canClaim: false,
            reason: t('game.message.claim.status.mustStayConnected'),
          };
    }

    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.belongsTo', {
        ownerName: tile.claim.ownerName,
      }),
    };
  }

  if (!isPassable(tile.terrain)) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.passableOnly'),
    };
  }

  if (
    tile.structure ||
    tile.enemyIds.length > 0 ||
    tile.items.length > 0 ||
    isWorldBossFootprintOccupied(state, tile.coord)
  ) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.emptyOnly'),
    };
  }

  if (
    playerClaims.length > 0 &&
    !hexNeighbors(tile.coord).some((neighbor) => {
      const neighborTile = state.tiles[hexKey(neighbor)];
      return isPlayerClaim(neighborTile?.claim);
    })
  ) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.mustConnect'),
    };
  }

  if (
    hexNeighbors(tile.coord).some((neighbor) => {
      const neighborTile = getTileAt(state, neighbor);
      return neighborTile.claim && !isPlayerClaim(neighborTile.claim);
    })
  ) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.nearOtherTerritory'),
    };
  }

  if (playerClaims.length >= 5) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.maxClaims'),
    };
  }

  const clothCount = countInventoryResource(
    state.player.inventory,
    ItemId.Cloth,
  );
  const stickCount = countInventoryResource(
    state.player.inventory,
    ItemId.Sticks,
  );
  if (clothCount < 1 || stickCount < 1) {
    return {
      action: 'none' as const,
      canClaim: false,
      reason: t('game.message.claim.status.needsBannerMaterials'),
    };
  }

  return { action: 'claim' as const, canClaim: true, reason: null };
}

function countInventoryResource(
  inventory: Item[],
  itemKey: ItemId.Cloth | ItemId.Sticks,
) {
  return inventory.reduce(
    (total, item) => (item.itemKey === itemKey ? total + item.quantity : total),
    0,
  );
}
