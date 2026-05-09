import {
  useEffect,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { takeTileItems } from '../../../game/stateInventoryActions';
import type { GameState, Tile } from '../../../game/stateTypes';
import { interactWithStructureUntilDepleted } from '../../../game/stateWorldActions';
import { isGatheringStructure } from '../../../game/world';
import type { GameplaySettings } from '../../gameplaySettings';

interface UseGameplayAutomationOptions {
  combat: GameState['combat'];
  currentTile: Tile;
  enabled: boolean;
  gameplaySettings: GameplaySettings;
  ignoredAutoLootItemIds?: ReadonlySet<string>;
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  suppressAutoLoot?: boolean;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useGameplayAutomation({
  combat,
  currentTile,
  enabled,
  gameplaySettings,
  ignoredAutoLootItemIds,
  paused,
  setGame,
  suppressAutoLoot = false,
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

    const canAutoGatherPendingStagedCombat =
      combat != null &&
      !combat.started &&
      combat.engagement?.engageMode === 'staged-click' &&
      isGatheringStructure(currentTile.structure) &&
      combat.engagement.stagingCoord.q === currentTile.coord.q &&
      combat.engagement.stagingCoord.r === currentTile.coord.r;

    if (combat && !canAutoGatherPendingStagedCombat) {
      return;
    }

    const autoLootableItemIds = currentTile.items
      .filter((item) => !ignoredAutoLootItemIds?.has(item.id))
      .map((item) => item.id);

    if (
      !suppressAutoLoot &&
      gameplaySettings.autoLoot &&
      autoLootableItemIds.length > 0
    ) {
      applyTransition((state) => takeTileItems(state, autoLootableItemIds));
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
    ignoredAutoLootItemIds,
    paused,
    suppressAutoLoot,
  ]);
}
