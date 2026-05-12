import type { GameState } from '@realmfall/core/game/stateTypes';
import { configureSprite, takeGraphics, takeSprite } from './renderScenePools';
import type { SceneCache } from './renderSceneCache';
import { terrainArtForVisibleTile } from './worldTerrainArt';
import {
  HOME_HEX_TINT_ALPHA,
  HOME_HEX_TINT_COLOR,
  structureEmitsCampfireLight,
  WORLD_BOSS_HEX_TINT_ALPHA,
  WORLD_BOSS_HEX_TINT_COLOR,
} from './renderSceneShared';
import { tileStyle } from './renderSceneEnvironment';
import { getPlacedWorldBossCenter } from '@realmfall/core/game/worldBoss';
import { hexKey } from '@realmfall/core/game/hex';
import { renderClaimBorder } from './renderSceneClaimBorders';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import { renderStaticMarkers } from './renderSceneStaticMarkers';
import {
  getVisibleWorldTileRevealProgress,
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

export function renderStaticTile({
  emphasized,
  enemyIconSize,
  animationMs,
  hexSize,
  isHomeTile,
  markerIdentityKeyBase,
  isPlayerTile,
  nextCampfireLightPoints,
  point,
  poly,
  appearanceAlpha,
  revealAlpha,
  safePolygon,
  scene,
  shadowOffset,
  showTerrainBackgrounds,
  state,
  structureIconSize,
  style,
  terrainArtSize,
  tile,
  visibleTileMap,
  visibleTileRenderInput,
  worldBossIconSize,
}: {
  emphasized: boolean;
  enemyIconSize: number;
  animationMs: number;
  hexSize: number;
  isHomeTile: boolean;
  markerIdentityKeyBase: string | null;
  isPlayerTile: boolean;
  nextCampfireLightPoints: Array<{ alpha: number; x: number; y: number }>;
  point: { x: number; y: number };
  poly: number[];
  appearanceAlpha: number;
  revealAlpha: number;
  safePolygon: number[];
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  showTerrainBackgrounds: boolean;
  state: GameState;
  structureIconSize: number;
  style: ReturnType<typeof tileStyle>;
  terrainArtSize: number;
  tile: VisibleWorldTile;
  visibleTileMap: Map<string, VisibleWorldTile> | null;
  visibleTileRenderInput: VisibleTileRenderInput;
  worldBossIconSize: number;
}) {
  const worldBossCenter = getPlacedWorldBossCenter(
    tile.coord,
    (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
  );
  const isWorldBossFootprint = worldBossCenter !== null;
  const fillAlpha =
    (emphasized || tile.terrain.startsWith('dungeon-') ? style.alpha : 0.8) *
    appearanceAlpha;
  const resolvedAppearanceAlpha = appearanceAlpha * revealAlpha;
  const shape = takeGraphics(scene.worldGroundGraphics);
  shape
    .poly(poly)
    .fill({ color: style.color, alpha: fillAlpha })
    .stroke({ width: 1, color: 0x1e293b, alpha: 0.9 * appearanceAlpha });

  if (isHomeTile) {
    const homeTint = takeGraphics(scene.worldStaticDetailGraphics);
    homeTint.poly(safePolygon).fill({
      color: HOME_HEX_TINT_COLOR,
      alpha: HOME_HEX_TINT_ALPHA * appearanceAlpha,
    });
  }

  if (isWorldBossFootprint) {
    const worldBossTint = takeGraphics(scene.worldStaticDetailGraphics);
    worldBossTint.poly(poly).fill({
      color: WORLD_BOSS_HEX_TINT_COLOR,
      alpha: WORLD_BOSS_HEX_TINT_ALPHA * appearanceAlpha,
    });
  }

  const revealProgress = getVisibleWorldTileRevealProgress(tile, animationMs);

  if (showTerrainBackgrounds && !isUnknownVisibleWorldTile(tile)) {
    const terrainAlpha =
      (emphasized ? 0.84 : 0.76) * revealProgress * resolvedAppearanceAlpha;
    if (revealAlpha > 0) {
      const terrainSprite = takeSprite(
        scene.worldTerrainSprites,
        terrainArtForVisibleTile(tile, visibleTileMap),
      );
      configureSprite(
        terrainSprite,
        0xffffff,
        terrainArtSize,
        terrainArtSize,
        terrainAlpha,
        point,
      );
    }
  }

  if (!isPlayerTile) {
    renderStaticMarkers({
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
      appearanceAlpha: resolvedAppearanceAlpha,
      revealAlpha,
      visibleTileMap,
      visibleTileRenderInput,
      worldBossIconSize,
    });
  }

  if (tile.claim && visibleTileMap) {
    renderClaimBorder(
      scene.worldBorderGraphics,
      state,
      tile,
      poly,
      visibleTileMap,
      resolvedAppearanceAlpha,
    );
  }

  const fogAlpha = 0.78 * appearanceAlpha * (1 - revealAlpha);
  if (fogAlpha > 0) {
    const fog = takeGraphics(scene.worldStaticDetailGraphics);
    fog.poly(poly).fill({ color: 0x020617, alpha: fogAlpha });
  }

  if (
    structureEmitsCampfireLight(tile.structure) &&
    resolvedAppearanceAlpha > 0
  ) {
    nextCampfireLightPoints.push({
      ...point,
      alpha: resolvedAppearanceAlpha,
    });
  }
}
