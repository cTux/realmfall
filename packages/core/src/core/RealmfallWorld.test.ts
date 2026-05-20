import { describe, expect, it } from 'vitest';
import { createCombatActorState } from '../game/combat';
import type { GameState } from '../game/types';
import { CombatEncounter } from './CombatEncounter';
import { Inventory } from './Inventory';
import { ItemStack } from './ItemStack';
import { RealmfallWorld } from './RealmfallWorld';
import { Tile } from './Tile';

describe('RealmfallWorld', () => {
  it('moves across the cached starting tiles and emits movement events', () => {
    const world = RealmfallWorld.create({ seed: 'core-smoke-move' });
    const movedTo: string[] = [];
    let stateChanges = 0;

    world.on('movement', (_from, to) => {
      movedTo.push(to.toKey());
    });
    world.on('stateChanged', () => {
      stateChanges += 1;
    });

    world.moveToTile({ q: 1, r: 0 });

    expect(world.player.coord.toKey()).toBe('1,0');
    expect(movedTo).toEqual(['1,0']);
    expect(stateChanges).toBe(1);
  });

  it('rehydrates from a saved snapshot', () => {
    const original = RealmfallWorld.create({ seed: 'core-smoke-save' });
    original.moveToTile({ q: 0, r: 1 });

    const restored = RealmfallWorld.fromSave(original.toJSON());

    expect(restored.snapshot().seed).toBe('core-smoke-save');
    expect(restored.player.coord.toKey()).toBe('0,1');
    expect(restored.snapshot().player.inventory.length).toBe(
      original.snapshot().player.inventory.length,
    );
  });

  it('returns tile wrappers instead of raw tile records', () => {
    const world = RealmfallWorld.create({ seed: 'core-smoke-tile' });

    const currentTile = world.getCurrentTile();
    const visibleTiles = world.visibleTiles;

    expect(currentTile).toBeInstanceOf(Tile);
    expect(currentTile.coord.toKey()).toBe('0,0');
    expect(currentTile.isPassable).toBe(true);
    expect(visibleTiles[0]).toBeInstanceOf(Tile);
    expect(visibleTiles.some((tile) => tile.coord.toKey() === '0,0')).toBe(
      true,
    );
  });

  it('wraps player inventory and item stacks', () => {
    const world = RealmfallWorld.create({ seed: 'core-smoke-inventory' });

    expect(world.player.inventory).toBeInstanceOf(Inventory);
    expect(world.player.inventory.items[0]).toBeInstanceOf(ItemStack);
    expect(world.player.inventory.size).toBe(
      world.snapshot().player.inventory.length,
    );
    expect(
      world.player.inventory.findById(world.snapshot().player.inventory[0]!.id),
    ).toBeInstanceOf(ItemStack);
  });

  it('wraps combat state in a combat encounter class', () => {
    const world = RealmfallWorld.create({ seed: 'core-smoke-combat' });
    const save = world.toJSON() as GameState;

    save.enemies['enemy-core-smoke'] = {
      id: 'enemy-core-smoke',
      name: 'Boar',
      coord: { q: 0, r: 0 },
      hp: 12,
      maxHp: 12,
      mana: 0,
      maxMana: 0,
      attack: 3,
      defense: 1,
      xp: 5,
      tier: 1,
      elite: false,
      aggressive: true,
    };
    save.combat = {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-core-smoke'],
      started: true,
      startedAtMs: save.worldTimeMs,
      player: createCombatActorState(save.worldTimeMs),
      enemies: {
        'enemy-core-smoke': createCombatActorState(save.worldTimeMs),
      },
      enemyStateById: {
        'enemy-core-smoke': {},
      },
    };

    const restored = RealmfallWorld.fromSave(save);

    expect(restored.combat).toBeInstanceOf(CombatEncounter);
    expect(restored.combat?.enemies[0]?.id).toBe('enemy-core-smoke');
    expect(restored.combat?.playerActor.abilityIds.length).toBeGreaterThan(0);
  });
});
