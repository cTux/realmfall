import { useAppSelector } from './hooks';
import { selectGame } from './selectors/gameSelectors';

export function useGameState() {
  return useAppSelector(selectGame);
}
