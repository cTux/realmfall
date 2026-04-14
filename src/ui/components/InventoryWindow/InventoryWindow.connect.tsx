import { useCallback } from 'react';
import { getInventoryItemAction } from '../../../app/App/appHelpers';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectGameWorldTimeMs,
  selectPlayerEquipment,
  selectPlayerInventory,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import { InventoryWindow } from './InventoryWindow';
import type { InventoryWindowProps } from './types';

export type InventoryWindowConnectedProps = Pick<
  InventoryWindowProps,
  'onHoverItem' | 'onLeaveItem' | 'onHoverDetail' | 'onLeaveDetail'
>;

export function InventoryWindowConnected(props: InventoryWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectPlayerEquipment);
  const inventory = useAppSelector(selectPlayerInventory);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleMove = useCallback(
    (position: InventoryWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'inventory', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'inventory', shown: false }));
  }, [dispatch]);

  const handleSort = useCallback(() => {
    dispatch(gameActions.sortInventoryAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleEquip = useCallback(
    (itemId: string) => {
      const item = inventory.find((entry) => entry.id === itemId);
      const action = getInventoryItemAction(item);
      if (action === 'open-recipes') {
        dispatch(
          uiActions.setWindowVisibility({ key: 'recipes', shown: true }),
        );
        return;
      }
      if (action === 'use') {
        dispatch(gameActions.useItemAtTime({ itemId, worldTimeMs }));
        return;
      }
      dispatch(gameActions.equipItemAtTime({ itemId, worldTimeMs }));
    },
    [dispatch, inventory, worldTimeMs],
  );

  const handleContextItem = useCallback<InventoryWindowProps['onContextItem']>(
    (event, item) => {
      event.preventDefault();
      dispatch(
        uiActions.openItemMenu({
          item,
          x: event.clientX,
          y: event.clientY,
        }),
      );
    },
    [dispatch],
  );

  return (
    <InventoryWindow
      position={windows.inventory}
      onMove={handleMove}
      visible={windowShown.inventory}
      onClose={handleClose}
      inventory={inventory}
      equipment={equipment}
      onSort={handleSort}
      onEquip={handleEquip}
      onContextItem={handleContextItem}
      onHoverItem={props.onHoverItem}
      onLeaveItem={props.onLeaveItem}
      onHoverDetail={props.onHoverDetail}
      onLeaveDetail={props.onLeaveDetail}
    />
  );
}
