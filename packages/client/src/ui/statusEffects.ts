import {
  getStatusEffectDefinition,
  type StatusEffectDefinition,
} from '@realmfall/core/game/content/statusEffects';
import { StatusEffectTypeId } from '@realmfall/core/game/content/ids';
import { CONTENT_ICON_IDS } from '@realmfall/core/game/content/iconIds';
import type { StatusEffectId } from '@realmfall/core/game/stateTypes';
import { STATUS_EFFECT_FALLBACK_TINTS } from '../theme.config';
import { resolveIconAsset } from './iconAssets';

export function statusEffectIcon(effect: StatusEffectId | string) {
  return resolveIconAsset(
    getEffectDefinition(effect)?.icon ?? CONTENT_ICON_IDS.Sparkles,
  );
}

export function statusEffectTint(
  effect: StatusEffectId | string,
  tone: 'buff' | 'debuff',
) {
  return (
    getEffectDefinition(effect)?.tint ?? STATUS_EFFECT_FALLBACK_TINTS[tone]
  );
}

export function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}

function getEffectDefinition(effect: StatusEffectId | string) {
  return getStatusEffectDefinition(effect as `${StatusEffectTypeId}`) as
    | StatusEffectDefinition
    | undefined;
}
