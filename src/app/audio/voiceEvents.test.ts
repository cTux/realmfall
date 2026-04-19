import { createGame, startCombat } from '../../game/state';
import { detectVoicePlaybackEvent } from './voiceEvents';

describe('detectVoicePlaybackEvent', () => {
  it('detects a new combat encounter', () => {
    const previous = createGame(2, 'voice-encounter-previous');
    const next = createGame(2, 'voice-encounter-next');
    next.combat = {
      coord: { q: 1, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: false,
      player: previous.combat?.player ?? {
        abilityIds: [],
        casting: null,
        cooldownEndsAt: {},
        globalCooldownEndsAt: 0,
        globalCooldownMs: 0,
      },
      enemies: {},
    };

    expect(detectVoicePlaybackEvent(previous, next)).toBe('combatEncounter');
  });

  it('detects player damage before other combat events', () => {
    const previous = createGame(2, 'voice-damage-previous');
    const next = createGame(2, 'voice-damage-next');
    next.player.hp = previous.player.hp - 4;
    next.logSequence = previous.logSequence + 1;
    next.logs = [
      {
        id: 'l-damage',
        kind: 'combat',
        text: '[Y1 D1 00:00] damage',
        turn: previous.turn,
      },
      ...previous.logs,
    ];

    expect(detectVoicePlaybackEvent(previous, next)).toBe('playerDamaged');
  });

  it('detects defeat from the recent-death status effect', () => {
    const previous = createGame(2, 'voice-death-previous');
    const next = createGame(2, 'voice-death-next');
    next.player.statusEffects = [{ id: 'recentDeath' }];

    expect(detectVoicePlaybackEvent(previous, next)).toBe('playerDeath');
  });

  it('detects rejected actions when only a system log changes', () => {
    const previous = createGame(2, 'voice-refusal-previous');
    const next = createGame(2, 'voice-refusal-next');
    next.logSequence = previous.logSequence + 1;
    next.logs = [
      {
        id: 'l-refusal',
        kind: 'system',
        text: '[Y1 D1 00:00] You cannot do that.',
        turn: previous.turn,
      },
      ...previous.logs,
    ];

    expect(detectVoicePlaybackEvent(previous, next)).toBe('actionRejected');
  });

  it('detects successful non-combat actions from meaningful loot changes', () => {
    const previous = createGame(2, 'voice-success-previous');
    const next = createGame(2, 'voice-success-next');
    next.player.inventory = [
      ...previous.player.inventory,
      { ...previous.player.inventory[0]!, id: 'new-item' },
    ];
    next.logSequence = previous.logSequence + 1;
    next.logs = [
      {
        id: 'l-success',
        kind: 'loot',
        text: '[Y1 D1 00:00] Loot acquired.',
        turn: previous.turn,
      },
      ...previous.logs,
    ];

    expect(detectVoicePlaybackEvent(previous, next)).toBe('actionSuccess');
  });

  it('detects player combat attacks from rich combat logs', () => {
    const previous = createGame(2, 'voice-attack-previous');
    const combatReady = createGame(2, 'voice-attack-ready');
    combatReady.combat = {
      coord: { q: 1, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: false,
      player: {
        abilityIds: [],
        casting: null,
        cooldownEndsAt: {},
        globalCooldownEndsAt: 0,
        globalCooldownMs: 0,
      },
      enemies: {
        'enemy-1,0-0': {
          abilityIds: [],
          casting: null,
          cooldownEndsAt: {},
          globalCooldownEndsAt: 0,
          globalCooldownMs: 0,
        },
      },
    };
    const next = startCombat(combatReady);

    expect(detectVoicePlaybackEvent(combatReady, next)).toBe('combatStart');

    const attackNext = {
      ...next,
      logSequence: next.logSequence + 1,
      logs: [
        {
          id: 'l-attack',
          kind: 'combat' as const,
          text: '[Y1 D1 00:00] You deal 5 damage.',
          turn: next.turn,
          richText: [
            { kind: 'text' as const, text: 'You deal ' },
            { kind: 'damage' as const, text: '5' },
          ],
        },
        ...next.logs,
      ],
    };

    expect(detectVoicePlaybackEvent(next, attackNext)).toBe('combatAttack');
    expect(detectVoicePlaybackEvent(previous, next)).not.toBe('combatAttack');
  });
});
