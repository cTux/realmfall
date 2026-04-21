import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  buildEnemyAbilityIds,
  buildEquippedAbilityIds,
  DEFAULT_ABILITY_ID,
} from './abilities';
import {
  buildGeneratedItemFromConfig,
  buildItemFromConfig,
} from './content/items';
import { GAME_TAGS } from './content/tags';
import { getPlayerStats } from './progression';
import { createGame } from './state';
import type { Item } from './types';

describe('ability loadouts', () => {
  it('assigns rarity-scaled enemy loadouts on top of Kick', () => {
    const uncommon = buildEnemyAbilityIds(
      {
        id: 'enemy-uncommon',
        rarity: 'uncommon',
        worldBoss: false,
        tags: [GAME_TAGS.enemy.beast],
      },
      'enemy-abilities-seed',
    );
    const rare = buildEnemyAbilityIds(
      {
        id: 'enemy-rare',
        rarity: 'rare',
        worldBoss: false,
        tags: [GAME_TAGS.enemy.humanoid],
      },
      'enemy-abilities-seed',
    );
    const worldBoss = buildEnemyAbilityIds(
      {
        id: 'enemy-world-boss',
        rarity: 'legendary',
        worldBoss: true,
        tags: [GAME_TAGS.enemy.aberration, GAME_TAGS.enemy.worldBoss],
      },
      'enemy-abilities-seed',
    );

    expect(uncommon).toHaveLength(2);
    expect(rare).toHaveLength(3);
    expect(worldBoss).toHaveLength(4);
    expect(uncommon[uncommon.length - 1]).toBe(DEFAULT_ABILITY_ID);
    expect(rare[rare.length - 1]).toBe(DEFAULT_ABILITY_ID);
    expect(worldBoss[worldBoss.length - 1]).toBe(DEFAULT_ABILITY_ID);
  });

  it('keeps Kick as the lowest-priority equipped combat ability', () => {
    const abilityIds = buildEquippedAbilityIds([
      { grantedAbilityId: 'fireball' } as Item,
      { grantedAbilityId: 'slash' } as Item,
    ]);

    expect(abilityIds.slice(0, -1)).toEqual(['fireball', 'slash']);
    expect(abilityIds[abilityIds.length - 1]).toBe(DEFAULT_ABILITY_ID);
  });

  it('gives every shipped ability a human-readable description', () => {
    expect(
      Object.values(ABILITIES).every(
        (ability) =>
          ability.description.length > 0 &&
          !ability.description.includes('ui.ability.') &&
          !ability.description.includes('game.ability.'),
      ),
    ).toBe(true);
  });

  it('keeps Kick free and requires mana for every other ability', () => {
    expect(ABILITIES.kick.manaCost).toBe(0);
    expect(
      Object.values(ABILITIES)
        .filter((ability) => ability.id !== DEFAULT_ABILITY_ID)
        .every((ability) => ability.manaCost >= 5),
    ).toBe(true);
  });

  it('surfaces equipped weapon abilities through player combat stats', () => {
    const game = createGame(2, 'weapon-ability-seed');
    const weapon = buildGeneratedItemFromConfig('generated-wand', {
      id: 'wand-with-spell',
      tier: 4,
      rarity: 'rare',
    });
    game.player.equipment.weapon = weapon;

    const stats = getPlayerStats(game.player);

    expect(weapon.grantedAbilityId).toBeTruthy();
    expect(stats.abilityIds).toContain(weapon.grantedAbilityId);
    expect(stats.abilityIds[stats.abilityIds.length - 1]).toBe(
      DEFAULT_ABILITY_ID,
    );
  });

  it('rolls generated shield and magical offhand abilities', () => {
    const shield = buildGeneratedItemFromConfig('generated-shield', {
      id: 'shield-with-skill',
      tier: 4,
      rarity: 'rare',
    });
    const magicalSphere = buildGeneratedItemFromConfig(
      'generated-magical-sphere',
      {
        id: 'sphere-with-skill',
        tier: 4,
        rarity: 'rare',
      },
    );

    expect(shield.grantedAbilityId).toBeTruthy();
    expect(magicalSphere.grantedAbilityId).toBeTruthy();
    expect(shield.grantedAbilityId).not.toBe(magicalSphere.grantedAbilityId);
  });

  it('surfaces equipped offhand abilities through player combat stats', () => {
    const game = createGame(2, 'offhand-ability-seed');
    const offhand = buildItemFromConfig('hide-buckler', {
      id: 'crafted-buckler-with-skill',
    });
    game.player.equipment.offhand = offhand;

    const stats = getPlayerStats(game.player);

    expect(offhand.grantedAbilityId).toBeTruthy();
    expect(stats.abilityIds).toContain(offhand.grantedAbilityId);
    expect(stats.abilityIds[stats.abilityIds.length - 1]).toBe(
      DEFAULT_ABILITY_ID,
    );
  });
});
