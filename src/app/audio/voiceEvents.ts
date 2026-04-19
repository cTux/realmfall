import type { GameState, LogEntry } from '../../game/state';
import type { VoiceClipCategory } from './voiceLibrary';

export interface VoicePlaybackEventOptionDefinition {
  key: VoicePlaybackEventId;
  audioCategory: VoiceClipCategory;
  labelKey: string;
  descriptionKey: string;
}

export type VoicePlaybackEventId =
  | 'actionSuccess'
  | 'actionRejected'
  | 'combatEncounter'
  | 'combatEnd'
  | 'combatExertion'
  | 'combatStart'
  | 'combatAttack'
  | 'playerDamaged'
  | 'playerDeath'
  | 'worldEvent';

export const VOICE_PLAYBACK_EVENT_OPTIONS: VoicePlaybackEventOptionDefinition[] =
  [
    {
      key: 'combatEncounter',
      audioCategory: 'greeting',
      labelKey: 'ui.settings.audio.voice.events.combatEncounter.label',
      descriptionKey:
        'ui.settings.audio.voice.events.combatEncounter.description',
    },
    {
      key: 'combatStart',
      audioCategory: 'confirmation',
      labelKey: 'ui.settings.audio.voice.events.combatStart.label',
      descriptionKey: 'ui.settings.audio.voice.events.combatStart.description',
    },
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
      audioCategory: 'farewell',
      labelKey: 'ui.settings.audio.voice.events.combatEnd.label',
      descriptionKey: 'ui.settings.audio.voice.events.combatEnd.description',
    },
    {
      key: 'actionSuccess',
      audioCategory: 'completion',
      labelKey: 'ui.settings.audio.voice.events.actionSuccess.label',
      descriptionKey:
        'ui.settings.audio.voice.events.actionSuccess.description',
    },
    {
      key: 'actionRejected',
      audioCategory: 'refusal',
      labelKey: 'ui.settings.audio.voice.events.actionRejected.label',
      descriptionKey:
        'ui.settings.audio.voice.events.actionRejected.description',
    },
    {
      key: 'worldEvent',
      audioCategory: 'miscellaneous',
      labelKey: 'ui.settings.audio.voice.events.worldEvent.label',
      descriptionKey: 'ui.settings.audio.voice.events.worldEvent.description',
    },
  ];

export function detectVoicePlaybackEvent(
  previous: GameState,
  next: GameState,
): VoicePlaybackEventId | null {
  if (gainedRecentDeath(previous, next)) {
    return 'playerDeath';
  }

  if (playerTookDamage(previous, next)) {
    return 'playerDamaged';
  }

  if (!previous.combat && next.combat) {
    return 'combatEncounter';
  }

  if (previous.combat && !previous.combat.started && next.combat?.started) {
    return 'combatStart';
  }

  if (previous.combat && !next.combat) {
    return 'combatEnd';
  }

  if (
    previous.bloodMoonActive !== next.bloodMoonActive ||
    previous.harvestMoonActive !== next.harvestMoonActive
  ) {
    return 'worldEvent';
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

  const newestLog = newLogs[0];
  if (!newestLog) {
    return null;
  }

  if (
    newestLog.kind === 'system' &&
    !hasMeaningfulActionChange(previous, next)
  ) {
    return 'actionRejected';
  }

  if (
    (newestLog.kind === 'system' || newestLog.kind === 'loot') &&
    hasMeaningfulActionChange(previous, next)
  ) {
    return 'actionSuccess';
  }

  return null;
}

function getNewLogs(previous: GameState, next: GameState) {
  const count = Math.max(0, next.logSequence - previous.logSequence);
  return next.logs.slice(0, count);
}

function gainedRecentDeath(previous: GameState, next: GameState) {
  return (
    !hasStatusEffect(previous, 'recentDeath') &&
    hasStatusEffect(next, 'recentDeath')
  );
}

function hasStatusEffect(state: GameState, effectId: string) {
  return state.player.statusEffects.some((effect) => effect.id === effectId);
}

function playerTookDamage(previous: GameState, next: GameState) {
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

function hasMeaningfulActionChange(previous: GameState, next: GameState) {
  return (
    previous.turn !== next.turn ||
    previous.player.hp !== next.player.hp ||
    previous.player.mana !== next.player.mana ||
    previous.player.hunger !== next.player.hunger ||
    (previous.player.thirst ?? 100) !== (next.player.thirst ?? 100) ||
    !sameCoord(previous.player.coord, next.player.coord) ||
    !sameCoord(previous.homeHex, next.homeHex) ||
    previous.bloodMoonActive !== next.bloodMoonActive ||
    previous.harvestMoonActive !== next.harvestMoonActive ||
    !sameInventory(previous.player.inventory, next.player.inventory) ||
    !sameEquipment(previous.player.equipment, next.player.equipment) ||
    !sameStringList(
      previous.player.learnedRecipeIds,
      next.player.learnedRecipeIds,
    ) ||
    !sameCombat(previous.combat, next.combat)
  );
}

function sameCoord(
  left: GameState['player']['coord'],
  right: GameState['player']['coord'],
) {
  return left.q === right.q && left.r === right.r;
}

function sameInventory(
  left: GameState['player']['inventory'],
  right: GameState['player']['inventory'],
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const other = right[index];
    return (
      item.id === other?.id &&
      item.quantity === other.quantity &&
      item.locked === other.locked
    );
  });
}

function sameEquipment(
  left: GameState['player']['equipment'],
  right: GameState['player']['equipment'],
) {
  const keys = Array.from(
    new Set([...Object.keys(left), ...Object.keys(right)] as Array<
      keyof GameState['player']['equipment']
    >),
  ).sort();

  return keys.every((key) => {
    const leftItem = left[key];
    const rightItem = right[key];
    return leftItem?.id === rightItem?.id;
  });
}

function sameStringList(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameCombat(left: GameState['combat'], right: GameState['combat']) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.started === right.started &&
    sameCoord(left.coord, right.coord) &&
    sameStringList(left.enemyIds, right.enemyIds)
  );
}
