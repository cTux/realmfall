import type { HexCoord } from './hex';
import { createRng } from './random';

export const LOCKED_CHEST_MIMIC_CHANCE = 0.1;
export const LOCKPICK_BREAK_BASE_CHANCE = 0.75;
export const LOCKPICK_BREAK_REDUCTION_PER_LEVEL = 0.005;
export const LOCKPICK_BREAK_MIN_CHANCE = 0.25;
export const LOCKPICK_DROP_CHANCE = 0.005;
export const CHEST_KEY_DROP_CHANCE = 0.0001;

export function getLockpickBreakChance(level: number) {
  return Math.max(
    LOCKPICK_BREAK_MIN_CHANCE,
    LOCKPICK_BREAK_BASE_CHANCE -
      Math.max(0, level - 1) * LOCKPICK_BREAK_REDUCTION_PER_LEVEL,
  );
}

export function isLockedChestMimic(seed: string, coord: HexCoord) {
  return (
    createRng(`${seed}:locked-chest:mimic:${coord.q}:${coord.r}`)() <
    LOCKED_CHEST_MIMIC_CHANCE
  );
}
