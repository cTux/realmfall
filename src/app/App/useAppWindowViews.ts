import { useEffect, useMemo, useState } from 'react';
import {
  describeStructure,
  getHostileEnemyIds,
  type GameState,
  type Tile,
} from '../../game/state';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import { formatTerrainLabel } from './appHelpers';
import type { AppWindowsProps } from './AppWindows';

const WINDOW_HANDLER_KEYS = [
  'worldTime',
  'hero',
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'loot',
  'log',
  'combat',
] as const;

const DEFERRED_WINDOW_KEYS = [
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'loot',
  'log',
  'combat',
] as const;

type ManagedWindowKey = (typeof WINDOW_HANDLER_KEYS)[number];
type DeferredWindowKey = (typeof DEFERRED_WINDOW_KEYS)[number];

function createWindowMoveHandlers(
  onMoveWindow: AppWindowsProps['onMoveWindow'],
) {
  return WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = (position) => onMoveWindow(key, position);
      return handlers;
    },
    {} as {
      [K in ManagedWindowKey]: (position: WindowPositions[K]) => void;
    },
  );
}

function createWindowCloseHandlers(
  onSetWindowVisibility: AppWindowsProps['onSetWindowVisibility'],
) {
  return WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = () => onSetWindowVisibility(key, false);
      return handlers;
    },
    {} as { [K in ManagedWindowKey]: () => void },
  );
}

function createLoadedWindowState(
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  return {
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: renderLootWindow,
    log: windowShown.log,
    combat: renderCombatWindow,
  } satisfies Record<DeferredWindowKey, boolean>;
}

function mergeLoadedWindowState(
  current: Record<DeferredWindowKey, boolean>,
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  const next = createLoadedWindowState(
    windowShown,
    renderLootWindow,
    renderCombatWindow,
  );

  for (const key of DEFERRED_WINDOW_KEYS) {
    next[key] = current[key] || next[key];
  }

  return DEFERRED_WINDOW_KEYS.every((key) => current[key] === next[key])
    ? current
    : next;
}

export function useAppWindowHandlers({
  onMoveWindow,
  onSetWindowVisibility,
}: Pick<AppWindowsProps, 'onMoveWindow' | 'onSetWindowVisibility'>) {
  const windowMoveHandlers = useMemo(
    () => createWindowMoveHandlers(onMoveWindow),
    [onMoveWindow],
  );
  const windowCloseHandlers = useMemo(
    () => createWindowCloseHandlers(onSetWindowVisibility),
    [onSetWindowVisibility],
  );

  return { windowMoveHandlers, windowCloseHandlers };
}

export function useDeferredWindows({
  windowShown,
  renderLootWindow,
  renderCombatWindow,
}: Pick<
  AppWindowsProps,
  'windowShown' | 'renderLootWindow' | 'renderCombatWindow'
>) {
  const [loadedWindows, setLoadedWindows] = useState(() =>
    createLoadedWindowState(windowShown, renderLootWindow, renderCombatWindow),
  );

  useEffect(() => {
    setLoadedWindows((current) =>
      mergeLoadedWindowState(
        current,
        windowShown,
        renderLootWindow,
        renderCombatWindow,
      ),
    );
  }, [renderCombatWindow, renderLootWindow, windowShown]);

  return loadedWindows;
}

export function useHexInfoView({
  game,
  currentTile,
  combatSnapshot,
}: Pick<AppWindowsProps, 'game' | 'currentTile' | 'combatSnapshot'>) {
  return useMemo(
    () => ({
      isHome:
        game.homeHex.q === game.player.coord.q &&
        game.homeHex.r === game.player.coord.r,
      canSetHome:
        !currentTile.claim || currentTile.claim.ownerType === 'player',
      terrain: formatTerrainLabel(currentTile.terrain),
      structure: currentTile.structure
        ? describeStructure(currentTile.structure)
        : null,
      enemyCount: game.combat
        ? (combatSnapshot?.enemies.length ?? 0)
        : getHostileEnemyIds(game, currentTile.coord).length,
    }),
    [combatSnapshot?.enemies.length, currentTile, game],
  );
}

export function useRecipeWindowStructure(structure: Tile['structure']) {
  return useMemo(() => describeStructure(structure), [structure]);
}

export function useCombatPlayerParty({
  combatSnapshot,
  stats,
  mana,
}: {
  combatSnapshot: AppWindowsProps['combatSnapshot'];
  stats: AppWindowsProps['stats'];
  mana: GameState['player']['mana'];
}) {
  return useMemo(
    () =>
      combatSnapshot
        ? [
            {
              id: 'player',
              name: 'Player',
              level: stats.level,
              hp: stats.hp,
              maxHp: stats.maxHp,
              mana,
              maxMana: stats.maxMana,
              actor: combatSnapshot.combat.player,
            },
          ]
        : [],
    [combatSnapshot, mana, stats.hp, stats.level, stats.maxHp, stats.maxMana],
  );
}
