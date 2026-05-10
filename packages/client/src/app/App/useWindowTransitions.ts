import { useMemo } from 'react';
import type {
  Enemy,
  GameState,
  Item,
  Tile,
} from '@realmfall/core/game/stateTypes';
import { getPresentedCombat } from '../../game/combatPresentation';
import { useDeferredWindowLifecycle } from './hooks/useDeferredWindowLifecycle';

interface UseWindowTransitionsOptions {
  combat: GameState['combat'];
  combatEnemies: Enemy[];
  currentTile: Tile;
  suppressLootAutoOpen: boolean;
}

export function useWindowTransitions({
  combat,
  combatEnemies,
  currentTile,
  suppressLootAutoOpen,
}: UseWindowTransitionsOptions) {
  const presentedCombat = getPresentedCombat(combat);
  const lootWindowKey = useMemo(() => {
    if (currentTile.items.length === 0) return null;
    return `${currentTile.coord.q},${currentTile.coord.r}:${currentTile.items.map((item) => `${item.id}:${item.quantity}`).join('|')}`;
  }, [currentTile]);
  const showLootWindow = Boolean(
    !presentedCombat && lootWindowKey && !suppressLootAutoOpen,
  );

  const lootWindow = useDeferredWindowLifecycle<Item[]>({
    active: showLootWindow,
    snapshot: currentTile.items,
  });
  const combatWindow = useDeferredWindowLifecycle<{
    combat: NonNullable<GameState['combat']>;
    enemies: Enemy[];
  } | null>({
    active: Boolean(presentedCombat),
    snapshot: presentedCombat
      ? { combat: presentedCombat, enemies: combatEnemies }
      : null,
  });

  return {
    combatSnapshot: combatWindow.snapshot,
    combatWindowVisible: combatWindow.visible,
    tileLootSnapshot: lootWindow.snapshot,
    lootWindowVisible: lootWindow.visible,
    keepCombatWindowMounted: combatWindow.mounted,
    keepLootWindowMounted: lootWindow.mounted,
  };
}
