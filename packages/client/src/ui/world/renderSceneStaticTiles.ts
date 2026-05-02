import type { GameState } from '../../game/stateTypes';
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
  isHomeTile,
  isPlayerTile,
  nextCampfireLightPoints,
  point,
  poly,
  revealed,
  appearanceAlpha,
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
  isHomeTile: boolean;
  isPlayerTile: boolean;
  nextCampfireLightPoints: Array<{ x: number; y: number }>;
  point: { x: number; y: number };
  poly: number[];
  revealed: boolean;
  appearanceAlpha: number;
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
  const fillAlpha = (emphasized ? style.alpha : 0.8) * appearanceAlpha;
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

  if (!revealed) {
    const fog = takeGraphics(scene.worldStaticDetailGraphics);
    fog.poly(poly).fill({ color: 0x020617, alpha: 0.78 * appearanceAlpha });
    return;
  }

  const revealProgress = getVisibleWorldTileRevealProgress(tile, animationMs);

  if (showTerrainBackgrounds && !isUnknownVisibleWorldTile(tile)) {
    const terrainSprite = takeSprite(
      scene.worldTerrainSprites,
      terrainArtFor(tile.terrain),
    );
    configureSprite(
      terrainSprite,
      0xffffff,
      terrainArtSize,
      terrainArtSize,
      (emphasized ? 0.84 : 0.76) * revealProgress * appearanceAlpha,
      point,
    );
  }

  if (!isPlayerTile) {
    renderStaticMarkers({
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
    });
  }

  if (tile.claim && visibleTileMap) {
    renderClaimBorder(
      scene.worldBorderGraphics,
      state,
      tile,
      poly,
      visibleTileMap,
      appearanceAlpha,
    );
  }

  if (structureEmitsCampfireLight(tile.structure)) {
    nextCampfireLightPoints.push(point);
  }
}
