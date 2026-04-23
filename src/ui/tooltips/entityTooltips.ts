import { getSkillTags } from '../../game/content/tags';
import { professionRecipeOutputBonus } from '../../game/crafting';
import {
  gatheringBonusChance,
  gatheringYieldBonus,
  skillLevelThreshold,
} from '../../game/stateSelectors';
import {
  Skill,
  type Enemy,
  type SkillName,
  type StructureType,
  type Tile,
} from '../../game/stateTypes';
import { t } from '../../i18n';
import { buildEnemyTooltip, buildStructureTooltip } from '../tooltipContent';
import { type TooltipLine, tagTooltipLines } from './shared';

export function enemyTooltip(
  enemies: Enemy[],
  structure?: StructureType,
): { title: string; lines: TooltipLine[] } | null {
  return buildEnemyTooltip(enemies, structure, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: tagTooltipLines,
  });
}

export function structureTooltip(
  tile: Tile,
): { title: string; lines: TooltipLine[] } | null {
  return buildStructureTooltip(tile, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: tagTooltipLines,
  });
}

export function skillTooltip(skill: SkillName, level: number): TooltipLine[] {
  const nextLevelXp = skillLevelThreshold(level);
  const tags = tagTooltipLines(getSkillTags(skill));

  if (isGatheringSkill(skill)) {
    return [
      {
        kind: 'text',
        text: t('ui.skills.tooltip.gatheringDescription'),
      },
      {
        kind: 'stat',
        label: t('ui.skills.tooltip.baseYieldBonus'),
        value: `+${gatheringYieldBonus(level)}`,
        tone: 'item',
      },
      {
        kind: 'stat',
        label: t('ui.skills.tooltip.extraResourceChance'),
        value: `${Math.round(gatheringBonusChance(level) * 100)}%`,
        tone: 'item',
      },
      {
        kind: 'text',
        text: t('ui.skills.tooltip.nextLevelNeeds', { xp: nextLevelXp }),
      },
      ...tags,
    ];
  }

  return [
    {
      kind: 'text',
      text: t('ui.skills.tooltip.professionDescription'),
    },
    ...(skill === Skill.Cooking || skill === Skill.Smelting
      ? [
          {
            kind: 'stat' as const,
            label: t('ui.skills.tooltip.recipeOutputBonus'),
            value: `+${professionRecipeOutputBonus(skill, level)}`,
            tone: 'item' as const,
          },
        ]
      : [
          {
            kind: 'text' as const,
            text: t('ui.skills.tooltip.noRecipeScaling'),
          },
        ]),
    {
      kind: 'text',
      text: t('ui.skills.tooltip.nextLevelNeeds', { xp: nextLevelXp }),
    },
    ...tags,
  ];
}

function isGatheringSkill(skill: SkillName) {
  return (
    skill === Skill.Gathering ||
    skill === Skill.Logging ||
    skill === Skill.Mining ||
    skill === Skill.Skinning ||
    skill === Skill.Fishing
  );
}
