import type { SkillName } from '../../types';
import { GAME_TAGS, getSkillTags, uniqueTags, type GameTag } from '../tags';

export function buildUtilityStructureTags(...tags: GameTag[]) {
  return uniqueTags(GAME_TAGS.structure.utility, ...tags);
}

export function buildCraftingStructureTags(...tags: GameTag[]) {
  return uniqueTags(GAME_TAGS.structure.crafting, ...tags);
}

export function buildSettlementStructureTags(...tags: GameTag[]) {
  return uniqueTags(GAME_TAGS.structure.settlement, ...tags);
}

export function buildCombatStructureTags(...tags: GameTag[]) {
  return uniqueTags(GAME_TAGS.structure.combat, ...tags);
}

export function buildGatheringStructureTags(
  skill: SkillName,
  ...tags: GameTag[]
) {
  return uniqueTags(
    GAME_TAGS.structure.gathering,
    ...tags,
    ...getSkillTags(skill),
  );
}

export type GatheringByproductKind = 'tree' | 'ore' | 'string';

export function getGatheringByproductKind(
  structureTags: readonly GameTag[] | undefined,
) {
  if (!structureTags) {
    return null;
  }

  if (structureTags.includes(GAME_TAGS.structure.ore)) {
    return 'ore';
  }

  if (structureTags.includes(GAME_TAGS.structure.tree)) {
    return 'tree';
  }

  if (structureTags.includes(GAME_TAGS.structure.byproductString)) {
    return 'string';
  }

  return null;
}

export function buildFlaxGatheringStructureTags(
  skill: SkillName,
  ...tags: GameTag[]
) {
  return buildGatheringStructureTags(
    skill,
    ...tags,
    GAME_TAGS.structure.byproductString,
  );
}
