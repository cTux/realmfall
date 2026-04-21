import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import {
  getCurrentTile,
  isEquippableItem,
  isRecipePage,
  type GameState,
} from '../../../game/state';
import type { ItemContextMenuState, TooltipItem } from '../types';

export function useItemContextMenuController({
  gameRef,
}: {
  gameRef: MutableRefObject<GameState>;
}) {
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);

  const closeItemMenu = useCallback(() => {
    setItemMenu(null);
  }, []);

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      const currentStructure = getCurrentTile(gameRef.current).structure;
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        canProspectItem:
          currentStructure === 'forge' &&
          isEquippableItem(item) &&
          !item.locked,
        canSellEntry:
          currentStructure === 'town' &&
          (isEquippableItem(item) || isRecipePage(item)) &&
          !item.locked,
      });
    },
    [gameRef],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: ItemContextMenuState['slot'],
    ) => {
      event.preventDefault();
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        slot,
        canProspectItem: false,
        canSellEntry: false,
      });
    },
    [],
  );

  return {
    closeItemMenu,
    handleContextItem,
    handleEquippedContextItem,
    itemMenu,
  };
}
