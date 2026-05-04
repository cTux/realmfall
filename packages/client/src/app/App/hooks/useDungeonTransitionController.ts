import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  activateDungeonWorld,
  leaveDungeonWorld,
} from '../../../game/stateDungeonActions';
import { hexKey } from '../../../game/hex';
import type { DungeonWorldState } from '../../../game/dungeons/types';
import type { GameState } from '../../../game/stateTypes';
import { loadEncryptedDungeonState } from '../../../persistence/storage';
import type { HexInteractAction } from '../AppWindows.viewTypes';

interface UseDungeonTransitionControllerArgs {
  gameRef: MutableRefObject<GameState>;
  interactAction: HexInteractAction | null;
  setGame: Dispatch<SetStateAction<GameState>>;
}

export function useDungeonTransitionController({
  gameRef,
  interactAction,
  setGame,
}: UseDungeonTransitionControllerArgs) {
  const [transitionActive, setTransitionActive] = useState(false);
  const [transitionError, setTransitionError] = useState<Error | null>(null);
  const retryRef = useRef<(() => Promise<void>) | null>(null);

  const runTransition = useCallback(async (transition: () => Promise<void>) => {
    retryRef.current = transition;
    setTransitionError(null);
    setTransitionActive(true);

    try {
      await transition();
      retryRef.current = null;
    } catch (error) {
      setTransitionError(
        error instanceof Error
          ? error
          : new Error('Dungeon transition failed.'),
      );
    } finally {
      setTransitionActive(false);
    }
  }, []);

  const enterDungeon = useCallback(() => {
    const transition = async () => {
      const current = gameRef.current;
      const surfaceCoord = current.player.coord;
      const dungeonId =
        current.dungeonEntrances[hexKey(surfaceCoord)]?.dungeonId ??
        `dungeon:${current.seed}:${hexKey(surfaceCoord)}`;
      if (current.worlds[dungeonId]) {
        applyStateTransition(setGame, activateDungeonWorld);
        return;
      }

      const persistedWorld =
        await loadEncryptedDungeonState<DungeonWorldState>(dungeonId);

      applyStateTransition(setGame, (next) =>
        activateDungeonWorld(
          next.worlds[dungeonId]
            ? next
            : persistedWorld
              ? {
                  ...next,
                  worlds: {
                    ...next.worlds,
                    [dungeonId]: persistedWorld,
                  },
                }
              : next,
        ),
      );
    };

    void runTransition(transition);
  }, [gameRef, runTransition, setGame]);

  const leaveDungeon = useCallback(() => {
    const transition = async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
      applyStateTransition(setGame, leaveDungeonWorld);
    };

    void runTransition(transition);
  }, [runTransition, setGame]);

  const tryHandleInteract = useCallback(() => {
    if (interactAction === 'enter-dungeon') {
      enterDungeon();
      return true;
    }

    if (interactAction === 'leave-dungeon') {
      leaveDungeon();
      return true;
    }

    return false;
  }, [enterDungeon, interactAction, leaveDungeon]);

  const retryTransition = useCallback(() => {
    if (transitionActive || !retryRef.current) {
      return;
    }

    void runTransition(retryRef.current);
  }, [runTransition, transitionActive]);

  return {
    hasTransitionError: transitionError !== null,
    retryTransition,
    transitionActive,
    tryHandleInteract,
  };
}

function applyStateTransition(
  setGame: Dispatch<SetStateAction<GameState>>,
  transition: (state: GameState) => GameState,
) {
  let transitionError: unknown = null;

  setGame((current) => {
    try {
      return transition(current);
    } catch (error) {
      transitionError = error;
      return current;
    }
  });

  if (transitionError) {
    throw transitionError;
  }
}
