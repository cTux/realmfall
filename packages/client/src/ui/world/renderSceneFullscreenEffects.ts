import { getPlayerCombatStats } from '@realmfall/core/game/stateSelectors';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { CLIENT_FULLSCREEN_EFFECTS } from '../../client.config';
import { WORLD_RENDER_COLORS } from '../../theme.config';

export interface FullscreenVisualOverlay {
  color: number;
  alpha: number;
}

export interface FullscreenVisualEffectsState {
  renderToken: string;
  overlay: FullscreenVisualOverlay | null;
}

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
        color: WORLD_RENDER_COLORS.levelUpGlow,
        alpha: getPulseAlpha(
          animationMs,
          CLIENT_FULLSCREEN_EFFECTS.levelUpGlowPulseMs,
          CLIENT_FULLSCREEN_EFFECTS.levelUpGlowMinAlpha,
          CLIENT_FULLSCREEN_EFFECTS.levelUpGlowMaxAlpha,
        ),
      },
    };
  }

  const { hp, maxHp } = getPlayerCombatStats(state.player);
  if (
    maxHp <= 0 ||
    hp / maxHp >= CLIENT_FULLSCREEN_EFFECTS.lowHpWarningThreshold
  ) {
    return NO_FULLSCREEN_VISUAL_EFFECTS;
  }

  return {
    renderToken: 'low-hp-warning',
    overlay: {
      color: WORLD_RENDER_COLORS.lowHpWarning,
      alpha: getPulseAlpha(
        animationMs,
        CLIENT_FULLSCREEN_EFFECTS.lowHpWarningPulseMs,
        CLIENT_FULLSCREEN_EFFECTS.lowHpWarningMinAlpha,
        CLIENT_FULLSCREEN_EFFECTS.lowHpWarningMaxAlpha,
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
