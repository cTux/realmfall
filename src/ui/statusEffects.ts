import sparklesIcon from '../assets/icons/sparkles.svg';
import {
  getStatusEffectDefinition,
  type StatusEffectDefinition,
} from '../game/content/statusEffects';
import { StatusEffectTypeId } from '../game/content/ids';
import type { StatusEffectId } from '../game/state';

export function statusEffectIcon(effect: StatusEffectId | string) {
  return getEffectDefinition(effect)?.icon ?? sparklesIcon;
}

export function statusEffectTint(
  effect: StatusEffectId | string,
  tone: 'buff' | 'debuff',
) {
  return (
    getEffectDefinition(effect)?.tint ??
    (tone === 'buff' ? '#4ade80' : '#f87171')
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
