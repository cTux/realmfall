import { describe, expect, it } from 'vitest';
import { buildItemFromConfig } from './content/items';
import { createCombatState, startCombat } from './stateCombat';
import { createGame } from './stateFactory';
import { equipItem, unequipItem } from './stateItemActionsTestkit';

function createEncounterState() {
  const game = createGame(3, 'state-item-actions-combat-sync');
  const enemyId = 'enemy-2,0-0';
  const coord = { q: 2, r: 0 } as const;

  game.player.coord = { q: 1, r: 0 };
  game.tiles['2,0'] = {
    coord,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [enemyId],
  };
  game.enemies[enemyId] = {
    id: enemyId,
    name: 'Training Dummy',
    coord,
    tier: 1,
    hp: 200,
    maxHp: 200,
    attack: 0,
    defense: 0,
    xp: 1,
    elite: false,
    statusEffects: [],
    abilityIds: ['kick'],
  };

  return { coord, enemyId, game };
}

describe('state item actions', () => {
  it('syncs granted combat abilities when equipping after an encounter has been created', () => {
    const { coord, enemyId, game } = createEncounterState();
    const weapon = buildItemFromConfig('town-knife', {
      id: 'combat-town-knife',
    });

    game.player.inventory.push(weapon);
    game.combat = createCombatState(game, coord, [enemyId], game.worldTimeMs);

    expect(game.combat?.player.abilityIds).toEqual(['kick']);

    const equipped = equipItem(game, weapon.id);

    expect(equipped.combat?.player.abilityIds).toEqual(['slash', 'kick']);

    const started = startCombat(equipped);

    expect(started.player.mana).toBe(7);
    expect(started.combat?.player.cooldownEndsAt.slash ?? 0).toBeGreaterThan(0);
    expect(started.combat?.player.cooldownEndsAt.kick).toBeUndefined();
  });

  it('removes granted combat abilities when unequipping during an encounter', () => {
    const { coord, enemyId, game } = createEncounterState();
    const weapon = buildItemFromConfig('town-knife', {
      id: 'equipped-town-knife',
    });

    game.player.equipment.weapon = weapon;
    game.combat = createCombatState(game, coord, [enemyId], game.worldTimeMs);

    expect(game.combat?.player.abilityIds).toEqual(['slash', 'kick']);

    const unequipped = unequipItem(game, 'weapon');

    expect(unequipped.combat?.player.abilityIds).toEqual(['kick']);
  });
});
