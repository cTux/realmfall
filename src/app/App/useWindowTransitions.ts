import { useEffect, useMemo, useState } from 'react';
import {
  getEnemiesAt,
  type GameState,
  type Item,
  type Tile,
} from '../../game/state';

interface UseWindowTransitionsOptions {
  combat: GameState['combat'];
  combatEnemies: ReturnType<typeof getEnemiesAt>;
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

  const [renderLootWindow, setRenderLootWindow] = useState(showLootWindow);
  const [lootWindowVisible, setLootWindowVisible] = useState(showLootWindow);
  const [lootSnapshot, setLootSnapshot] = useState<Item[]>(currentTile.items);

  useEffect(() => {
    if (showLootWindow) {
      setLootSnapshot(currentTile.items);
      setRenderLootWindow(true);
      const frame = window.requestAnimationFrame(() =>
        setLootWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setLootWindowVisible(false);
    const timeout = window.setTimeout(() => setRenderLootWindow(false), 180);
    return () => window.clearTimeout(timeout);
  }, [currentTile.items, showLootWindow]);

  const [renderCombatWindow, setRenderCombatWindow] = useState(Boolean(combat));
  const [combatWindowVisible, setCombatWindowVisible] = useState(
    Boolean(combat),
  );
  const [combatSnapshot, setCombatSnapshot] = useState<{
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof getEnemiesAt>;
  } | null>(combat ? { combat, enemies: combatEnemies } : null);

  useEffect(() => {
    if (combat) {
      setCombatSnapshot({ combat, enemies: combatEnemies });
      setRenderCombatWindow(true);
      const frame = window.requestAnimationFrame(() =>
        setCombatWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setCombatWindowVisible(false);
    const timeout = window.setTimeout(() => setRenderCombatWindow(false), 180);
    return () => window.clearTimeout(timeout);
  }, [combat, combatEnemies]);

  return {
    combatSnapshot,
    combatWindowVisible,
    lootSnapshot,
    lootWindowVisible,
    renderCombatWindow,
    renderLootWindow,
  };
}
