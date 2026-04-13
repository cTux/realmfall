import sparklesIcon from '../assets/icons/sparkles.svg';
import mouthWateringIcon from '../assets/icons/mouth-watering.svg';
import recentDeathIcon from '../assets/icons/recent-death.svg';
import restorationIcon from '../assets/icons/restoration.svg';
import waterskinIcon from '../assets/icons/waterskin.svg';

export function statusEffectIcon(effect: string) {
  if (effect === 'hunger') return mouthWateringIcon;
  if (effect === 'thirst') return waterskinIcon;
  if (effect === 'recentDeath') return recentDeathIcon;
  if (effect === 'restoration') return restorationIcon;
  return sparklesIcon;
}

export function statusEffectTint(effect: string, tone: 'buff' | 'debuff') {
  if (effect === 'hunger') return '#f97316';
  if (effect === 'thirst') return '#06b6d4';
  if (effect === 'recentDeath') return '#ef4444';
  if (effect === 'restoration') return '#22c55e';
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
