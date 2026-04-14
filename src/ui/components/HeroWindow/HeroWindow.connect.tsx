import { useCallback } from 'react';
import { HeroWindow } from './HeroWindow';
import type { HeroWindowProps } from './types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectGameWorldTimeMs,
  selectPlayer,
  selectPlayerStats,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';

export type HeroWindowConnectedProps = Pick<
  HeroWindowProps,
  'onHoverDetail' | 'onLeaveDetail'
>;

export function HeroWindowConnected(props: HeroWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const player = useAppSelector(selectPlayer);
  const stats = useAppSelector(selectPlayerStats);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);

  const handleMove = useCallback(
    (position: HeroWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'hero', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'hero', shown: false }));
  }, [dispatch]);

  return (
    <HeroWindow
      position={windows.hero}
      onMove={handleMove}
      visible={windowShown.hero}
      onClose={handleClose}
      stats={stats}
      hunger={player.hunger}
      thirst={player.thirst}
      worldTimeMs={worldTimeMs}
      onHoverDetail={props.onHoverDetail}
      onLeaveDetail={props.onLeaveDetail}
    />
  );
}
