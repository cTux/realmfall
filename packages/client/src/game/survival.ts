export const PLAYER_SURVIVAL_MAX = 300;
export const PLAYER_SURVIVAL_WARNING_THRESHOLD = Math.ceil(
  PLAYER_SURVIVAL_MAX * 0.3,
);

export function getPlayerThirstValue(thirst: number | undefined) {
  return thirst ?? PLAYER_SURVIVAL_MAX;
}
