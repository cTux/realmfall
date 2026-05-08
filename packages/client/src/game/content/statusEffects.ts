import { StatusEffectTypeId } from './ids';
import type { StatusEffectId } from '../types';
import { GAME_TAGS, uniqueTags, type GameTag } from './tags';
import { STATUS_EFFECT_ICON_IDS } from './iconIds';

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
    icon: STATUS_EFFECT_ICON_IDS.hunger,
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
    icon: STATUS_EFFECT_ICON_IDS.thirst,
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
    icon: STATUS_EFFECT_ICON_IDS.recentDeath,
    tint: '#ef4444',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff, GAME_TAGS.status.death),
  },
  restoration: {
    id: StatusEffectTypeId.Restoration,
    icon: STATUS_EFFECT_ICON_IDS.restoration,
    tint: '#22c55e',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff, GAME_TAGS.status.restoration),
  },
  bleeding: {
    id: StatusEffectTypeId.Bleeding,
    icon: STATUS_EFFECT_ICON_IDS.bleeding,
    tint: '#ef4444',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  poison: {
    id: StatusEffectTypeId.Poison,
    icon: STATUS_EFFECT_ICON_IDS.poison,
    tint: '#84cc16',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  burning: {
    id: StatusEffectTypeId.Burning,
    icon: STATUS_EFFECT_ICON_IDS.burning,
    tint: '#f97316',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  chilling: {
    id: StatusEffectTypeId.Chilling,
    icon: STATUS_EFFECT_ICON_IDS.chilling,
    tint: '#38bdf8',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  power: {
    id: StatusEffectTypeId.Power,
    icon: STATUS_EFFECT_ICON_IDS.power,
    tint: '#fb7185',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff),
  },
  frenzy: {
    id: StatusEffectTypeId.Frenzy,
    icon: STATUS_EFFECT_ICON_IDS.frenzy,
    tint: '#f59e0b',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff),
  },
  guard: {
    id: StatusEffectTypeId.Guard,
    icon: STATUS_EFFECT_ICON_IDS.guard,
    tint: '#60a5fa',
    tone: 'buff',
    tags: uniqueTags(GAME_TAGS.status.buff),
  },
  weakened: {
    id: StatusEffectTypeId.Weakened,
    icon: STATUS_EFFECT_ICON_IDS.weakened,
    tint: '#f97316',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
  },
  shocked: {
    id: StatusEffectTypeId.Shocked,
    icon: STATUS_EFFECT_ICON_IDS.shocked,
    tint: '#facc15',
    tone: 'debuff',
    tags: uniqueTags(GAME_TAGS.status.debuff),
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
