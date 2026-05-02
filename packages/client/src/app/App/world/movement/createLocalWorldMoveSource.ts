import type { WorldMoveSource } from './worldMoveSource';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../../../game/config';

export function createLocalWorldMoveSource({
  cooldownMs = WORLD_MOVE_HEX_COOLDOWN_MS,
  now = () => performance.now(),
}: {
  cooldownMs?: number;
  now?: () => number;
} = {}): WorldMoveSource {
  let cooldownEndAtMs = 0;

  return {
    async requestMove(request) {
      const currentTime = now();
      const remainingCooldownMs = Math.max(0, cooldownEndAtMs - currentTime);
      if (remainingCooldownMs > 0) {
        return {
          ok: false,
          requestId: request.requestId,
          remainingCooldownMs,
        };
      }

      cooldownEndAtMs = currentTime + cooldownMs;
      return {
        ok: true,
        requestId: request.requestId,
        cooldownMs,
      };
    },
  };
}
