import { enemyRarityIndex } from '../../game/stateSelectors';
import type { GameState, Tile } from '../../game/stateTypes';
import { hexKey } from '../../game/hex';
import {
  getPlacedWorldBossCenter,
  isWorldBossEnemyId,
} from '../../game/worldBoss';
import {
  WorldIcons,
  enemyIconFor,
  enemyIconTintFor,
  structureIconFor,
} from './worldIcons';
import {
  configureShadowedSprite,
  takeShadowedSprite,
  takeText,
} from './renderScenePools';
import { ENEMY_GROUP_LABEL_STYLE, type SceneCache } from './renderSceneCache';
import {
  ENEMY_GROUP_BADGE_OFFSET,
  getStructureHexIconTint,
  registerAnimatedWorldMarker,
} from './renderSceneShared';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';

export function renderStaticMarkers({
  enemyIconSize,
  point,
  scene,
  shadowOffset,
  state,
  structureIconSize,
  tile,
  visibleTileMap,
  visibleTileRenderInput,
  worldBossIconSize,
}: {
  enemyIconSize: number;
  point: { x: number; y: number };
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  state: GameState;
  structureIconSize: number;
  tile: Tile;
  visibleTileMap: Map<string, Tile> | null;
  visibleTileRenderInput: VisibleTileRenderInput;
  worldBossIconSize: number;
}) {
  if (tile.structure) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      tile.structure === 'town' && tile.claim?.ownerType === 'faction'
        ? WorldIcons.Castle
        : structureIconFor(tile.structure),
    );
    const tint = getStructureHexIconTint(tile.structure);
    configureShadowedSprite(
      marker,
      tint,
      structureIconSize,
      structureIconSize,
      1,
      shadowOffset,
      point,
    );
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      structureIconSize,
      structureIconSize,
      tint,
      'resource',
    );
  }

  const { enemies, hostileEnemies } = visibleTileRenderInput;

  if (tile.claim?.npc?.enemyId) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      WorldIcons.Village,
    );
    configureShadowedSprite(
      marker,
      0xffffff,
      enemyIconSize,
      enemyIconSize,
      1,
      shadowOffset,
      point,
    );
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      enemyIconSize,
      enemyIconSize,
      0xffffff,
      'settlement',
    );
    return;
  }

  if (hostileEnemies.length > 0 && tile.structure !== 'dungeon') {
    const worldBossCenter = getPlacedWorldBossCenter(
      tile.coord,
      (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
    );
    const leadEnemy = hostileEnemies[0];
    const highestRarityEnemy = hostileEnemies.reduce(
      (highest, enemy) =>
        enemyRarityIndex(enemy.rarity) > enemyRarityIndex(highest.rarity)
          ? enemy
          : highest,
      leadEnemy,
    );
    const isBossCenter = tile.enemyIds.some((enemyId) =>
      isWorldBossEnemyId(enemyId),
    );
    if (!worldBossCenter || isBossCenter) {
      const sprite = takeShadowedSprite(
        scene.worldStaticMarkerSprites,
        enemyIconFor(leadEnemy),
      );
      const tint = enemyIconTintFor(highestRarityEnemy);
      const markerPoint = isBossCenter
        ? point
        : {
            x: point.x,
            y: point.y - 2,
          };
      const markerSize = isBossCenter ? worldBossIconSize : enemyIconSize;
      configureShadowedSprite(
        sprite,
        tint,
        markerSize,
        markerSize,
        1,
        shadowOffset,
        markerPoint,
      );
      registerAnimatedWorldMarker(
        scene,
        state.seed,
        tile.coord,
        sprite,
        markerPoint,
        markerSize,
        markerSize,
        tint,
        isBossCenter ? 'worldBoss' : 'enemy',
      );

      if (!isBossCenter && enemies.length >= 2) {
        renderEnemyGroupBadge(scene, point, enemies.length);
      }
    }
  }

  if (tile.structure === 'dungeon' && enemies.length > 0) {
    renderEnemyGroupBadge(scene, point, enemies.length);
  }
}

function renderEnemyGroupBadge(
  scene: SceneCache,
  point: { x: number; y: number },
  count: number,
) {
  const badgeLabel = takeText(
    scene.worldStaticMarkerTexts,
    ENEMY_GROUP_LABEL_STYLE,
  );
  badgeLabel.text = count.toString();
  badgeLabel.anchor.set(0.5);
  badgeLabel.position.set(
    point.x + ENEMY_GROUP_BADGE_OFFSET.x,
    point.y + ENEMY_GROUP_BADGE_OFFSET.y,
  );
}
