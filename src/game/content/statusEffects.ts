import recentDeathIcon from '../../assets/icons/recent-death.svg';
import restorationIcon from '../../assets/icons/restoration.svg';
import mouthWateringIcon from '../../assets/icons/mouth-watering.svg';
import waterskinIcon from '../../assets/icons/waterskin.svg';
import bleedingIcon from '../../assets/icons/status-bleeding.svg';
import poisonIcon from '../../assets/icons/status-poison.svg';
import burningIcon from '../../assets/icons/status-burning.svg';
import chillingIcon from '../../assets/icons/status-chilling.svg';
import powerIcon from '../../assets/icons/status-power.svg';
import frenzyIcon from '../../assets/icons/status-frenzy.svg';
import { StatusEffectTypeId } from './ids';
import type { StatusEffectId } from '../types';
import { GAME_TAGS, uniqueTags, type GameTag } from './tags';

export interface StatusEffectDefinition {
  id: StatusEffectId;
  icon: string;
  tint: string;
  tone: 'buff' | 'debuff';
  tags: GameTag[];
}

export const STATUS_EFFECT_DEFINITIONS: Record<
  StatusEffectId,
  StatusEffectDefinition
> = {
  hunger: {
    id: StatusEffectTypeId.Hunger,
    icon: mouthWateringIcon,
    tint: '#f97316',
    tone: 'debuff',
    tags: uniqueTags(
      GAME_TAGS.status.debuff,
      GAME_TAGS.status.survival,
      GAME_TAGS.status.hunger,
    ),
  },
  thirst: {
    id: StatusEffectTypeId.Thirst,
    icon: waterskinIcon,
    tint: '#06b6d4',
    tone: 'debuff',
    tags: uniqueTags(
      GAME_TAGS.status.debuff,
      GAME_TAGS.status.survival,
      GAME_TAGS.status.thirst,
    ),
  },
  recentDeath: {
    id: StatusEffectTypeId.RecentDeath,
    icon: recentDeathIcon,
    tint: '#ef4444',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff, GAME_TAGS.status.death),
  },
  restoration: {
    id: StatusEffectTypeId.Restoration,
    icon: restorationIcon,
    tint: '#22c55e',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff, GAME_TAGS.status.restoration),
  },
  bleeding: {
    id: StatusEffectTypeId.Bleeding,
    icon: bleedingIcon,
    tint: '#ef4444',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  poison: {
    id: StatusEffectTypeId.Poison,
    icon: poisonIcon,
    tint: '#84cc16',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  burning: {
    id: StatusEffectTypeId.Burning,
    icon: burningIcon,
    tint: '#f97316',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  chilling: {
    id: StatusEffectTypeId.Chilling,
    icon: chillingIcon,
    tint: '#38bdf8',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  power: {
    id: StatusEffectTypeId.Power,
    icon: powerIcon,
    tint: '#fb7185',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff),
  },
  frenzy: {
    id: StatusEffectTypeId.Frenzy,
    icon: frenzyIcon,
    tint: '#f59e0b',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff),
  },
};

export function getStatusEffectDefinition(id: StatusEffectId) {
  return STATUS_EFFECT_DEFINITIONS[id];
}

export function getStatusEffectTags(id: StatusEffectId) {
  return getStatusEffectDefinition(id)?.tags ?? [];
}

export function hasStatusEffectTag(
  effect: Pick<{ id: StatusEffectId; tags?: GameTag[] }, 'id' | 'tags'>,
  tag: GameTag,
) {
  return (effect.tags ?? getStatusEffectTags(effect.id)).includes(tag);
}
