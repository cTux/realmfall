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
  configureEntityBadgeSprite,
  ENTITY_BADGE_BACKGROUND_COLORS,
  ENTITY_BADGE_RADIUS_SCALE,
  ENTITY_BADGE_STRUCTURE_BACKGROUND_ALPHA,
  ENTITY_BADGE_STRUCTURE_BORDER_WIDTH,
} from './renderSceneEntityBadge';
import {
  configureShadowedSprite,
  takeShadowedSprite,
  takeText,
} from './renderScenePools';
import { ENEMY_GROUP_LABEL_STYLE, type SceneCache } from './renderSceneCache';
import {
  ENEMY_GROUP_BADGE_OFFSET,
  getStructureBadgeBackgroundColor,
  getStructureHexIconTint,
  registerAnimatedWorldMarker,
} from './renderSceneShared';
import { getDungeonEnemyAnimatedMovementTransition } from './renderSceneDungeonEnemyTransitions';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import {
  getVisibleWorldTileRevealProgress,
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

const STRUCTURE_BADGE_RADIUS_SCALE = 0.7;
const STRUCTURE_BADGE_ICON_SCALE = 0.6;
const WORLD_BOSS_ICON_SCALE = 0.92 * 0.8 * 0.8 * 1.1 * 1.1 * 1.05 * 1.05;

export function renderStaticMarkers({
  animationMs,
  enemyIconSize,
  hexSize,
  markerIdentityKeyBase,
  point,
  scene,
  shadowOffset,
  state,
  structureIconSize,
  tile,
  appearanceAlpha,
  revealAlpha,
  visibleTileMap,
  visibleTileRenderInput,
  worldBossIconSize,
}: {
  animationMs: number;
  enemyIconSize: number;
  hexSize: number;
  markerIdentityKeyBase: string | null;
  point: { x: number; y: number };
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  state: GameState;
  structureIconSize: number;
  tile: VisibleWorldTile;
  appearanceAlpha: number;
  revealAlpha: number;
  visibleTileMap: Map<string, VisibleWorldTile> | null;
  visibleTileRenderInput: VisibleTileRenderInput;
  worldBossIconSize: number;
}) {
  if (appearanceAlpha <= 0 && revealAlpha <= 0) {
    return;
  }

  const revealProgress = getVisibleWorldTileRevealProgress(tile, animationMs);
  const resolvedMarkerAlpha = revealProgress * appearanceAlpha;
  const unknownMarkerAlpha = isUnknownVisibleWorldTile(tile)
    ? appearanceAlpha
    : (1 - revealProgress) * appearanceAlpha;
  const engagedEnemyIdSet = state.combat?.enemyIds
    ? new Set(state.combat.enemyIds)
    : null;
  const getMarkerIdentityKey = (markerKind: string) =>
    markerIdentityKeyBase === null
      ? undefined
      : `${markerIdentityKeyBase}:${markerKind}`;

  if (unknownMarkerAlpha > 0) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      WorldIcons.UnknownHex,
      {
        stableKey: getMarkerIdentityKey('unknown'),
      },
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
      {
        stableKey: getMarkerIdentityKey('structure'),
      },
    );
    const tint = getStructureHexIconTint(tile.structure);
    const structureBadgeIconSize = configureResourceStyleBadgeSprite(marker, {
      alpha: resolvedMarkerAlpha,
      backgroundColor: getStructureBadgeBackgroundColor(tile.structure),
      iconSize: structureIconSize,
      iconTint: tint,
      point,
      shadowOffset,
    });
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      structureBadgeIconSize,
      structureBadgeIconSize,
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
      {
        stableKey: getMarkerIdentityKey('claim-npc'),
      },
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
    const showCombatBars =
      engagedEnemyIdSet !== null &&
      hostileEnemies.some((enemy) => engagedEnemyIdSet.has(enemy.id));
    if (!worldBossCenter || isBossCenter) {
      const sprite = takeShadowedSprite(
        scene.worldStaticMarkerSprites,
        enemyIconFor(leadEnemy),
        {
          stableKey: isBossCenter
            ? getMarkerIdentityKey('world-boss')
            : `enemy:${leadEnemy.id}`,
        },
      );
      const tint = enemyIconTintFor(highestRarityEnemy);
      const markerPoint = isBossCenter
        ? point
        : {
            x: point.x,
            y: point.y - 2,
          };
      const markerSize = isBossCenter ? worldBossIconSize : enemyIconSize;
      const markerIconSize = isBossCenter
        ? markerSize * WORLD_BOSS_ICON_SCALE
        : markerSize;
      configureEntityBadgeSprite(sprite, {
        alpha: resolvedMarkerAlpha,
        backgroundColor: ENTITY_BADGE_BACKGROUND_COLORS.enemy,
        borderWidth: showCombatBars ? undefined : 2,
        countLabel: enemies.length >= 2 ? enemies.length.toString() : undefined,
        hp: showCombatBars
          ? {
              current: leadEnemy.hp,
              max: leadEnemy.maxHp,
            }
          : undefined,
        iconSize: markerIconSize,
        iconTint: tint,
        levelLabel: leadEnemy.tier.toString(),
        mana: showCombatBars
          ? {
              current: leadEnemy.mana ?? 0,
              max: leadEnemy.maxMana ?? 0,
            }
          : undefined,
        outerRadius:
          markerSize * (isBossCenter ? 0.58 : 0.76) * ENTITY_BADGE_RADIUS_SCALE,
        point: markerPoint,
        shadowOffset,
      });
      registerAnimatedWorldMarker(
        scene,
        state.seed,
        tile.coord,
        sprite,
        markerPoint,
        markerIconSize,
        markerIconSize,
        tint,
        isBossCenter ? 'worldBoss' : 'enemy',
        resolvedMarkerAlpha,
        isBossCenter
          ? undefined
          : {
              animationKey: leadEnemy.id,
              enemyId: leadEnemy.id,
              movementTransition: getDungeonEnemyAnimatedMovementTransition({
                enemy: leadEnemy,
                hexSize,
                scene,
              }),
            },
      );
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
      {
        stableKey: getMarkerIdentityKey('forgotten-loot'),
      },
    );
    const forgottenLootIconSize = configureResourceStyleBadgeSprite(marker, {
      alpha: resolvedMarkerAlpha,
      backgroundColor: ENTITY_BADGE_BACKGROUND_COLORS.default,
      iconSize: structureIconSize,
      iconTint: 0xfde68a,
      point,
      shadowOffset,
    });
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      forgottenLootIconSize,
      forgottenLootIconSize,
      0xfde68a,
      'forgottenLoot',
      resolvedMarkerAlpha,
    );
  }
}

function configureResourceStyleBadgeSprite(
  entry: Parameters<typeof configureEntityBadgeSprite>[0],
  {
    alpha,
    backgroundColor,
    iconSize,
    iconTint,
    point,
    shadowOffset,
  }: {
    alpha: number;
    backgroundColor: number;
    iconSize: number;
    iconTint: number;
    point: { x: number; y: number };
    shadowOffset: { x: number; y: number };
  },
) {
  const badgeIconSize = iconSize * STRUCTURE_BADGE_ICON_SCALE;
  configureEntityBadgeSprite(entry, {
    alpha,
    backgroundAlpha: ENTITY_BADGE_STRUCTURE_BACKGROUND_ALPHA,
    backgroundColor,
    borderWidth: ENTITY_BADGE_STRUCTURE_BORDER_WIDTH,
    iconSize: badgeIconSize,
    iconTint,
    outerRadius:
      iconSize *
      0.76 *
      ENTITY_BADGE_RADIUS_SCALE *
      STRUCTURE_BADGE_RADIUS_SCALE,
    point,
    shadowOffset,
  });

  return badgeIconSize;
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
