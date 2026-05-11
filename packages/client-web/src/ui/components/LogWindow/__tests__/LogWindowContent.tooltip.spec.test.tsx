import { GameTag } from '@realmfall/core/game/content/tags';
import { LogWindowContentTestkit } from './LogWindowContentTestkit';
import { createCombatLog } from './utils/fixtures';

describe('LogWindowContent tooltip', () => {
  let testkit: LogWindowContentTestkit;

  beforeEach(() => {
    testkit = new LogWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows status effect source icons with hover details', async () => {
    await testkit.actions.render([
      createCombatLog({
        id: 'log-1',
        turn: 1,
        text: 'You apply Shocked with Fireball.',
        richText: [
          { kind: 'text', text: 'You apply ' },
          {
            kind: 'source',
            text: 'Shocked',
            source: {
              kind: 'statusEffect',
              effectId: 'shocked',
              tone: 'debuff',
            },
          },
          { kind: 'text', text: ' with ' },
          {
            kind: 'source',
            text: 'Fireball',
            source: {
              kind: 'ability',
              abilityId: 'fireball',
            },
          },
          { kind: 'text', text: '.' },
        ],
      }),
    ]);

    await testkit.expect.segmentExists('Shocked');
    await testkit.expect.segmentHasIcon('Shocked');
    await testkit.actions.hoverSegment('Shocked');
    await testkit.expect.hoveredWithColor('Shocked', 'rgba(239, 68, 68, 0.9)');
    await testkit.actions.unhoverSegment('Shocked');
    await testkit.expect.leaveCalled();
  });

  it('shows hover details for enemy entities and combat stat sources', async () => {
    await testkit.actions.render([
      createCombatLog({
        id: 'log-entity-tooltip',
        turn: 1,
        text: 'Marauder critically hits you. You are healed for 6 through Lifesteal.',
        richText: [
          {
            kind: 'entity',
            text: 'Marauder',
            rarity: 'rare',
            enemy: {
              id: 'enemy-1',
              name: 'Marauder',
              coord: { q: 0, r: 0 },
              tier: 3,
              hp: 20,
              maxHp: 20,
              attack: 12,
              defense: 4,
              xp: 1,
              elite: false,
              abilityIds: ['fireball'],
              statusEffects: [],
              rarity: 'rare',
              tags: [GameTag.EnemyHumanoid],
            },
          },
          { kind: 'text', text: ' critically hits you. You are healed for ' },
          { kind: 'healing', text: '6' },
          { kind: 'text', text: ' through ' },
          {
            kind: 'source',
            text: 'Lifesteal',
            source: {
              kind: 'secondaryStat',
              stat: 'lifestealAmount',
            },
          },
          { kind: 'text', text: '.' },
        ],
      }),
      createCombatLog({
        id: 'log-stat-tooltip',
        turn: 2,
        text: 'You are healed for 6 through Lifesteal.',
        richText: [
          { kind: 'text', text: 'You are healed for ' },
          { kind: 'healing', text: '6' },
          { kind: 'text', text: ' through ' },
          {
            kind: 'source',
            text: 'Lifesteal',
            source: {
              kind: 'secondaryStat',
              stat: 'lifestealAmount',
            },
          },
          { kind: 'text', text: '.' },
        ],
      }),
    ]);

    await testkit.actions.hoverSegment('Marauder');
    await testkit.expect.hoverCallForTitle('Marauder');

    await testkit.actions.hoverSegment('Lifesteal');
    await testkit.expect.hoverCallForTitle('Lifesteal');
  });
});
