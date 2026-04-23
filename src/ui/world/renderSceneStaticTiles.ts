import type { GameState, Tile } from '../../game/stateTypes';
import { configureSprite, takeGraphics, takeSprite } from './renderScenePools';
import type { SceneCache } from './renderSceneCache';
import { terrainArtFor } from './worldTerrainArt';
import {
  HOME_HEX_TINT_ALPHA,
  HOME_HEX_TINT_COLOR,
  structureEmitsCampfireLight,
  WORLD_BOSS_HEX_TINT_ALPHA,
  WORLD_BOSS_HEX_TINT_COLOR,
} from './renderSceneShared';
import { tileStyle } from './renderSceneEnvironment';
import { getPlacedWorldBossCenter } from '../../game/worldBoss';
import { hexKey } from '../../game/hex';
import { renderClaimBorder } from './renderSceneClaimBorders';
import { renderStaticMarkers } from './renderSceneStaticMarkers';

export function renderStaticTile({
  emphasized,
  enemyIconSize,
  isHomeTile,
  isPlayerTile,
  nextCampfireLightPoints,
  point,
  poly,
  revealed,
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
  worldBossIconSize,
}: {
  emphasized: boolean;
  enemyIconSize: number;
  isHomeTile: boolean;
  isPlayerTile: boolean;
  nextCampfireLightPoints: Array<{ x: number; y: number }>;
  point: { x: number; y: number };
  poly: number[];
  revealed: boolean;
  safePolygon: number[];
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  showTerrainBackgrounds: boolean;
  state: GameState;
  structureIconSize: number;
  style: ReturnType<typeof tileStyle>;
  terrainArtSize: number;
  tile: Tile;
  visibleTileMap: Map<string, Tile> | null;
  worldBossIconSize: number;
}) {
  const worldBossCenter = getPlacedWorldBossCenter(
    tile.coord,
    (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
  );
  const isWorldBossFootprint = worldBossCenter !== null;
  const fillAlpha = emphasized ? style.alpha : 0.8;
  const shape = takeGraphics(scene.worldGroundGraphics);
  shape
    .poly(poly)
    .fill({ color: style.color, alpha: fillAlpha })
    .stroke({ width: 1, color: 0x1e293b, alpha: 0.9 });

  if (isHomeTile) {
    const homeTint = takeGraphics(scene.worldStaticDetailGraphics);
    homeTint.poly(safePolygon).fill({
      color: HOME_HEX_TINT_COLOR,
      alpha: HOME_HEX_TINT_ALPHA,
    });
  }

  if (isWorldBossFootprint) {
    const worldBossTint = takeGraphics(scene.worldStaticDetailGraphics);
    worldBossTint.poly(poly).fill({
      color: WORLD_BOSS_HEX_TINT_COLOR,
      alpha: WORLD_BOSS_HEX_TINT_ALPHA,
    });
  }

  if (!revealed) {
    const fog = takeGraphics(scene.worldStaticDetailGraphics);
    fog.poly(poly).fill({ color: 0x020617, alpha: 0.78 });
    return;
  }

  if (showTerrainBackgrounds) {
    const terrainSprite = takeSprite(
      scene.worldTerrainSprites,
      terrainArtFor(tile.terrain),
    );
    configureSprite(
      terrainSprite,
      0xffffff,
      terrainArtSize,
      terrainArtSize,
      emphasized ? 0.84 : 0.76,
      point,
    );
  }

  if (!isPlayerTile) {
    renderStaticMarkers({
      enemyIconSize,
      point,
      scene,
      shadowOffset,
      state,
      structureIconSize,
      tile,
      visibleTileMap,
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
    );
  }

  if (structureEmitsCampfireLight(tile.structure)) {
    nextCampfireLightPoints.push(point);
  }
}
