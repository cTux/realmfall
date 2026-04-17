import { createCombatActorState } from './combat';
import type { CombatState, Enemy, GameState, Player, Tile } from './types';

interface CopyStateSlices {
  homeHex?: boolean;
  logs?: boolean;
  combat?: boolean;
  tiles?: boolean;
  enemies?: boolean;
  player?: boolean;
}

export function copyGameState(
  state: GameState,
  slices: CopyStateSlices = {},
): GameState {
  return {
    ...state,
    homeHex: slices.homeHex ? { ...state.homeHex } : state.homeHex,
    logs: slices.logs ? [...state.logs] : state.logs,
    combat: slices.combat
      ? copyCombatState(state.combat, state.worldTimeMs)
      : state.combat,
    tiles: slices.tiles ? copyTiles(state.tiles) : state.tiles,
    enemies: slices.enemies ? copyEnemies(state.enemies) : state.enemies,
    player: slices.player ? copyPlayer(state.player) : state.player,
  };
}

function copyCombatState(
  combat: CombatState | null,
  worldTimeMs: number,
): CombatState | null {
  if (!combat) {
    return null;
  }

  const combatPlayer = combat.player ?? createCombatActorState(worldTimeMs);
  const combatEnemies = Object.fromEntries(
    combat.enemyIds.map((enemyId) => [
      enemyId,
      combat.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );

  return {
    ...combat,
    coord: { ...combat.coord },
    enemyIds: [...combat.enemyIds],
    player: {
      ...combatPlayer,
      abilityIds: [...combatPlayer.abilityIds],
      cooldownEndsAt: { ...combatPlayer.cooldownEndsAt },
      casting: combatPlayer.casting ? { ...combatPlayer.casting } : null,
    },
    enemies: Object.fromEntries(
      Object.entries(combatEnemies).map(([enemyId, actor]) => [
        enemyId,
        {
          ...actor,
          abilityIds: [...actor.abilityIds],
          cooldownEndsAt: { ...actor.cooldownEndsAt },
          casting: actor.casting ? { ...actor.casting } : null,
        },
      ]),
    ),
  };
}

function copyTiles(tiles: GameState['tiles']) {
  return Object.fromEntries(
    Object.entries(tiles).map(([key, tile]) => [key, copyTile(tile)]),
  );
}

function copyTile(tile: Tile): Tile {
  return {
    ...tile,
    coord: { ...tile.coord },
    items: tile.items.map((item) => ({ ...item })),
    enemyIds: [...tile.enemyIds],
    claim: tile.claim
      ? {
          ...tile.claim,
          npc: tile.claim.npc ? { ...tile.claim.npc } : undefined,
        }
      : undefined,
  };
}

function copyEnemies(enemies: GameState['enemies']) {
  return Object.fromEntries(
    Object.entries(enemies).map(([key, enemy]) => [key, copyEnemy(enemy)]),
  );
}

function copyEnemy(enemy: Enemy): Enemy {
  return { ...enemy, coord: { ...enemy.coord } };
}

function copyPlayer(player: Player): Player {
  return {
    ...player,
    coord: { ...player.coord },
    learnedRecipeIds: [...player.learnedRecipeIds],
    skills: Object.fromEntries(
      Object.entries(player.skills).map(([key, value]) => [key, { ...value }]),
    ) as Player['skills'],
    inventory: player.inventory.map((item) => ({ ...item })),
    equipment: Object.fromEntries(
      Object.entries(player.equipment).map(([key, item]) => [
        key,
        item ? { ...item } : item,
      ]),
    ),
    statusEffects: player.statusEffects.map((effect) => ({ ...effect })),
  };
}
