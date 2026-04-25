import { hexKey } from '../../game/hex';
import { getVisibleTiles } from '../../game/stateSelectors';
import type { GameState, HexCoord } from '../../game/stateTypes';
import type { SceneCache } from './renderSceneCache';
import {
  getVisibleTileRenderInputs,
  type VisibleTileRenderInput,
} from './renderSceneRenderInputs';
import { getWorldIconTextureVersion } from './worldIcons';

export function getSceneRenderTokens(
  scene: SceneCache,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  const playerCoordKey = coordKey(state.player.coord);
  const homeHexKey = coordKey(state.homeHex);
  const renderInputsChanged =
    scene.derivedRenderVisibleTilesSource !== visibleTiles ||
    scene.derivedRenderEnemiesSource !== state.enemies ||
    scene.derivedRenderVisibleTileInputs === null;
  const visibleTileRenderInputs = renderInputsChanged
    ? getVisibleTileRenderInputs(state, visibleTiles)
    : scene.derivedRenderVisibleTileInputs!;
  const visibleEnemyToken = renderInputsChanged
    ? getVisibleEnemyToken(state, visibleTiles)
    : scene.derivedRenderVisibleEnemyToken;

  if (renderInputsChanged) {
    scene.derivedRenderEnemiesSource = state.enemies;
  }
  const iconTextureVersion = getWorldIconTextureVersion();

  if (
    scene.derivedRenderVisibleTilesSource !== visibleTiles ||
    visibleEnemyToken !== scene.derivedRenderVisibleEnemyToken ||
    scene.derivedRenderPlayerCoordKey !== playerCoordKey ||
    scene.derivedRenderHomeHexKey !== homeHexKey ||
    scene.derivedRenderBloodMoonActive !== state.bloodMoonActive ||
    scene.derivedRenderIconTextureVersion !== iconTextureVersion
  ) {
    scene.derivedRenderVisibleTilesSource = visibleTiles;
    scene.derivedRenderVisibleTileInputs = visibleTileRenderInputs;
    scene.derivedRenderVisibleEnemyToken = visibleEnemyToken;
    scene.derivedRenderPlayerCoordKey = playerCoordKey;
    scene.derivedRenderHomeHexKey = homeHexKey;
    scene.derivedRenderBloodMoonActive = state.bloodMoonActive;
    scene.derivedRenderIconTextureVersion = iconTextureVersion;
    scene.derivedStaticRenderToken = getStaticRenderToken(
      state,
      visibleTileRenderInputs,
    );
    scene.derivedInteractionRenderToken = getInteractionRenderToken(
      state,
      visibleTiles,
    );
  }

  const staticToken = scene.derivedStaticRenderToken ?? 0;
  const interactionBaseToken = scene.derivedInteractionRenderToken ?? 0;

  return {
    static: staticToken,
    visibleTileRenderInputs,
    interactionWithSelection: (
      selected: HexCoord,
      hoveredMove: HexCoord | null,
      hoveredSafePath: HexCoord[] | null,
    ) => {
      let token = interactionBaseToken;
      token = mixRenderToken(token, coordToken(selected));
      token = mixRenderToken(token, coordToken(hoveredMove));
      token = mixRenderToken(token, pathToken(hoveredSafePath));
      return token;
    },
  };
}

function getStaticRenderToken(
  state: GameState,
  visibleTileRenderInputs: VisibleTileRenderInput[],
) {
  let token = 2166136261;
  token = mixRenderToken(token, coordToken(state.player.coord));
  token = mixRenderToken(token, coordToken(state.homeHex));
  token = mixRenderToken(token, state.bloodMoonActive ? 1 : 0);
  token = mixRenderToken(token, getWorldIconTextureVersion());

  for (const tileRenderInput of visibleTileRenderInputs) {
    token = mixRenderToken(token, getStaticTileRenderToken(tileRenderInput));
  }

  return token;
}

function getStaticTileRenderToken({ enemies, tile }: VisibleTileRenderInput) {
  const enemyToken = enemies.reduce((token, enemy) => {
    token = mixRenderToken(token, hashRenderString(enemy.id));
    token = mixRenderToken(
      token,
      hashRenderString(enemy.enemyTypeId ?? 'unknown'),
    );
    token = mixRenderToken(token, hashRenderString(enemy.rarity ?? 'common'));
    token = mixRenderToken(token, enemy.aggressive === false ? 0 : 1);
    token = mixRenderToken(token, enemy.worldBoss ? 1 : 0);
    return token;
  }, 2166136261);

  let token = 2166136261;
  token = mixRenderToken(token, coordToken(tile.coord));
  token = mixRenderToken(token, hashRenderString(tile.terrain));
  token = mixRenderToken(token, hashRenderString(tile.structure ?? 'none'));
  token = mixRenderToken(
    token,
    tile.claim
      ? hashRenderString(
          `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`,
        )
      : 0,
  );
  token = mixRenderToken(token, enemyToken);
  token = mixRenderToken(token, getTileItemRenderToken(tile.items));
  return token;
}

function getTileItemRenderToken(items: GameState['tiles'][string]['items']) {
  let itemToken = 2166136261;

  for (const item of items) {
    itemToken = mixRenderToken(itemToken, hashRenderString(item.id));
    itemToken = mixRenderToken(itemToken, hashRenderString(item.name));
    itemToken = mixRenderToken(itemToken, hashRenderString(`${item.quantity}`));
  }

  return itemToken;
}

function getInteractionRenderToken(
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  const playerTile =
    visibleTiles.find((tile) => sameCoord(tile.coord, state.player.coord)) ??
    state.tiles[hexKey(state.player.coord)];

  let token = 2166136261;
  token = mixRenderToken(token, coordToken(state.player.coord));
  token = mixRenderToken(token, playerTile?.items.length ? 1 : 0);
  return token;
}

function getVisibleEnemyToken(
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  let token = 2166136261;

  for (const tile of visibleTiles) {
    for (const enemyId of tile.enemyIds) {
      const enemy = state.enemies[enemyId];
      token = mixRenderToken(token, hashRenderString(enemyId));

      if (!enemy) {
        token = mixRenderToken(token, 0);
        continue;
      }

      token = mixRenderToken(
        token,
        hashRenderString(enemy.enemyTypeId ?? 'unknown'),
      );
      token = mixRenderToken(token, hashRenderString(enemy.rarity ?? 'common'));
      token = mixRenderToken(token, enemy.aggressive === false ? 0 : 1);
      token = mixRenderToken(token, enemy.worldBoss ? 1 : 0);
    }
  }

  return token;
}

function mixRenderToken(token: number, value: number) {
  return Math.imul(token ^ value, 16777619) >>> 0;
}

function hashRenderString(value: string) {
  let token = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    token = mixRenderToken(token, value.charCodeAt(index));
  }

  return token;
}

function coordToken(coord: HexCoord | null) {
  if (!coord) {
    return 0;
  }

  let token = 2166136261;
  token = mixRenderToken(token, coord.q + 2048);
  token = mixRenderToken(token, coord.r + 2048);
  return token;
}

function pathToken(path: HexCoord[] | null) {
  if (!path) {
    return 0;
  }

  return path.reduce(
    (token, coord) => mixRenderToken(token, coordToken(coord)),
    2166136261,
  );
}

function sameCoord(left: HexCoord | null, right: HexCoord | null) {
  if (left == null || right == null) {
    return left === right;
  }

  return left.q === right.q && left.r === right.r;
}

function coordKey(coord: HexCoord | null) {
  return coord ? hexKey(coord) : 'none';
}
