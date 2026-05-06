import { WORLD_COMBAT_LUNGE_DURATION_MS } from '../../game/worldCombatPresentation';
import type { HexCoord } from '../../game/stateTypes';
import { tileToPoint } from './renderSceneMath';

const PLAYER_LUNGE_DISTANCE_RATIO = 0.16;
const PLAYER_LUNGE_MIN_PX = 8;

export function getWorldCombatLungeOffset({
  hexSize,
  phase,
  stagingCoord,
  startedAtMs,
  targetCoord,
  worldTimeMs,
}: {
  hexSize: number;
  phase: 'animating' | 'held';
  stagingCoord: HexCoord;
  startedAtMs: number;
  targetCoord: HexCoord;
  worldTimeMs: number;
}) {
  const targetDelta = tileToPoint(
    {
      q: targetCoord.q - stagingCoord.q,
      r: targetCoord.r - stagingCoord.r,
    },
    0,
    0,
    hexSize,
  );
  const distance = Math.hypot(targetDelta.x, targetDelta.y);
  if (distance <= 0) {
    return { x: 0, y: 0 };
  }

  const rawProgress =
    phase === 'held'
      ? 1
      : Math.max(
          0,
          Math.min(
            1,
            (worldTimeMs - startedAtMs) / WORLD_COMBAT_LUNGE_DURATION_MS,
          ),
        );
  const progress =
    phase === 'held' ? 1 : Math.sin((rawProgress * Math.PI) / 2);
  const lungeDistance = Math.min(
    distance * PLAYER_LUNGE_DISTANCE_RATIO,
    Math.max(PLAYER_LUNGE_MIN_PX, hexSize * PLAYER_LUNGE_DISTANCE_RATIO),
  );

  return {
    x: (targetDelta.x / distance) * lungeDistance * progress,
    y: (targetDelta.y / distance) * lungeDistance * progress,
  };
}
