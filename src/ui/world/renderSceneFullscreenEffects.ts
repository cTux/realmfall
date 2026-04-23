import { getPlayerCombatStats } from '../../game/stateSelectors';
import type { GameState } from '../../game/stateTypes';

export interface FullscreenVisualOverlay {
  color: number;
  alpha: number;
}

export interface FullscreenVisualEffectsState {
  renderToken: string;
  overlay: FullscreenVisualOverlay | null;
}

const LOW_HP_WARNING_THRESHOLD = 0.3;
const LOW_HP_WARNING_COLOR = 0x991b1b;
const LOW_HP_WARNING_MIN_ALPHA = 0.1;
const LOW_HP_WARNING_MAX_ALPHA = 0.2;
const LOW_HP_WARNING_PULSE_MS = 1_200;
const NO_FULLSCREEN_VISUAL_EFFECTS = {
  renderToken: 'none',
  overlay: null,
} satisfies FullscreenVisualEffectsState;

export function getFullscreenVisualEffectsState(
  state: GameState,
  animationMs: number,
): FullscreenVisualEffectsState {
  const { hp, maxHp } = getPlayerCombatStats(state.player);
  if (maxHp <= 0 || hp / maxHp >= LOW_HP_WARNING_THRESHOLD) {
    return NO_FULLSCREEN_VISUAL_EFFECTS;
  }

  return {
    renderToken: 'low-hp-warning',
    overlay: {
      color: LOW_HP_WARNING_COLOR,
      alpha: getLowHpWarningAlpha(animationMs),
    },
  };
}

function getLowHpWarningAlpha(animationMs: number) {
  const pulse =
    (Math.sin(
      (animationMs / LOW_HP_WARNING_PULSE_MS) * Math.PI * 2 - Math.PI / 2,
    ) +
      1) /
    2;

  return (
    LOW_HP_WARNING_MIN_ALPHA +
    (LOW_HP_WARNING_MAX_ALPHA - LOW_HP_WARNING_MIN_ALPHA) * pulse
  );
}
