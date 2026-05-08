import { hexKey } from '../../game/hex';
import type { RenderSceneFrameState } from './renderSceneFrameState';
import { getLightingState } from './renderSceneAtmosphere';
import { ZERO_SHADOW_OFFSET } from './renderSceneShared';
import type { VisibleWorldTile } from './visibleWorldTiles';

export interface RenderScenePhasePlan {
  shouldRenderStatic: boolean;
  shouldRenderInteraction: boolean;
  shouldRenderAnimated: boolean;
  shouldRenderTilePasses: boolean;
  interactionRenderToken: number;
  visibleTileMap: Map<string, VisibleWorldTile> | null;
  visibleTileRenderInputs:
    | ReturnType<
        typeof import('./renderSceneTokens').getSceneRenderTokens
      >['visibleTileRenderInputs']
    | null;
  hoveredSafePathKeys: Set<string> | null;
  queuedPathKeys: Set<string> | null;
  lightingState: ReturnType<typeof getLightingState> | null;
  shadowOffset: { x: number; y: number };
}

export function getRenderScenePhasePlan(
  frameState: RenderSceneFrameState,
): RenderScenePhasePlan {
  const interactionRenderToken =
    frameState.renderTokens.interactionWithSelection(
      frameState.selected,
      frameState.hoveredMove,
      frameState.hoveredSafePath,
      frameState.queuedPath,
    );

  const shouldRenderStatic =
    frameState.screenChanged ||
    frameState.scene.staticRenderToken !== frameState.staticRenderToken ||
    frameState.scene.visibleEnemyBadgeRenderToken !==
      frameState.visibleEnemyBadgeRenderToken;

  const shouldRenderAnimated =
    frameState.screenChanged ||
    shouldRenderStatic ||
    frameState.scene.animatedRenderToken !== frameState.animatedRenderToken;

  const shouldRenderInteraction =
    shouldRenderStatic ||
    frameState.scene.playerResourceRenderToken !==
      frameState.playerResourceRenderToken ||
    frameState.scene.interactionRenderToken !== interactionRenderToken;

  const hoveredSafePathKeys = shouldRenderInteraction
    ? new Set(frameState.hoveredSafePath?.map((coord) => hexKey(coord)))
    : null;
  const queuedPathKeys = shouldRenderInteraction
    ? new Set(frameState.queuedPath?.map((coord) => hexKey(coord)))
    : null;

  const visibleTileMap = shouldRenderStatic
    ? new Map(
        frameState.displayVisibleTiles.map(
          (tile) => [hexKey(tile.coord), tile] as const,
        ),
      )
    : null;
  const visibleTileRenderInputs = shouldRenderStatic
    ? frameState.renderTokens.visibleTileRenderInputs
    : null;

  const lightingState =
    shouldRenderAnimated || shouldRenderStatic
      ? getLightingState(
          frameState.app,
          frameState.worldTimeMinutes,
          frameState.animationMs,
          frameState.state.bloodMoonActive,
          frameState.state.harvestMoonActive,
        )
      : null;

  const shadowOffset =
    frameState.currentWorldKind === 'dungeon' || !lightingState
      ? ZERO_SHADOW_OFFSET
      : lightingState.shadowOffset;

  return {
    shouldRenderStatic,
    shouldRenderInteraction,
    shouldRenderAnimated,
    shouldRenderTilePasses: shouldRenderStatic || shouldRenderInteraction,
    interactionRenderToken,
    visibleTileMap,
    visibleTileRenderInputs,
    hoveredSafePathKeys,
    queuedPathKeys,
    lightingState,
    shadowOffset,
  };
}
