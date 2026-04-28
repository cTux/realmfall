import { GameTag } from '../game/content/tags';
import { getStatusEffectDefinition } from '../game/content/statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from './tooltips';

describe('ui tooltip ability content', () => {
  it('builds ability tooltip lines for damage, status, and tags', () => {
    expect(
      abilityTooltipLines(
        {
          description: 'Targets one enemy. Deals melee damage.',
          category: 'attacking',
          manaCost: 0,
          cooldownMs: 1000,
          castTimeMs: 0,
          effects: [{ kind: 'damage', powerMultiplier: 1.2, flatPower: 2 }],
          tags: [
            GameTag.AbilityCombat,
            GameTag.AbilityMelee,
            GameTag.AbilityPhysical,
          ],
        },
        'enemy',
        10,
      ),
    ).toContainEqual({
      kind: 'text',
      text: 'Targets one enemy. Deals melee damage.',
    });

    expect(
      abilityTooltipLines(
        {
          description: 'Targets all enemies. Inflicts Shocked.',
          category: 'attacking',
          manaCost: 2,
          cooldownMs: 4800,
          castTimeMs: 250,
          effects: [
            {
              kind: 'applyStatus',
              statusEffectId: 'shocked',
              value: 16,
              durationMs: 8_000,
            },
          ],
          tags: [GameTag.AbilityCombat],
        },
        'allEnemies',
        10,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Effect',
      value: 'Shocked',
      icon: getStatusEffectDefinition('shocked')?.icon,
      iconTint: getStatusEffectDefinition('shocked')?.tint,
      tone: 'negative',
    });

    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Grants Guard.',
        category: 'supportive',
        manaCost: 5,
        cooldownMs: 4300,
        castTimeMs: 200,
        effects: [
          {
            kind: 'applyStatus',
            statusEffectId: 'guard',
            value: 28,
            durationMs: 4_000,
          },
        ],
        tags: [GameTag.AbilityCombat],
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Effect',
      value: 'Guard',
      icon: getStatusEffectDefinition('guard')?.icon,
      iconTint: getStatusEffectDefinition('guard')?.tint,
      tone: 'item',
    });

    expect(
      abilityTooltipLines(
        {
          description: 'Targets all enemies. Inflicts Shocked.',
          category: 'attacking',
          manaCost: 2,
          cooldownMs: 4800,
          castTimeMs: 250,
          effects: [
            {
              kind: 'applyStatus',
              statusEffectId: 'shocked',
              value: 16,
              durationMs: 8_000,
            },
          ],
          tags: [GameTag.AbilityCombat],
        },
        'allEnemies',
        10,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '0',
    });

    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Restores health.',
        category: 'supportive',
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
        effects: [{ kind: 'heal', powerMultiplier: 1.2 }],
        tags: [
          GameTag.AbilityCombat,
          GameTag.AbilityMelee,
          GameTag.AbilityPhysical,
        ],
      }),
    ).toContainEqual({
      kind: 'text',
      text: 'Tags: ability.combat, ability.melee, ability.physical',
      tone: 'subtle',
    });
    expect(
      abilityTooltipLines({
        description: 'Targets yourself. Restores health.',
        category: 'supportive',
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
        effects: [{ kind: 'heal', powerMultiplier: 1.2 }],
        tags: [GameTag.AbilityCombat],
      }).some((line) => line.label === 'Damage'),
    ).toBe(false);
  });

  it('builds status effect tooltip lines for buffs and debuffs', () => {
    expect(
      statusEffectTooltipLines('restoration', 'buff', [
        {
          kind: 'stat',
          label: 'HP',
          value: '+1% / s',
          tone: 'positive',
        },
      ]),
    ).toContainEqual({
      kind: 'text',
      text: 'Tags: status.buff, status.restoration',
      tone: 'subtle',
    });
    expect(
      statusEffectTooltipLines('burning', 'debuff', [], {
        id: 'burning',
        value: 3,
        stacks: 2,
        tickIntervalMs: 1000,
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '6 / 1s',
      tone: 'negative',
    });
    expect(
      statusEffectTooltipLines('poison', 'debuff', [], {
        id: 'poison',
        stacks: 3,
        tickIntervalMs: 2000,
      }),
    ).toContainEqual({
      kind: 'stat',
      label: 'Damage',
      value: '3% max HP / 2s',
      tone: 'negative',
    });
    expect(
      statusEffectTooltipLines(
        'burning',
        'debuff',
        [],
        {
          id: 'burning',
          value: 2,
          expiresAt: 120_000,
        },
        15_000,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Time to Decay',
      value: '01:45',
      tone: 'negative',
    });
    expect(
      statusEffectTooltipLines(
        'guard',
        'buff',
        [],
        {
          id: 'guard',
          expiresAt: 120_000,
        },
        15_000,
      ),
    ).toContainEqual({
      kind: 'stat',
      label: 'Time to Decay',
      value: '01:45',
      tone: 'item',
    });
    expect(statusEffectTooltipLines('guard', 'buff')[0]).toEqual({
      kind: 'text',
      text: 'Guard raises defense for as long as the effect holds.',
    });
    expect(statusEffectTooltipLines('recentDeath', 'debuff')[0]).toEqual({
      kind: 'text',
      text: 'Death clings to you, reducing your maximum hitpoints by 10%. Faction healers can clear this wound.',
    });
    expect(statusEffectTooltipLines('weakened', 'debuff')[0]).toEqual({
      kind: 'text',
      text: 'Weakened lowers attack while the effect remains.',
    });
    expect(statusEffectTooltipLines('shocked', 'debuff')[0]).toEqual({
      kind: 'text',
      text: 'Shocked lowers defense while crackling mana hangs on you.',
    });
  });
});
