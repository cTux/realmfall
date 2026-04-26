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
