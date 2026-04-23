import { GAME_TAGS } from '../../tags';
import { getEnemyConfig, isAnimalEnemyType, pickEnemyConfig } from '../index';

describe('enemy content registry', () => {
  it('resolves configs only from canonical enemy type ids', () => {
    expect(getEnemyConfig('wolf')?.name).toBe('Wolf');
    expect(getEnemyConfig('Wolf')).toBeUndefined();
  });

  it('classifies animal enemies from canonical type ids', () => {
    expect(isAnimalEnemyType('wolf')).toBe(true);
    expect(isAnimalEnemyType('raider')).toBe(false);
  });

  it('keeps enemy taxonomy tags on the owning configs', () => {
    expect(getEnemyConfig('wolf')?.tags).toContain(GAME_TAGS.enemy.beast);
    expect(getEnemyConfig('raider')?.tags).toContain(GAME_TAGS.enemy.humanoid);
    expect(getEnemyConfig('gluttony')?.tags).toContain(
      GAME_TAGS.enemy.aberration,
    );
  });

  it('selects enemy spawns from the extracted terrain chooser', () => {
    expect(pickEnemyConfig('forest', 0, false).id).toBe('raider');
    expect(pickEnemyConfig('plains', 0.99, false).id).toBe('stag');
    expect(pickEnemyConfig('forest', 0.5, true).id).toBe('raider');
    expect(pickEnemyConfig('forest', 0.5, false, true).id).toBe('gluttony');
  });
});
