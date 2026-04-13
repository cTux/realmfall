import sparklesIcon from '../assets/icons/sparkles.svg';
import mouthWateringIcon from '../assets/icons/mouth-watering.svg';
import waterskinIcon from '../assets/icons/waterskin.svg';

export function statusEffectIcon(effect: string) {
  if (effect === 'Hunger') return mouthWateringIcon;
  if (effect === 'Thirst') return waterskinIcon;
  return sparklesIcon;
}

export function statusEffectTint(effect: string, tone: 'buff' | 'debuff') {
  if (effect === 'Hunger') return '#f97316';
  if (effect === 'Thirst') return '#06b6d4';
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
