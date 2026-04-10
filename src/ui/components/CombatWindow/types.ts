import type { WindowPosition } from '../../../app/constants';
import type { CombatState, Enemy } from '../../../game/state';

export interface CombatWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  combat: CombatState;
  enemies: Enemy[];
  player: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  };
  onAttack: (enemyId: string) => void;
}
