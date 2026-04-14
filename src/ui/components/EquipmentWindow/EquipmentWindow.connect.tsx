import { useCallback } from 'react';
import { EquipmentWindow } from './EquipmentWindow';
import type { EquipmentWindowProps } from './types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectPlayerEquipment,
  selectGameWorldTimeMs,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import { gameActions } from '../../../app/store/gameSlice';

export type EquipmentWindowConnectedProps = Pick<
  EquipmentWindowProps,
  'onHoverItem' | 'onLeaveItem' | 'onHoverDetail' | 'onLeaveDetail'
>;

export function EquipmentWindowConnected(props: EquipmentWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectPlayerEquipment);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleMove = useCallback(
    (position: EquipmentWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'equipment', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'equipment', shown: false }));
  }, [dispatch]);

  const handleUnequip = useCallback(
    (slot: NonNullable<Parameters<EquipmentWindowProps['onUnequip']>[0]>) => {
      dispatch(gameActions.unequipItemAtTime({ slot, worldTimeMs }));
    },
    [dispatch, worldTimeMs],
  );

  const handleContextItem = useCallback<EquipmentWindowProps['onContextItem']>(
    (event, item, slot) => {
      event.preventDefault();
      dispatch(
        uiActions.openItemMenu({
          item,
          x: event.clientX,
          y: event.clientY,
          slot,
        }),
      );
    },
    [dispatch],
  );

  return (
    <EquipmentWindow
      position={windows.equipment}
      onMove={handleMove}
      visible={windowShown.equipment}
      onClose={handleClose}
      equipment={equipment}
      onHoverItem={props.onHoverItem}
      onLeaveItem={props.onLeaveItem}
      onUnequip={handleUnequip}
      onContextItem={handleContextItem}
      onHoverDetail={props.onHoverDetail}
      onLeaveDetail={props.onLeaveDetail}
    />
  );
}
