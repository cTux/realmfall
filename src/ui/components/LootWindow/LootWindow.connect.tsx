import { useCallback } from 'react';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectGameWorldTimeMs,
  selectPlayerEquipment,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import { LootWindow } from './LootWindow';
import type { LootWindowProps } from './types';

export interface LootWindowConnectedProps {
  loot: LootWindowProps['loot'];
  lootWindowVisible: boolean;
  onHoverItem: LootWindowProps['onHoverItem'];
  onLeaveItem: LootWindowProps['onLeaveItem'];
  onHoverDetail?: LootWindowProps['onHoverDetail'];
  onLeaveDetail?: LootWindowProps['onLeaveDetail'];
}

export function LootWindowConnected({
  loot,
  lootWindowVisible,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: LootWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const equipment = useAppSelector(selectPlayerEquipment);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleMove = useCallback(
    (position: LootWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'loot', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'loot', shown: false }));
  }, [dispatch]);

  const handleTakeAll = useCallback(() => {
    dispatch(gameActions.takeAllTileItemsAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleTakeItem = useCallback(
    (itemId: string) => {
      dispatch(gameActions.takeTileItemAtTime({ itemId, worldTimeMs }));
    },
    [dispatch, worldTimeMs],
  );

  return (
    <LootWindow
      position={windows.loot}
      onMove={handleMove}
      visible={windowShown.loot && lootWindowVisible}
      loot={loot}
      equipment={equipment}
      onClose={handleClose}
      onTakeAll={handleTakeAll}
      onTakeItem={handleTakeItem}
      onHoverItem={onHoverItem}
      onLeaveItem={onLeaveItem}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    />
  );
}
