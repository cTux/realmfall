import { SKILL_NAMES, type SkillName } from './types';

export function createSkillRecord<T>(
  getValue: (skill: SkillName) => T,
): Record<SkillName, T> {
  return Object.fromEntries(
    SKILL_NAMES.map((skill) => [skill, getValue(skill)] as const),
  ) as Record<SkillName, T>;
}
