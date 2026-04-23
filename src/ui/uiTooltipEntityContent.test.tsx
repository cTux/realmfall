import { GameTag } from '../game/content/tags';
import { Skill } from '../game/types';
import { enemyTooltip, skillTooltip, structureTooltip } from './tooltips';

describe('ui tooltip entity content', () => {
  it('builds enemy, skill, and structure tooltip variants', () => {
    expect(enemyTooltip([], undefined)).toBeNull();

    const singleEnemy = enemyTooltip(
      [
        {
          id: 'wolf-1',
          name: 'Wolf',
          coord: { q: 0, r: 0 },
          rarity: 'uncommon',
          tier: 2,
          hp: 5,
          maxHp: 8,
          attack: 3,
          defense: 1,
          tags: [GameTag.EnemyHostile, GameTag.EnemyAnimal],
          xp: 4,
          elite: false,
        },
      ],
      'town',
    );
    expect(singleEnemy?.title).toBe('Wolf');
    expect(singleEnemy?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '2' },
      { kind: 'stat', label: 'Rarity', value: 'Uncommon' },
      { kind: 'stat', label: 'Enemies', value: '1' },
      {
        kind: 'text',
        text: 'Tags: enemy.hostile, enemy.animal',
        tone: 'subtle',
      },
    ]);

    const groupEnemy = enemyTooltip(
      [
        {
          id: 'raider-1',
          name: 'Raider',
          coord: { q: 1, r: 0 },
          rarity: 'rare',
          tier: 3,
          hp: 7,
          maxHp: 10,
          attack: 4,
          defense: 2,
          xp: 8,
          elite: true,
        },
        {
          id: 'wolf-2',
          name: 'Wolf',
          coord: { q: 1, r: 0 },
          rarity: 'common',
          tier: 2,
          hp: 4,
          maxHp: 6,
          attack: 3,
          defense: 1,
          xp: 5,
          elite: false,
        },
      ],
      'dungeon',
    );
    expect(groupEnemy?.title).toBe('Rift Ruin');
    expect(groupEnemy?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '3' },
      { kind: 'stat', label: 'Rarity', value: 'Rare' },
      { kind: 'stat', label: 'Enemies', value: '2' },
    ]);

    const groupedFieldEnemies = enemyTooltip(
      [
        {
          id: 'wolf-pack-1',
          name: 'Wolf',
          coord: { q: 1, r: 1 },
          rarity: 'common',
          tier: 2,
          hp: 6,
          maxHp: 6,
          attack: 3,
          defense: 1,
          xp: 5,
          elite: false,
        },
        {
          id: 'wolf-pack-2',
          name: 'Boar',
          coord: { q: 1, r: 1 },
          rarity: 'rare',
          tier: 3,
          hp: 8,
          maxHp: 8,
          attack: 4,
          defense: 2,
          xp: 8,
          elite: false,
        },
      ],
      'town',
    );
    expect(groupedFieldEnemies?.title).toBe('Wolf');
    expect(groupedFieldEnemies?.lines).toEqual([
      { kind: 'stat', label: 'Level', value: '3' },
      { kind: 'stat', label: 'Rarity', value: 'Rare' },
      { kind: 'stat', label: 'Enemies', value: '2' },
    ]);

    expect(skillTooltip(Skill.Logging, 12)).toContainEqual({
      kind: 'stat',
      label: 'Base Yield Bonus',
      value: '+2',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Logging, 12)).toContainEqual({
      kind: 'stat',
      label: 'Extra Resource Chance',
      value: '12%',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Cooking, 6)).toContainEqual({
      kind: 'stat',
      label: 'Recipe Output Bonus',
      value: '+1',
      tone: 'item',
    });
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Skill level does not change recipe costs, output, or quality directly yet.',
    });
    expect(skillTooltip(Skill.Crafting, 4)).toContainEqual({
      kind: 'text',
      text: 'Tags: skill.profession, skill.crafting',
      tone: 'subtle',
    });
    expect(skillTooltip(Skill.Smelting, 4)).toContainEqual({
      kind: 'text',
      text: 'Tags: skill.profession, skill.smelting',
      tone: 'subtle',
    });

    const treeTooltip = structureTooltip({
      coord: { q: 0, r: 0 },
      terrain: 'forest',
      structure: 'tree',
      structureHp: 3,
      structureMaxHp: 5,
      items: [],
      enemyIds: [],
    });
    expect(treeTooltip?.title).toBe('Tree');
    expect(treeTooltip?.lines).toEqual([
      { kind: 'text', text: 'A logging node that yields logs when harvested.' },
      {
        kind: 'text',
        text: 'Tags: structure.gathering, structure.tree, skill.gathering, skill.logging',
        tone: 'subtle',
      },
    ]);
  });
});
