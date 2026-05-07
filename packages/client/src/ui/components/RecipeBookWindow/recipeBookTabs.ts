import { Skill } from '../../../game/stateTypes';
import { formatSkillLabel } from '../../../i18n/labels';

export const RECIPE_BOOK_TAB_ORDER: readonly Skill[] = [
  Skill.Hand,
  Skill.Cooking,
  Skill.Smelting,
  Skill.Crafting,
] as const;

export const RECIPE_BOOK_VIRTUAL_ROW_ESTIMATE = 110;
export const RECIPE_BOOK_VIRTUAL_INITIAL_RECT = { height: 280, width: 0 };

export const getDefaultRecipeSkill = (
  tabs: readonly Skill[],
  preferredSkill: Skill | null,
) => {
  if (preferredSkill && tabs.includes(preferredSkill)) {
    return preferredSkill;
  }

  return tabs.includes(Skill.Hand) ? Skill.Hand : (tabs[0] ?? Skill.Hand);
};

export const formatRecipeBookTabLabel = (skill: Skill) => {
  const label = formatSkillLabel(skill);
  if (label.length === 0) return label;
  return label[0].toUpperCase() + label.slice(1);
};
