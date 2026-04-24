import { useCallback, useEffect, useState, type MutableRefObject } from 'react';
import { t } from '../../../i18n';
import { useItem as applyItemUse } from '../../../game/stateItemActions';
import type { GameState, Item } from '../../../game/stateTypes';
import {
  createDefaultActionBarSlots,
  findActionBarItem,
  reconcileActionBarSlots,
  type ActionBarSlots,
} from '../actionBar';
import { createLoggedGameTransition } from './useLoggedGameCommand';

interface UseActionBarControllerOptions {
  applyGameTransition: (transition: (state: GameState) => GameState) => void;
  gameRef: MutableRefObject<GameState>;
  inventory: Item[];
}

export function useActionBarController({
  applyGameTransition,
  gameRef,
  inventory,
}: UseActionBarControllerOptions) {
  const [actionBarSlots, setActionBarSlots] = useState<ActionBarSlots>(
    createDefaultActionBarSlots,
  );

  useEffect(() => {
    setActionBarSlots((current) => reconcileActionBarSlots(inventory, current));
  }, [inventory]);

  const handleAssignActionBarSlot = useCallback(
    (slotIndex: number, item: Item) => {
      setActionBarSlots((current) => {
        const next = [...current];
        next[slotIndex] = { item: { ...item } };
        return next;
      });
    },
    [],
  );

  const handleClearActionBarSlot = useCallback((slotIndex: number) => {
    setActionBarSlots((current) => {
      if (!current[slotIndex]) {
        return current;
      }

      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  const handleUseActionBarSlot = useCallback(
    (slotIndex: number) => {
      const assigned = actionBarSlots[slotIndex];
      const item = findActionBarItem(
        gameRef.current.player.inventory,
        assigned,
      );
      if (!item) {
        return;
      }

      applyGameTransition(
        createLoggedGameTransition({
          describe: () =>
            t('game.log.command.useActionBarItem', { itemName: item.name }),
          transition: (current) => applyItemUse(current, item.id),
        }),
      );
    },
    [actionBarSlots, applyGameTransition, gameRef],
  );

  return {
    actionBarSlots,
    handleAssignActionBarSlot,
    handleClearActionBarSlot,
    handleUseActionBarSlot,
    setActionBarSlots,
  };
}
