import { CombatWindowContentTestkit } from './CombatWindowContentTestkit';
import {
  createDefaultCombat,
  createDefaultEnemies,
  createDefaultPlayerParty,
  WORLD_TIME_MS,
} from './utils/fixtures';
import { t } from '../../../../i18n';

describe('CombatWindowContent tooltip', () => {
  let testkit: CombatWindowContentTestkit;

  beforeEach(() => {
    testkit = new CombatWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows the enemy stat sheet when hovering a non-player HP bar', async () => {
    await testkit.actions.render({
      combat: createDefaultCombat(WORLD_TIME_MS),
      playerParty: createDefaultPlayerParty(WORLD_TIME_MS),
      enemies: createDefaultEnemies(),
    });

    await testkit.actions.hoverEntityBar('Wolf Lv 2');

    await testkit.expect.primaryDetailForBar('Wolf Lv 2', {
      color: 'rgba(248, 113, 113, 0.9)',
      lines: [
        {
          kind: 'text',
          text: t('ui.hero.statSheet.primary'),
          tone: 'section',
        },
        {
          kind: 'stat',
          label: t('ui.tooltip.maxHealth'),
          value: '34',
        },
        {
          kind: 'stat',
          label: t('ui.hero.attack'),
          value: '11',
        },
        {
          kind: 'stat',
          label: t('ui.hero.defense'),
          value: '9',
        },
        {
          kind: 'text',
          text: t('ui.hero.statSheet.secondary'),
          tone: 'section',
        },
        {
          kind: 'stat',
          label: t('ui.hero.effect.attackSpeed'),
          value: '20%',
        },
        {
          kind: 'stat',
          label: 'Critical Strike Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Critical Strike Damage',
          value: '150%',
        },
        {
          kind: 'stat',
          label: 'Dodge Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Suppress Damage Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Suppress Damage Reduction',
          value: '50%',
        },
      ],
    });
  });

  it('keeps the player HP bar tooltip as the basic combat-health description', async () => {
    await testkit.actions.render({
      combat: createDefaultCombat(WORLD_TIME_MS),
      playerParty: createDefaultPlayerParty(WORLD_TIME_MS),
      enemies: createDefaultEnemies(),
    });

    await testkit.actions.hoverEntityBar('Player Lv 7');

    await testkit.expect.primaryDetailForBar(t('ui.hero.hp'), {
      color: 'rgba(248, 113, 113, 0.9)',
      lines: [{ kind: 'text', text: t('ui.tooltip.bar.combatHp') }],
    });
  });
});
