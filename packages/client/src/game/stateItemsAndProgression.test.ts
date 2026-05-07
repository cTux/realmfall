import {
  activateDungeonWorld,
  dropInventoryItem,
  EQUIPMENT_SLOTS,
  equipItem,
  getPlayerCombatStats,
  getPlayerOverview,
  getTileAt,
  moveToTile,
  useItem,
  type GameState,
} from './state';
import { GAME_CONFIG, HOME_SCROLL_ITEM_NAME_KEY } from './config';
import { t } from '../i18n';
import { addLog } from './logs';
import { gainXp, levelThreshold, masteryLevelThreshold } from './progression';
import {
  addCombatConsumables,
  addHomeScroll,
  createEquipmentItem,
  createItemsAndProgressionGame,
  findHomeScrollDrop,
  hasInventoryItem,
  itemQuantity,
  resolveEnemyEncounter,
  seedEnemyEncounter,
  setActiveCombat,
} from './stateItemsAndProgressionTestHelpers';

describe('game state items and progression', () => {
  it('can use consumables and drop inventory items onto the ground', () => {
    const game = createItemsAndProgressionGame('use-drop-seed');
    game.player.hp = 20;

    const used = useItem(game, 'starter-ration');
    const dropped = dropInventoryItem(used, 'starter-ration');

    expect(used.player.hunger).toBe(300);
    expect(itemQuantity(used, 'starter-ration')).toBe(1);
    expect(hasInventoryItem(dropped, 'starter-ration')).toBe(false);
    expect(
      getTileAt(dropped, { q: 0, r: 0 }).items.find(
        (item) => item.id === 'starter-ration',
      ),
    ).toBeDefined();
  });

  it('does not consume consumables when the equip-only path is used', () => {
    const attempted = equipItem(
      createItemsAndProgressionGame('equip-consumable-seed'),
      'starter-ration',
    );

    expect(itemQuantity(attempted, 'starter-ration')).toBe(2);
    expect(attempted.logs[0]?.text).toMatch(/cannot be equipped/i);
  });

  it('does not consume a consumable when none of its effects would apply', () => {
    const game = createItemsAndProgressionGame('use-no-effect-seed');
    game.player.hp = getPlayerCombatStats(game.player).maxHp;
    game.player.hunger = 300;
    game.player.thirst = 300;

    const untouched = useItem(game, 'starter-ration');

    expect(itemQuantity(untouched, 'starter-ration')).toBe(2);
    expect(untouched.logs[0]?.text).toContain(
      'Trail Ration would have no effect right now.',
    );
  });

  it('does not apply a consumable cooldown outside combat', () => {
    const game = createItemsAndProgressionGame('use-cooldown-seed');
    game.player.hp = 25;
    game.player.mana = 3;
    const { healthPotion, manaPotion } = addCombatConsumables(
      game,
      'no-combat',
    );

    const healed = useItem(game, healthPotion.id);

    expect(healed.player.consumableCooldownEndsAt).toBe(0);
    expect(hasInventoryItem(healed, healthPotion.id)).toBe(false);
    expect(
      hasInventoryItem(useItem(healed, manaPotion.id), manaPotion.id),
    ).toBe(false);
  });

  it('applies the shared consumable cooldown during active combat', () => {
    const game = createItemsAndProgressionGame(
      'combat-consumable-cooldown-seed',
    );
    game.player.hp = 25;
    game.player.mana = 3;
    const { healthPotion, manaPotion } = addCombatConsumables(game, 'combat');
    setActiveCombat(game);

    const used = useItem(game, healthPotion.id);
    const blocked = useItem(used, manaPotion.id);
    const usedAgain = useItem({ ...used, worldTimeMs: 2_000 }, manaPotion.id);

    expect(used.player.consumableCooldownEndsAt).toBe(2_000);
    expect(hasInventoryItem(used, healthPotion.id)).toBe(false);
    expect(hasInventoryItem(blocked, manaPotion.id)).toBe(true);
    expect(blocked.logs[0]?.text).toContain(
      'Consumables are on cooldown for 2s.',
    );
    expect(hasInventoryItem(usedAgain, manaPotion.id)).toBe(false);
  });

  it('clears the shared consumable cooldown immediately when a home scroll exits combat', () => {
    const game = createItemsAndProgressionGame('home-scroll-cooldown-seed');
    game.player.coord = { q: 2, r: -1 };
    game.homeHex = { q: 0, r: 0 };
    game.player.hp = 20;
    game.player.hunger = 80;
    addHomeScroll(game, 'home-scroll-1');
    setActiveCombat(game);

    const usedScroll = useItem(game, 'home-scroll-1');
    const usedRation = useItem(usedScroll, 'starter-ration');

    expect(usedScroll.player.coord).toEqual({ q: 0, r: 0 });
    expect(usedScroll.player.consumableCooldownEndsAt).toBe(0);
    expect(usedScroll.combat).toBeNull();
    expect(hasInventoryItem(usedScroll, 'home-scroll-1')).toBe(false);
    expect(itemQuantity(usedRation, 'starter-ration')).toBe(1);
  });

  it('uses health and mana potions for 35 percent of the matching max stat', () => {
    const game = createItemsAndProgressionGame('use-potions-seed');
    game.player.hp = 25;
    game.player.mana = 3;
    const { healthPotion, manaPotion } = addCombatConsumables(game, 'restore');

    const healed = useItem(game, healthPotion.id);
    const restored = useItem({ ...healed, worldTimeMs: 2_000 }, manaPotion.id);

    expect(healed.player.hp).toBe(78);
    expect(hasInventoryItem(healed, healthPotion.id)).toBe(false);
    expect(restored.player.mana).toBe(8);
    expect(hasInventoryItem(restored, manaPotion.id)).toBe(false);
  });

  it('uses a hearthshard wayscroll to return to the home hex', () => {
    const game = createItemsAndProgressionGame('home-scroll-use-seed');
    game.homeHex = { q: -2, r: 1 };
    game.player.coord = { q: 2, r: -1 };
    addHomeScroll(game, 'home-scroll-1');

    const returned = useItem(game, 'home-scroll-1');

    expect(returned.player.coord).toEqual(game.homeHex);
    expect(hasInventoryItem(returned, 'home-scroll-1')).toBe(false);
    expect(
      returned.logs.some((entry) => /returns you home/i.test(entry.text)),
    ).toBe(true);
  });

  it('uses a hearthshard wayscroll to leave a dungeon and return to the surface home hex', () => {
    const game = createItemsAndProgressionGame(
      'home-scroll-leaves-dungeon-seed',
    );
    const surfaceCoord = { q: 1, r: 0 };
    game.homeHex = { q: -2, r: 1 };
    game.player.coord = surfaceCoord;
    game.tiles['1,0'] = {
      coord: surfaceCoord,
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    addHomeScroll(game, 'home-scroll-dungeon');

    const entered = activateDungeonWorld(game);
    const returned = useItem(entered, 'home-scroll-dungeon');

    expect(entered.activeDungeon).not.toBeNull();
    expect(returned.player.coord).toEqual(game.homeHex);
    expect(returned.activeWorldId).toBe(returned.surfaceWorldId);
    expect(returned.activeDungeon).toBeNull();
  });

  it('can drop a hearthshard wayscroll from a defeated enemy', () => {
    const dropped = findHomeScrollDrop('home-scroll-drop-seed');

    expect(dropped).not.toBeNull();
    expect(
      getTileAt(dropped!, { q: 2, r: 0 }).items.some(
        (item) => item.name === t(HOME_SCROLL_ITEM_NAME_KEY),
      ),
    ).toBe(true);
  });

  it('caps the log at 100 messages', () => {
    const previousAmbushChance = GAME_CONFIG.worldGeneration.ambush.chance;
    GAME_CONFIG.worldGeneration.ambush.chance = 0;

    let game = createItemsAndProgressionGame('log-cap-seed');
    try {
      game.tiles['1,0'] = {
        coord: { q: 1, r: 0 },
        terrain: 'plains',
        items: [],
        structure: undefined,
        enemyIds: [],
      };
      game.tiles['0,0'] = {
        ...game.tiles['0,0'],
        items: [],
        enemyIds: [],
      };
      game.player.hunger = 999;
      game.player.thirst = 999;

      for (let turn = 0; turn < 120; turn += 1) {
        game = activateTravelTile(
          game,
          turn % 2 === 0 ? { q: 1, r: 0 } : { q: 0, r: 0 },
        );
      }

      expect(game.logs).toHaveLength(100);
      expect(game.logs[0]?.text).toMatch(/you travel to/i);
    } finally {
      GAME_CONFIG.worldGeneration.ambush.chance = previousAmbushChance;
    }
  });

  it('caps player level at 100 and gains infinite mastery levels after that', () => {
    const game = createItemsAndProgressionGame('mastery-seed');
    const level100Xp = levelThreshold(99);
    const firstMasteryXp = masteryLevelThreshold(0);
    const secondMasteryXp = masteryLevelThreshold(1);

    game.player.level = 99;
    game.player.xp = 0;
    game.player.masteryLevel = 0;

    gainXp(game, level100Xp + firstMasteryXp + secondMasteryXp, addLog);
    const heroOverview = getPlayerOverview(game.player);

    expect(game.player.level).toBe(100);
    expect(game.player.masteryLevel).toBe(2);
    expect(game.player.xp).toBe(0);
    expect(heroOverview.nextLevelXp).toBe(masteryLevelThreshold(2));
    expect(game.logs.some((entry) => /mastery level 2/i.test(entry.text))).toBe(
      true,
    );
  });

  it('awards level-scaled base enemy XP even when an enemy carries a legacy XP value', () => {
    const game = createItemsAndProgressionGame('legacy-enemy-xp-seed');
    game.player.level = 10;

    const { coord } = seedEnemyEncounter(game, {
      enemyId: 'enemy-flat-xp',
      xp: 999_999,
      tier: 5,
    });
    const resolved = resolveEnemyEncounter(game, coord);

    expect(resolved.player.xp).toBe(0);
  });

  it('awards a bonus when the defeated enemy tier is above the player tier', () => {
    const game = createItemsAndProgressionGame('enemy-tier-bonus-xp-seed');
    game.player.level = 10;

    const { coord } = seedEnemyEncounter(game, {
      enemyId: 'enemy-bonus-xp',
      xp: 1,
      tier: 20,
    });
    const resolved = resolveEnemyEncounter(game, coord);

    expect(resolved.player.xp).toBe(40);
  });

  it('does not restore hp or mana on level up', () => {
    const game = createItemsAndProgressionGame('level-up-keeps-resources-seed');
    game.player.hp = 9;
    game.player.mana = 4;

    const { coord } = seedEnemyEncounter(game, {
      enemyId: 'enemy-level-up',
      xp: 65,
    });
    const resolved = resolveEnemyEncounter(game, coord);
    const stats = getPlayerCombatStats(resolved.player);

    expect(resolved.player.level).toBe(2);
    expect(resolved.player.hp).toBe(9);
    expect(resolved.player.mana).toBe(4);
    expect(stats.maxHp).toBe(189);
    expect(stats.maxMana).toBe(14);
  });

  it('starts a temporary fullscreen glow effect on level up', () => {
    const game = createItemsAndProgressionGame('level-up-glow-seed');

    gainXp(game, levelThreshold(game.player.level), addLog);

    expect(game.player.level).toBe(2);
    expect(game.playerLevelUpVisualEndsAt).toBeGreaterThan(game.worldTimeMs);
  });

  it('supports many equipment slots and artifact loadouts', () => {
    const game = createItemsAndProgressionGame('equip-seed');
    game.player.level = 20;
    game.player.inventory = EQUIPMENT_SLOTS.map((slot, index) =>
      createEquipmentItem(slot, {
        id: `item-${slot}`,
        name: `Item ${index}`,
        tier: 2,
        power:
          slot === 'weapon' ||
          slot === 'offhand' ||
          slot === 'ringLeft' ||
          slot === 'ringRight' ||
          slot === 'amulet'
            ? 3
            : 0,
        defense: slot === 'weapon' ? 0 : 2,
        maxHp: 1,
      }),
    );

    const equipped = game.player.inventory.reduce(
      (current, item) => equipItem(current, item.id),
      game,
    );

    expect(Object.keys(equipped.player.equipment)).toHaveLength(
      EQUIPMENT_SLOTS.length,
    );
    expect(getPlayerCombatStats(equipped.player).defense).toBeGreaterThan(
      getPlayerCombatStats(game.player).defense,
    );
  });

  it('does not allow equipping when player level is too low', () => {
    const game = createItemsAndProgressionGame('equip-level-too-low-seed');
    game.player.level = 3;
    game.player.inventory.push(
      createEquipmentItem('head', {
        id: 'level-locked-helm',
        name: 'Level Locked Helm',
        requiredLevel: 10,
        defense: 1,
      }),
    );

    const attempted = equipItem(game, 'level-locked-helm');

    expect(hasInventoryItem(attempted, 'level-locked-helm')).toBe(true);
    expect(attempted.logs[0]?.text).toContain(
      'You need to be level 10 or higher to wear Level Locked Helm.',
    );
  });

  it('uses item tier as the default required level', () => {
    const game = createItemsAndProgressionGame(
      'equip-tier-as-requirement-seed',
    );
    game.player.level = 3;
    game.player.inventory.push(
      createEquipmentItem('head', {
        id: 'tier-locked-helm',
        name: 'Tier Locked Helm',
        tier: 6,
        defense: 1,
      }),
    );

    const attempted = equipItem(game, 'tier-locked-helm');

    expect(hasInventoryItem(attempted, 'tier-locked-helm')).toBe(true);
    expect(attempted.logs[0]?.text).toContain(
      'You need to be level 6 or higher to wear Tier Locked Helm.',
    );
  });

  it('allows equipping when player level meets requirement', () => {
    const game = createItemsAndProgressionGame(
      'equip-level-meets-requirement-seed',
    );
    game.player.level = 10;
    game.player.inventory.push(
      createEquipmentItem('head', {
        id: 'level-locked-helm',
        name: 'Level Locked Helm',
        requiredLevel: 10,
        defense: 1,
      }),
    );

    const equipped = equipItem(game, 'level-locked-helm');

    expect(equipped.player.equipment.head?.id).toBe('level-locked-helm');
    expect(hasInventoryItem(equipped, 'level-locked-helm')).toBe(false);
  });
});

function activateTravelTile(game: GameState, coord: { q: number; r: number }) {
  return moveToTile(game, coord);
}
