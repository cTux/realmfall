import { useEffect, useMemo, useState } from 'react';
import type { Enemy, GameState, Item, Tile } from '../../game/stateTypes';

interface UseWindowTransitionsOptions {
  combat: GameState['combat'];
  combatEnemies: Enemy[];
  currentTile: Tile;
}

export function useWindowTransitions({
  combat,
  combatEnemies,
  currentTile,
}: UseWindowTransitionsOptions) {
  const lootWindowKey = useMemo(() => {
    if (currentTile.items.length === 0) return null;
    return `${currentTile.coord.q},${currentTile.coord.r}:${currentTile.items.map((item) => `${item.id}:${item.quantity}`).join('|')}`;
  }, [currentTile]);
  const showLootWindow = Boolean(!combat && lootWindowKey);

  const [keepLootWindowMounted, setKeepLootWindowMounted] =
    useState(showLootWindow);
  const [lootWindowVisible, setLootWindowVisible] = useState(showLootWindow);
  const [lootSnapshot, setLootSnapshot] = useState<Item[]>(currentTile.items);

  useEffect(() => {
    if (showLootWindow) {
      setLootSnapshot(currentTile.items);
      setKeepLootWindowMounted(true);
      const frame = window.requestAnimationFrame(() =>
        setLootWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setLootWindowVisible(false);
    const timeout = window.setTimeout(
      () => setKeepLootWindowMounted(false),
      180,
    );
    return () => window.clearTimeout(timeout);
  }, [currentTile.items, showLootWindow]);

  const [keepCombatWindowMounted, setKeepCombatWindowMounted] = useState(
    Boolean(combat),
  );
  const [combatWindowVisible, setCombatWindowVisible] = useState(
    Boolean(combat),
  );
  const [combatSnapshot, setCombatSnapshot] = useState<{
    combat: NonNullable<GameState['combat']>;
    enemies: Enemy[];
  } | null>(combat ? { combat, enemies: combatEnemies } : null);

  useEffect(() => {
    if (combat) {
      setCombatSnapshot({ combat, enemies: combatEnemies });
      setKeepCombatWindowMounted(true);
      const frame = window.requestAnimationFrame(() =>
        setCombatWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setCombatWindowVisible(false);
    const timeout = window.setTimeout(
      () => setKeepCombatWindowMounted(false),
      180,
    );
    return () => window.clearTimeout(timeout);
  }, [combat, combatEnemies]);

  return {
    combatSnapshot,
    combatWindowVisible,
    lootSnapshot,
    lootWindowVisible,
    keepCombatWindowMounted,
    keepLootWindowMounted,
  };
}
