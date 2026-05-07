import type { LogEntry, LogRichSegment } from '../../../../../game/stateTypes';

export function createSystemLog(params: {
  id: string;
  turn: number;
  text: string;
}) {
  return {
    id: params.id,
    kind: 'system',
    text: params.text,
    turn: params.turn,
  } as LogEntry;
}

export function createCombatLog(params: {
  id: string;
  turn: number;
  text: string;
  richText: LogRichSegment[];
}) {
  return {
    id: params.id,
    kind: 'combat',
    text: params.text,
    turn: params.turn,
    richText: params.richText,
  } as LogEntry;
}

export function longLogs(total: number) {
  return Array.from({ length: total }, (_, index) => ({
    id: `log-${index + 1}`,
    kind: 'system' as const,
    text: `[Year 1, Day 1, ${String(index).padStart(2, '0')}:00] Event #${String(index + 1).padStart(3, '0')}`,
    turn: index + 1,
  })).reverse();
}
