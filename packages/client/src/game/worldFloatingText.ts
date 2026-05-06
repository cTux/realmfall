import type {
  Enemy,
  GameState,
  Player,
  WorldFloatingTextAnchor,
  WorldFloatingTextEvent,
} from './types';

export const MAX_WORLD_FLOATING_TEXT_EVENTS = 24;

export function appendWorldFloatingTextEvent(
  state: Pick<
    GameState,
    'logSequence' | 'worldFloatingTextEvents' | 'worldTimeMs'
  >,
  event: Omit<WorldFloatingTextEvent, 'createdAtMs' | 'id'>,
) {
  if (event.amount <= 0) {
    return null;
  }

  const nextEvent: WorldFloatingTextEvent = {
    ...event,
    id: `wft-${state.worldTimeMs}-${state.logSequence}-${state.worldFloatingTextEvents.length}`,
    createdAtMs: state.worldTimeMs,
    anchor: cloneWorldFloatingTextAnchor(event.anchor),
  };

  state.worldFloatingTextEvents = [
    ...state.worldFloatingTextEvents,
    nextEvent,
  ].slice(-MAX_WORLD_FLOATING_TEXT_EVENTS);

  return nextEvent;
}

export function createEnemyFloatingTextAnchor(
  enemy: Pick<Enemy, 'coord' | 'id'>,
): Extract<WorldFloatingTextAnchor, { kind: 'enemy' }> {
  return {
    kind: 'enemy',
    enemyId: enemy.id,
    coord: { ...enemy.coord },
  };
}

export function createPlayerFloatingTextAnchor(
  player: Pick<Player, 'coord'>,
): Extract<WorldFloatingTextAnchor, { kind: 'player' }> {
  return {
    kind: 'player',
    coord: { ...player.coord },
  };
}

export function cloneWorldFloatingTextAnchor(anchor: WorldFloatingTextAnchor) {
  return anchor.kind === 'player'
    ? {
        kind: 'player' as const,
        coord: { ...anchor.coord },
      }
    : {
        kind: 'enemy' as const,
        enemyId: anchor.enemyId,
        coord: { ...anchor.coord },
      };
}
