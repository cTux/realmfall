import type { GameState, LogEntry } from '../../game/stateTypes';
import type { VoiceClipCategory } from './voiceLibrary';

export interface VoicePlaybackEventOptionDefinition {
  key: VoicePlaybackEventId;
  audioCategory: VoiceClipCategory;
  labelKey: string;
  descriptionKey: string;
}

export type VoicePlaybackEventId =
  | 'combatEnd'
  | 'combatExertion'
  | 'combatAttack'
  | 'playerDamaged'
  | 'playerDeath';

export const VOICE_PLAYBACK_EVENT_OPTIONS: VoicePlaybackEventOptionDefinition[] =
  [
    {
      key: 'combatAttack',
      audioCategory: 'shouting',
      labelKey: 'ui.settings.audio.voice.events.combatAttack.label',
      descriptionKey: 'ui.settings.audio.voice.events.combatAttack.description',
    },
    {
      key: 'combatExertion',
      audioCategory: 'grunting',
      labelKey: 'ui.settings.audio.voice.events.combatExertion.label',
      descriptionKey:
        'ui.settings.audio.voice.events.combatExertion.description',
    },
    {
      key: 'playerDamaged',
      audioCategory: 'damage',
      labelKey: 'ui.settings.audio.voice.events.playerDamaged.label',
      descriptionKey:
        'ui.settings.audio.voice.events.playerDamaged.description',
    },
    {
      key: 'playerDeath',
      audioCategory: 'death',
      labelKey: 'ui.settings.audio.voice.events.playerDeath.label',
      descriptionKey: 'ui.settings.audio.voice.events.playerDeath.description',
    },
    {
      key: 'combatEnd',
      audioCategory: 'completion',
      labelKey: 'ui.settings.audio.voice.events.combatEnd.label',
      descriptionKey: 'ui.settings.audio.voice.events.combatEnd.description',
    },
  ];

export interface VoicePlaybackEventState {
  combat: GameState['combat'];
  logs: GameState['logs'];
  logSequence: GameState['logSequence'];
  player: Pick<GameState['player'], 'hp' | 'statusEffects'>;
}

export function selectVoicePlaybackEventState(
  game: GameState,
): VoicePlaybackEventState {
  return {
    combat: game.combat,
    logs: game.logs,
    logSequence: game.logSequence,
    player: {
      hp: game.player.hp,
      statusEffects: game.player.statusEffects,
    },
  };
}

export function detectVoicePlaybackEvent(
  previous: VoicePlaybackEventState,
  next: VoicePlaybackEventState,
): VoicePlaybackEventId | null {
  if (gainedRecentDeath(previous, next)) {
    return 'playerDeath';
  }

  if (playerTookDamage(previous, next)) {
    return 'playerDamaged';
  }

  if (previous.combat && !next.combat) {
    return 'combatEnd';
  }

  const newLogs = getNewLogs(previous, next);
  if (newLogs.length === 0) {
    return null;
  }

  if (newLogs.some(isPlayerCombatActionLog)) {
    return 'combatAttack';
  }

  if (newLogs.some(isCombatExertionLog)) {
    return 'combatExertion';
  }

  return null;
}

function getNewLogs(
  previous: VoicePlaybackEventState,
  next: VoicePlaybackEventState,
) {
  const count = Math.max(0, next.logSequence - previous.logSequence);
  return next.logs.slice(0, count);
}

function gainedRecentDeath(
  previous: VoicePlaybackEventState,
  next: VoicePlaybackEventState,
) {
  return (
    !hasStatusEffect(previous, 'recentDeath') &&
    hasStatusEffect(next, 'recentDeath')
  );
}

function hasStatusEffect(state: VoicePlaybackEventState, effectId: string) {
  return state.player.statusEffects.some((effect) => effect.id === effectId);
}

function playerTookDamage(
  previous: VoicePlaybackEventState,
  next: VoicePlaybackEventState,
) {
  return next.player.hp < previous.player.hp;
}

function isPlayerCombatActionLog(log: LogEntry) {
  const firstText = getFirstRichTextValue(log);
  return (
    log.kind === 'combat' &&
    (firstText.startsWith('You deal ') ||
      firstText.startsWith('You restore ') ||
      firstText.startsWith('You apply '))
  );
}

function isCombatExertionLog(log: LogEntry) {
  const firstText = getFirstRichTextValue(log);
  return (
    log.kind === 'combat' &&
    (firstText.startsWith('You dodge ') ||
      firstText.startsWith('You block ') ||
      firstText.startsWith('You fully absorb ') ||
      firstText.startsWith('You shrug off '))
  );
}

function getFirstRichTextValue(log: LogEntry) {
  return log.richText?.[0]?.text ?? '';
}
