import { t } from '../i18n';
import { WORLD_REVEAL_RADIUS } from './config';
import { ItemId, type ItemKey } from './content/ids';
import { itemName, structureTitle } from './content/i18n';
import { getActiveWorld, getSurfaceWorld } from './dungeons/worldState';
import { hexesInRange, hexKey } from './hex';
import { isPlayerClaim } from './territories';
import { getCurrentTile, getResolvedCurrentTile } from './stateWorldQueries';
import type { GameState, Tile } from './types';

const WATCHTOWER_REVEAL_BONUS = 2;
const WATCHTOWER_INFLUENCE_RADIUS = 1;

const OUTPOST_BUILDABLES = [
  {
    costs: [
      { itemKey: ItemId.Logs, quantity: 3 },
      { itemKey: ItemId.Stone, quantity: 2 },
      { itemKey: ItemId.Cloth, quantity: 1 },
    ],
    type: 'watchtower',
  },
  {
    costs: [
      { itemKey: ItemId.Stone, quantity: 4 },
      { itemKey: ItemId.Cloth, quantity: 2 },
      { itemKey: ItemId.ArcaneDust, quantity: 1 },
    ],
    type: 'mana-anchor',
  },
] as const;

export type OutpostBuildableType = (typeof OUTPOST_BUILDABLES)[number]['type'];

export interface OutpostBuildCost {
  itemKey: ItemKey;
  quantity: number;
}

export interface OutpostBuildOptionStatus {
  canBuild: boolean;
  costs: readonly OutpostBuildCost[];
  reason: string | null;
  type: OutpostBuildableType;
}

export interface OutpostBuildStatus {
  canBuild: boolean;
  buildables: OutpostBuildOptionStatus[];
  reason: string | null;
}

type ResolvedOutpostBuildState = Pick<GameState, 'combat' | 'tiles'> &
  Partial<Pick<GameState, 'activeWorldId' | 'worlds'>> & {
    player: Pick<GameState['player'], 'coord' | 'inventory'>;
  };

type OutpostBuildState = ResolvedOutpostBuildState & Pick<GameState, 'seed'>;

type WatchtowerRevealState = Pick<GameState, 'tiles'> &
  Partial<Pick<GameState, 'activeWorldId' | 'worlds'>> & {
    player: Pick<GameState['player'], 'coord'>;
  };

type PreferredReturnHexState = Pick<
  GameState,
  'homeHex' | 'manaAnchorHex' | 'surfaceWorldId' | 'worlds'
>;

export function getCurrentHexOutpostBuildStatus(
  state: OutpostBuildState,
): OutpostBuildStatus {
  return getOutpostBuildStatusCore(state, getCurrentTile(state));
}

export function getResolvedCurrentHexOutpostBuildStatus(
  state: ResolvedOutpostBuildState,
): OutpostBuildStatus {
  const tile = getResolvedCurrentTile(state);
  if (!tile) {
    return unavailableOutpostBuildStatus(t('game.message.travel.unknownHex'));
  }

  return getOutpostBuildStatusCore(state, tile);
}

export function getCurrentWorldRevealRadius(state: WatchtowerRevealState) {
  const currentWorldKind = getActiveWorld(state)?.kind ?? 'surface';
  if (currentWorldKind !== 'surface') {
    return WORLD_REVEAL_RADIUS;
  }

  const insideWatchtowerRange = hexesInRange(
    state.player.coord,
    WATCHTOWER_INFLUENCE_RADIUS,
  ).some((coord) => {
    const tile = state.tiles[hexKey(coord)];
    return tile?.structure === 'watchtower' && isPlayerClaim(tile.claim);
  });

  return insideWatchtowerRange
    ? WORLD_REVEAL_RADIUS + WATCHTOWER_REVEAL_BONUS
    : WORLD_REVEAL_RADIUS;
}

export function isOutpostBuildableStructureType(
  structure: GameState['tiles'][string]['structure'],
): structure is OutpostBuildableType {
  return OUTPOST_BUILDABLES.some((buildable) => buildable.type === structure);
}

export function getPreferredReturnHex(state: PreferredReturnHexState) {
  return getBoundManaAnchorHex(state) ?? state.homeHex;
}

export function getBoundManaAnchorHex({
  manaAnchorHex,
  surfaceWorldId,
  worlds,
}: Pick<GameState, 'manaAnchorHex' | 'surfaceWorldId' | 'worlds'>) {
  if (!manaAnchorHex) {
    return null;
  }

  const surfaceTile =
    getSurfaceWorld({ worlds })?.tiles[hexKey(manaAnchorHex)] ??
    worlds[surfaceWorldId]?.tiles[hexKey(manaAnchorHex)];
  if (
    surfaceTile?.structure !== 'mana-anchor' ||
    !isPlayerClaim(surfaceTile.claim)
  ) {
    return null;
  }

  return manaAnchorHex;
}

function getOutpostBuildStatusCore(
  state: ResolvedOutpostBuildState,
  tile: Tile,
): OutpostBuildStatus {
  if (state.combat) {
    return unavailableOutpostBuildStatus(
      t('game.message.combat.finishCurrentBattleFirst'),
    );
  }

  const currentWorldKind = getActiveWorld(state)?.kind ?? 'surface';
  if (currentWorldKind !== 'surface') {
    return unavailableOutpostBuildStatus(
      t('game.message.outpost.status.surfaceOnly'),
    );
  }

  if (!isPlayerClaim(tile.claim)) {
    return unavailableOutpostBuildStatus(
      t('game.message.outpost.status.claimRequired'),
    );
  }

  if (tile.structure || tile.enemyIds.length > 0 || tile.items.length > 0) {
    return unavailableOutpostBuildStatus(
      t('game.message.outpost.status.emptyOnly'),
    );
  }

  const buildables = OUTPOST_BUILDABLES.map((buildable) => {
    const reason = getOutpostBuildRequirementReason(state, buildable);
    return {
      canBuild: reason == null,
      costs: buildable.costs,
      reason,
      type: buildable.type,
    } satisfies OutpostBuildOptionStatus;
  });
  const canBuild = buildables.some((buildable) => buildable.canBuild);

  return {
    canBuild,
    buildables,
    reason: canBuild ? null : (buildables[0]?.reason ?? null),
  };
}

function unavailableOutpostBuildStatus(reason: string): OutpostBuildStatus {
  return {
    canBuild: false,
    buildables: OUTPOST_BUILDABLES.map((buildable) => ({
      canBuild: false,
      costs: buildable.costs,
      reason,
      type: buildable.type,
    })),
    reason,
  };
}

function getOutpostBuildRequirementReason(
  state: ResolvedOutpostBuildState,
  buildable: (typeof OUTPOST_BUILDABLES)[number],
) {
  for (const cost of buildable.costs) {
    if (
      countInventoryItem(state.player.inventory, cost.itemKey) < cost.quantity
    ) {
      return t('game.message.outpost.status.needsMaterials', {
        materials: formatOutpostCostList(buildable.costs),
        structure: structureTitle(buildable.type),
      });
    }
  }

  return null;
}

function countInventoryItem(
  inventory: GameState['player']['inventory'],
  itemKey: ItemKey,
) {
  return inventory.reduce(
    (total, item) => total + (item.itemKey === itemKey ? item.quantity : 0),
    0,
  );
}

function formatOutpostCostList(costs: readonly OutpostBuildCost[]) {
  return costs
    .map((cost) => `${cost.quantity} ${itemName(cost.itemKey)}`)
    .join(', ');
}
