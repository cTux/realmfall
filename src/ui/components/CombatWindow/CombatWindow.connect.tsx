import { useCallback } from 'react';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectGame,
  selectGameWorldTimeMs,
  selectPlayerStats,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import { CombatWindow } from './CombatWindow';
import type { CombatWindowProps } from './types';

export interface CombatWindowConnectedProps {
  combatSnapshot: {
    combat: CombatWindowProps['combat'];
    enemies: CombatWindowProps['enemies'];
  };
  combatWindowVisible: boolean;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
  onHoverHeaderAction?: CombatWindowProps['onHoverHeaderAction'];
}

export function CombatWindowConnected({
  combatSnapshot,
  combatWindowVisible,
  onHoverDetail,
  onLeaveDetail,
  onHoverHeaderAction,
}: CombatWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  const stats = useAppSelector(selectPlayerStats);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);

  const handleMove = useCallback(
    (position: CombatWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'combat', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'combat', shown: false }));
  }, [dispatch]);

  const handleStart = useCallback(() => {
    dispatch(gameActions.startCombatAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  return (
    <CombatWindow
      position={windows.combat}
      onMove={handleMove}
      visible={windowShown.combat && combatWindowVisible}
      onClose={handleClose}
      combat={combatSnapshot.combat}
      playerParty={[
        {
          id: 'player',
          name: 'Player',
          level: stats.level,
          hp: stats.hp,
          maxHp: stats.maxHp,
          mana: game.player.mana,
          maxMana: stats.maxMana,
          actor: combatSnapshot.combat.player,
        },
      ]}
      enemies={combatSnapshot.enemies}
      worldTimeMs={worldTimeMs}
      onStart={handleStart}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      onHoverHeaderAction={onHoverHeaderAction}
    />
  );
}
