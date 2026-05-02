import { enemyRarityIndex } from '../../game/stateSelectors';
import type { GameState } from '../../game/stateTypes';
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
import {
  getVisibleWorldTileRevealProgress,
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

export function renderStaticMarkers({
  animationMs,
  enemyIconSize,
  point,
  scene,
  shadowOffset,
  state,
  structureIconSize,
  tile,
  appearanceAlpha,
  visibleTileMap,
  visibleTileRenderInput,
  worldBossIconSize,
}: {
  animationMs: number;
  enemyIconSize: number;
  point: { x: number; y: number };
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  state: GameState;
  structureIconSize: number;
  tile: VisibleWorldTile;
  appearanceAlpha: number;
  visibleTileMap: Map<string, VisibleWorldTile> | null;
  visibleTileRenderInput: VisibleTileRenderInput;
  worldBossIconSize: number;
}) {
  const revealProgress = getVisibleWorldTileRevealProgress(tile, animationMs);
  const resolvedMarkerAlpha = revealProgress * appearanceAlpha;
  const unknownMarkerAlpha = isUnknownVisibleWorldTile(tile)
    ? appearanceAlpha
    : (1 - revealProgress) * appearanceAlpha;

  if (unknownMarkerAlpha > 0) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      WorldIcons.UnknownHex,
    );
    configureShadowedSprite(
      marker,
      0xffffff,
      enemyIconSize,
      enemyIconSize,
      unknownMarkerAlpha,
      shadowOffset,
      point,
    );
  }

  if (isUnknownVisibleWorldTile(tile)) {
    return;
  }

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
      resolvedMarkerAlpha,
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
      resolvedMarkerAlpha,
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
      resolvedMarkerAlpha,
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
      resolvedMarkerAlpha,
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
        resolvedMarkerAlpha,
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
        resolvedMarkerAlpha,
      );

      if (!isBossCenter && enemies.length >= 2) {
        renderEnemyGroupBadge(
          scene,
          point,
          enemies.length,
          resolvedMarkerAlpha,
        );
      }
    }
  }

  if (tile.structure === 'dungeon' && enemies.length > 0) {
    renderEnemyGroupBadge(scene, point, enemies.length, resolvedMarkerAlpha);
  }

  const hasForgottenLootMarker =
    tile.items.length > 0 &&
    !tile.structure &&
    !tile.claim &&
    tile.enemyIds.length === 0;
  if (hasForgottenLootMarker) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      WorldIcons.ForgottenLoot,
    );
    configureShadowedSprite(
      marker,
      0xfde68a,
      enemyIconSize,
      enemyIconSize,
      resolvedMarkerAlpha,
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
      0xfde68a,
      'forgottenLoot',
      resolvedMarkerAlpha,
    );
  }
}

function renderEnemyGroupBadge(
  scene: SceneCache,
  point: { x: number; y: number },
  count: number,
  alpha = 1,
) {
  const badgeLabel = takeText(
    scene.worldStaticMarkerTexts,
    ENEMY_GROUP_LABEL_STYLE,
  );
  badgeLabel.text = count.toString();
  badgeLabel.alpha = alpha;
  badgeLabel.anchor.set(0.5);
  badgeLabel.position.set(
    point.x + ENEMY_GROUP_BADGE_OFFSET.x,
    point.y + ENEMY_GROUP_BADGE_OFFSET.y,
  );
}
