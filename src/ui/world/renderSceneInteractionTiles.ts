import type { HexCoord, Tile } from '../../game/stateTypes';
import type { SceneCache } from './renderSceneCache';
import { takeGraphics } from './renderScenePools';
import {
  SAFE_PATH_TINT_ALPHA,
  SAFE_PATH_TINT_COLOR,
} from './renderSceneShared';
import { tileStyle } from './renderSceneEnvironment';

export function renderInteractionTile({
  clickable,
  highlightedInSafePath,
  hovered,
  isPlayerTile,
  point,
  poly,
  safePolygon,
  scene,
  selected,
  style,
  tile,
}: {
  clickable: boolean;
  highlightedInSafePath: boolean;
  hovered: boolean;
  isPlayerTile: boolean;
  point: HexCoord;
  poly: number[];
  safePolygon: number[];
  scene: SceneCache;
  selected: HexCoord;
  style: ReturnType<typeof tileStyle>;
  tile: Tile;
}) {
  if (hovered) {
    const hoverOverlay = takeGraphics(scene.worldInteractionGraphics);
    hoverOverlay.poly(clickable ? safePolygon : poly).fill({
      color: clickable ? SAFE_PATH_TINT_COLOR : style.color,
      alpha: clickable ? SAFE_PATH_TINT_ALPHA : Math.min(1, style.alpha + 0.26),
    });
  }

  if (highlightedInSafePath) {
    const safePathOverlay = takeGraphics(scene.worldInteractionGraphics);
    safePathOverlay.poly(safePolygon).fill({
      color: SAFE_PATH_TINT_COLOR,
      alpha: SAFE_PATH_TINT_ALPHA,
    });
  }

  if (
    !hovered &&
    !isPlayerTile &&
    selected.q === point.q &&
    selected.r === point.r
  ) {
    const outline = takeGraphics(scene.worldInteractionGraphics);
    outline.poly(poly).stroke({ width: 3, color: 0xf8fafc, alpha: 0.65 });
  } else if (tile.items.length > 0 && isPlayerTile) {
    const lootBorder = takeGraphics(scene.worldInteractionGraphics);
    lootBorder.poly(poly).stroke({ width: 3, color: 0x22c55e, alpha: 0.95 });
  }
}
