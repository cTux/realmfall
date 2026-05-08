import type { GameState, HexCoord } from '../../../game/stateTypes';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';
import { getActiveWorld } from '../../../game/dungeons/worldState';

function coordToken(coord: HexCoord | null | undefined) {
  if (!coord) {
    return 'null';
  }

  return `${coord.q}:${coord.r}`;
}

export function getWorldRenderToken(game: GameState): string {
  const activeWorld = getActiveWorld(game);
  const activeWorldId = game.activeWorldId ?? game.surfaceWorldId ?? '';
  const activeWorldKind = activeWorld?.kind ?? 'surface';
  const player = game.player;
  const combat = game.combat;
  const engagement = combat?.engagement;

  return [
    game.seed ?? '',
    String(game.radius ?? 0),
    activeWorldId,
    activeWorldKind,
    coordToken(player?.coord),
    coordToken(game.homeHex),
    combat?.enemyIds?.length ?? 0,
    engagement?.autoStepOnVictory ? 1 : 0,
    coordToken(engagement?.targetCoord),
    coordToken(engagement?.stagingCoord),
    combat?.started ? 1 : 0,
    combat?.startedAtMs?.toString() ?? 'none',
    String(game.bloodMoonActive ?? false),
    String(game.harvestMoonActive ?? false),
    String(player?.hp ?? 0),
    String(player?.baseMaxHp ?? 0),
    String(player?.mana ?? 0),
    String(player?.baseMaxMana ?? 0),
    String(player?.level ?? 0),
    String(game.worldFloatingTextEvents?.length ?? 0),
  ].join('|');
}

export interface WorldRenderSnapshot {
  worldRenderToken: string | null;
  visibleTiles: VisibleWorldTile[] | null;
  selected: HexCoord | null;
  queuedPath: HexCoord[] | null;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  animationBucket: number;
  invalidationToken: number;
  iconTextureVersion: number;
  movementCooldownEndAtMs: number | null;
  movementCooldownRenderToken: number;
  movementTransitionRenderToken: number;
  showClouds: boolean;
  cloudTransparency: number;
  showTerrainBackgrounds: boolean;
  worldRenderFps: number;
  previousPlayerCoord: HexCoord | null;
  previousCombatAutoStepOnVictory: boolean;
  previousCombatAutoStepTargetCoord: HexCoord | null;
}

export function createInitialWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    worldRenderToken: null,
    visibleTiles: null,
    selected: null,
    queuedPath: null,
    hoveredMove: null,
    hoveredSafePath: null,
    animationBucket: -1,
    invalidationToken: 0,
    iconTextureVersion: -1,
    movementCooldownEndAtMs: null,
    movementCooldownRenderToken: -1,
    movementTransitionRenderToken: -1,
    showClouds: true,
    cloudTransparency: 0,
    showTerrainBackgrounds: true,
    worldRenderFps: 0,
    previousPlayerCoord: null,
    previousCombatAutoStepOnVictory: false,
    previousCombatAutoStepTargetCoord: null,
  };
}
