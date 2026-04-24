import { createGame } from '../../../game/stateFactory';
import { createLoggedGameTransition } from './useLoggedGameCommand';

describe('createLoggedGameTransition', () => {
  it('adds a command log when the transition changes state', () => {
    const game = createGame(2, 'logged-command-change');
    const run = createLoggedGameTransition({
      describe: () => 'You command: start combat.',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    const next = run(game);

    expect(next.logs[0]?.kind).toBe('command');
    expect(next.logs[0]?.text).toContain('You command: start combat.');
  });

  it('does not add a command log when the transition returns the same state', () => {
    const game = createGame(2, 'logged-command-noop');
    const run = createLoggedGameTransition({
      describe: () => 'You command: start combat.',
      transition: (current) => current,
    });

    const next = run(game);

    expect(next).toBe(game);
    expect(next.logs[0]?.kind).not.toBe('command');
  });
});
