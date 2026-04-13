import sparklesIcon from '../assets/icons/sparkles.svg';
import mouthWateringIcon from '../assets/icons/mouth-watering.svg';

export function statusEffectIcon(effect: string) {
  if (effect === 'Hunger') return mouthWateringIcon;
  return sparklesIcon;
}

export function statusEffectTint(effect: string, tone: 'buff' | 'debuff') {
  if (effect === 'Hunger') return '#f97316';
  return tone === 'buff' ? '#4ade80' : '#f87171';
}

export function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
