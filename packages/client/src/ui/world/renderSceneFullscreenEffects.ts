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
const LEVEL_UP_GLOW_COLOR = 0xfbbf24;
const LEVEL_UP_GLOW_MIN_ALPHA = 0.16;
const LEVEL_UP_GLOW_MAX_ALPHA = 0.32;
const LEVEL_UP_GLOW_PULSE_MS = 900;
const NO_FULLSCREEN_VISUAL_EFFECTS = {
  renderToken: 'none',
  overlay: null,
} satisfies FullscreenVisualEffectsState;

export function getFullscreenVisualEffectsState(
  state: GameState,
  animationMs: number,
): FullscreenVisualEffectsState {
  if ((state.playerLevelUpVisualEndsAt ?? 0) > state.worldTimeMs) {
    return {
      renderToken: `level-up:${state.playerLevelUpVisualEndsAt ?? 0}`,
      overlay: {
        color: LEVEL_UP_GLOW_COLOR,
        alpha: getPulseAlpha(
          animationMs,
          LEVEL_UP_GLOW_PULSE_MS,
          LEVEL_UP_GLOW_MIN_ALPHA,
          LEVEL_UP_GLOW_MAX_ALPHA,
        ),
      },
    };
  }

  const { hp, maxHp } = getPlayerCombatStats(state.player);
  if (maxHp <= 0 || hp / maxHp >= LOW_HP_WARNING_THRESHOLD) {
    return NO_FULLSCREEN_VISUAL_EFFECTS;
  }

  return {
    renderToken: 'low-hp-warning',
    overlay: {
      color: LOW_HP_WARNING_COLOR,
      alpha: getPulseAlpha(
        animationMs,
        LOW_HP_WARNING_PULSE_MS,
        LOW_HP_WARNING_MIN_ALPHA,
        LOW_HP_WARNING_MAX_ALPHA,
      ),
    },
  };
}

function getPulseAlpha(
  animationMs: number,
  pulseMs: number,
  minAlpha: number,
  maxAlpha: number,
) {
  const pulse =
    (Math.sin((animationMs / pulseMs) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

  return minAlpha + (maxAlpha - minAlpha) * pulse;
}
