import * as stateDebug from '@realmfall/core/game/stateDebug';
import { createGame } from '@realmfall/core/game/stateFactory';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { t } from '../../../../i18n';
import {
  buildDebugCommandHandlers,
  buildInventoryItemCommandHandlers,
} from './descriptorHandlersTestkit';

describe('descriptorHandlers', () => {
  it('builds inventory handlers from descriptors, including dynamic log keys', () => {
    let latestGame = createGame(2, 'descriptor-handlers-lock-item');
    const item = latestGame.player.inventory[0]!;
    const applyGameTransition = (
      transition: (state: GameState) => GameState,
    ) => {
      latestGame = transition(latestGame);
    };

    const { handleSetItemLocked } =
      buildInventoryItemCommandHandlers(applyGameTransition);

    handleSetItemLocked(item.id, true);

    expect(
      latestGame.player.inventory.find(({ id }) => id === item.id)?.locked,
    ).toBe(true);
    expect(latestGame.logs[0]?.text).toContain(
      t('game.log.command.lockItem', { itemName: item.name }),
    );
  });

  it('builds lazy debug handlers that resolve module transitions on demand', async () => {
    let latestGame = createGame(2, 'descriptor-handlers-debug-command');
    const applyGameTransition = (
      transition: (state: GameState) => GameState,
    ) => {
      latestGame = transition(latestGame);
    };

    const { handleTriggerDebugBloodMoon } = buildDebugCommandHandlers(
      applyGameTransition,
      async () => stateDebug,
    );

    handleTriggerDebugBloodMoon();
    await Promise.resolve();
    await Promise.resolve();

    expect(latestGame.bloodMoonActive).toBe(true);
    expect(latestGame.logs[0]?.text).toContain(
      'You command: force a blood moon.',
    );
  });
});
