import { useCallback } from 'react';
import { SkillsWindow } from './SkillsWindow';
import type { SkillsWindowProps } from './types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { selectPlayerStats } from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';

export type SkillsWindowConnectedProps = Pick<
  SkillsWindowProps,
  'onHoverDetail' | 'onLeaveDetail'
>;

export function SkillsWindowConnected(props: SkillsWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectPlayerStats);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);

  const handleMove = useCallback(
    (position: SkillsWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'skills', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'skills', shown: false }));
  }, [dispatch]);

  return (
    <SkillsWindow
      position={windows.skills}
      onMove={handleMove}
      visible={windowShown.skills}
      onClose={handleClose}
      skills={stats.skills}
      onHoverDetail={props.onHoverDetail}
      onLeaveDetail={props.onLeaveDetail}
    />
  );
}
