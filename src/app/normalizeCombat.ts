import type { GameState } from '../game/stateTypes';
import {
  isCooldownMap,
  isFiniteNumber,
  isRecord,
  isStringArray,
  normalizeHexCoord,
} from './normalizeShared';

export function normalizeCombatState(value: unknown) {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const player = normalizeCombatActorState(value.player);
  const enemies = normalizeCombatActors(value.enemies);

  if (
    !coord ||
    !player ||
    !enemies ||
    !isStringArray(value.enemyIds) ||
    typeof value.started !== 'boolean'
  ) {
    return null;
  }

  return {
    coord,
    enemyIds: [...value.enemyIds],
    started: value.started,
    player,
    enemies,
  };
}

function normalizeCombatActors(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value).map(([key, actor]) => {
    const normalizedActor = normalizeCombatActorState(actor);
    return normalizedActor ? ([key, normalizedActor] as const) : null;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return Object.fromEntries(
    entries as Array<
      readonly [string, NonNullable<GameState['combat']>['player']]
    >,
  );
}

function normalizeCombatActorState(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isStringArray(value.abilityIds) ||
    !isFiniteNumber(value.globalCooldownMs) ||
    !isFiniteNumber(value.globalCooldownEndsAt) ||
    !isCooldownMap(value.cooldownEndsAt)
  ) {
    return null;
  }

  if (
    (value.effectiveGlobalCooldownMs !== undefined &&
      !isFiniteNumber(value.effectiveGlobalCooldownMs)) ||
    (value.effectiveCooldownMs !== undefined &&
      !isCooldownMap(value.effectiveCooldownMs))
  ) {
    return null;
  }

  const casting = normalizeCombatCastState(value.casting);
  if (value.casting !== null && value.casting !== undefined && !casting) {
    return null;
  }

  return {
    abilityIds: [...value.abilityIds],
    globalCooldownMs: value.globalCooldownMs,
    ...(value.effectiveGlobalCooldownMs === undefined
      ? {}
      : { effectiveGlobalCooldownMs: value.effectiveGlobalCooldownMs }),
    globalCooldownEndsAt: value.globalCooldownEndsAt,
    cooldownEndsAt: { ...value.cooldownEndsAt },
    ...(value.effectiveCooldownMs === undefined
      ? {}
      : { effectiveCooldownMs: { ...value.effectiveCooldownMs } }),
    casting: casting ?? null,
  };
}

function normalizeCombatCastState(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.abilityId !== 'string' ||
    typeof value.targetId !== 'string' ||
    !isFiniteNumber(value.endsAt)
  ) {
    return null;
  }

  return {
    abilityId: value.abilityId,
    targetId: value.targetId,
    endsAt: value.endsAt,
  };
}
