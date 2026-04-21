import { getEnemyConfig, isAnimalEnemyType } from '../index';

describe('enemy content registry', () => {
  it('resolves configs only from canonical enemy type ids', () => {
    expect(getEnemyConfig('wolf')?.name).toBe('Wolf');
    expect(getEnemyConfig('Wolf')).toBeUndefined();
  });

  it('classifies animal enemies from canonical type ids', () => {
    expect(isAnimalEnemyType('wolf')).toBe(true);
    expect(isAnimalEnemyType('raider')).toBe(false);
  });
});
