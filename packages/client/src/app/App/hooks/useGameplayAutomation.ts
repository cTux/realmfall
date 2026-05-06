import {
  useEffect,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { takeAllTileItems } from '../../../game/stateInventoryActions';
import type { GameState, Tile } from '../../../game/stateTypes';
import { interactWithStructureUntilDepleted } from '../../../game/stateWorldActions';
import { isGatheringStructure } from '../../../game/world';
import type { GameplaySettings } from '../../gameplaySettings';

interface UseGameplayAutomationOptions {
  combat: GameState['combat'];
  currentTile: Tile;
  enabled: boolean;
  gameplaySettings: GameplaySettings;
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useGameplayAutomation({
  combat,
  currentTile,
  enabled,
  gameplaySettings,
  paused,
  setGame,
  worldTimeMsRef,
}: UseGameplayAutomationOptions) {
  const applyTransition = useEffectEvent(
    (transition: (state: GameState) => GameState) => {
      if (!enabled || paused) {
        return;
      }

      setGame((current) =>
        transition({ ...current, worldTimeMs: worldTimeMsRef.current }),
      );
    },
  );

  useEffect(() => {
    if (!enabled || paused) {
      return;
    }

    if (combat) {
      return;
    }

    if (gameplaySettings.autoLoot && currentTile.items.length > 0) {
      applyTransition(takeAllTileItems);
      return;
    }

    if (
      gameplaySettings.autoGatherResources &&
      isGatheringStructure(currentTile.structure)
    ) {
      applyTransition(interactWithStructureUntilDepleted);
    }
  }, [
    combat,
    currentTile,
    enabled,
    gameplaySettings.autoGatherResources,
    gameplaySettings.autoLoot,
    paused,
  ]);
}
