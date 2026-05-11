import { createCombatActorState } from '@realmfall/core/game/combat';
import { CombatWindowContentTestkit } from './CombatWindowContentTestkit';
import {
  createDefaultCombat,
  createDefaultEnemies,
  createDefaultPlayerParty,
  WORLD_TIME_MS,
} from './utils/fixtures';

describe('CombatWindowContent cooldowns', () => {
  let testkit: CombatWindowContentTestkit;

  beforeEach(() => {
    testkit = new CombatWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('disables combat abilities on cooldown without rendering overlays or cast bars', async () => {
    const enemyActor = createCombatActorState(WORLD_TIME_MS, ['kick']);
    enemyActor.globalCooldownEndsAt = WORLD_TIME_MS + 1_000;
    enemyActor.cooldownEndsAt.kick = WORLD_TIME_MS + 1_000;
    enemyActor.casting = {
      abilityId: 'kick',
      targetId: 'player',
      endsAt: WORLD_TIME_MS + 500,
    };

    await testkit.actions.render({
      combat: {
        ...createDefaultCombat(WORLD_TIME_MS),
        enemies: {
          ...createDefaultCombat(WORLD_TIME_MS).enemies,
          'enemy-1': enemyActor,
        },
      },
      playerParty: createDefaultPlayerParty(WORLD_TIME_MS),
      enemies: createDefaultEnemies(),
    });

    await testkit.expect.abilityButtonDisabled('Wolf Lv 2', 'Kick');
    await testkit.expect.barStackItemCount('Wolf Lv 2', 2);
  });

  it('prefers the live world clock store time over the prop fallback for cooldown state', async () => {
    const enemyActor = createCombatActorState(WORLD_TIME_MS, ['kick']);
    enemyActor.globalCooldownEndsAt = WORLD_TIME_MS + 500;
    enemyActor.cooldownEndsAt.kick = WORLD_TIME_MS + 500;
    testkit.actions.setWorldClockTime(WORLD_TIME_MS + 1_000);

    await testkit.actions.render({
      combat: {
        ...createDefaultCombat(WORLD_TIME_MS),
        enemies: {
          ...createDefaultCombat(WORLD_TIME_MS).enemies,
          'enemy-1': enemyActor,
        },
      },
      playerParty: createDefaultPlayerParty(WORLD_TIME_MS),
      enemies: createDefaultEnemies(),
      worldTimeMs: WORLD_TIME_MS,
    });

    await testkit.expect.worldClockUsesLiveTime('Wolf Lv 2', 'Kick');
  });
});
