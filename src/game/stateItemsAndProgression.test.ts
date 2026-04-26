import {
  createGame,
  dropInventoryItem,
  EQUIPMENT_SLOTS,
  equipItem,
  getPlayerCombatStats,
  getPlayerOverview,
  getTileAt,
  moveToTile,
  startCombat,
  useItem,
  type GameState,
  type Item,
} from './state';
import { GAME_CONFIG, HOME_SCROLL_ITEM_NAME_KEY } from './config';
import { t } from '../i18n';
import { buildItemFromConfig } from './content/items';
import { addLog } from './logs';
import { gainXp, levelThreshold, masteryLevelThreshold } from './progression';

describe('game state items and progression', () => {
  it('can use consumables and drop inventory items onto the ground', () => {
    const game = createGame(3, 'use-drop-seed');
    game.player.hp = 20;

    const used = useItem(game, 'starter-ration');
    expect(used.player.hunger).toBe(300);
    expect(
      used.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);

    const dropped = dropInventoryItem(used, 'starter-ration');
    expect(
      dropped.player.inventory.find((item) => item.id === 'starter-ration'),
    ).toBeUndefined();
    expect(
      getTileAt(dropped, { q: 0, r: 0 }).items.find(
        (item) => item.id === 'starter-ration',
      ),
    ).toBeDefined();
  });

  it('does not consume consumables when the equip-only path is used', () => {
    const game = createGame(3, 'equip-consumable-seed');

    const attempted = equipItem(game, 'starter-ration');

    expect(
      attempted.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(attempted.logs[0]?.text).toMatch(/cannot be equipped/i);
  });

  it('does not consume a consumable when none of its effects would apply', () => {
    const game = createGame(3, 'use-no-effect-seed');
    game.player.hp = getPlayerCombatStats(game.player).maxHp;
    game.player.hunger = 300;
    game.player.thirst = 300;

    const untouched = useItem(game, 'starter-ration');

    expect(
      untouched.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(untouched.logs[0]?.text).toContain(
      'Trail Ration would have no effect right now.',
    );
  });

  it('applies a shared consumable cooldown after using one', () => {
    const game = createGame(3, 'use-cooldown-seed');
    game.player.hp = 20;
    game.player.hunger = 80;

    const used = useItem(game, 'starter-ration');

    expect(used.player.consumableCooldownEndsAt).toBe(2_000);
    expect(
      used.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);

    const blocked = useItem(used, 'starter-ration');

    expect(
      blocked.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);
    expect(blocked.logs[0]?.text).toContain(
      'Consumables are on cooldown for 2s.',
    );

    const ready = {
      ...used,
      worldTimeMs: 2_000,
    };
    const usedAgain = useItem(ready, 'starter-ration');

    expect(
      usedAgain.player.inventory.find((item) => item.id === 'starter-ration'),
    ).toBeUndefined();
  });

  it('applies the shared consumable cooldown after using a home scroll', () => {
    const game = createGame(3, 'home-scroll-cooldown-seed');
    game.player.coord = { q: 2, r: -1 };
    game.homeHex = { q: 0, r: 0 };
    game.player.hp = 20;
    game.player.hunger = 80;
    game.player.inventory.push({
      id: 'home-scroll-1',
      itemKey: 'home-scroll',
      name: 'Pergamino del hogar',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const usedScroll = useItem(game, 'home-scroll-1');

    expect(usedScroll.player.coord).toEqual({ q: 0, r: 0 });
    expect(usedScroll.player.consumableCooldownEndsAt).toBe(2_000);
    expect(
      usedScroll.player.inventory.find((item) => item.id === 'home-scroll-1'),
    ).toBeUndefined();

    const blocked = useItem(usedScroll, 'starter-ration');

    expect(
      blocked.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(blocked.logs[0]?.text).toContain(
      'Consumables are on cooldown for 2s.',
    );
  });

  it('uses health and mana potions for 35 percent of the matching max stat', () => {
    const game = createGame(3, 'use-potions-seed');
    const hpPotion = buildItemFromConfig('health-potion', {
      id: 'health-potion-1',
    });
    const mpPotion = buildItemFromConfig('mana-potion', {
      id: 'mana-potion-1',
    });
    game.player.inventory.push(hpPotion, mpPotion);
    game.player.hp = 25;
    game.player.mana = 3;

    const healed = useItem(game, 'health-potion-1');
    expect(healed.player.hp).toBe(78);
    expect(
      healed.player.inventory.find((item) => item.id === 'health-potion-1'),
    ).toBeUndefined();

    const restored = useItem(
      {
        ...healed,
        worldTimeMs: 2_000,
      },
      'mana-potion-1',
    );
    expect(restored.player.mana).toBe(8);
    expect(
      restored.player.inventory.find((item) => item.id === 'mana-potion-1'),
    ).toBeUndefined();
  });

  it('uses a hearthshard wayscroll to return to the home hex', () => {
    const game = createGame(3, 'home-scroll-use-seed');
    game.homeHex = { q: -2, r: 1 };
    game.player.coord = { q: 2, r: -1 };
    game.player.inventory.push({
      id: 'home-scroll-1',
      itemKey: 'home-scroll',
      name: 'Pergamino del hogar',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const returned = useItem(game, 'home-scroll-1');

    expect(returned.player.coord).toEqual(game.homeHex);
    expect(
      returned.player.inventory.some((item) => item.id === 'home-scroll-1'),
    ).toBe(false);
    expect(
      returned.logs.some((entry) => /returns you home/i.test(entry.text)),
    ).toBe(true);
  });

  it('can drop a hearthshard wayscroll from a defeated enemy', () => {
    let dropped: GameState | null = null;

    for (let attempt = 0; attempt < 800; attempt += 1) {
      const game = createGame(3, `home-scroll-drop-seed-${attempt}`);
      const target = { q: 2, r: 0 };
      game.homeHex = { q: -2, r: 1 };
      game.tiles['2,0'] = {
        coord: target,
        terrain: 'plains',
        items: [],
        structure: undefined,
        enemyIds: ['enemy-2,0-0'],
      };
      game.enemies['enemy-2,0-0'] = {
        id: 'enemy-2,0-0',
        name: 'Wolf',
        coord: target,
        tier: 1,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 1,
        elite: false,
      };
      game.player.coord = { q: 1, r: 0 };

      const encountered = moveToTile(game, target);
      const resolved = startCombat(encountered);
      const tile = getTileAt(resolved, target);
      if (
        tile.items.some((item) => item.name === t(HOME_SCROLL_ITEM_NAME_KEY))
      ) {
        dropped = resolved;
        break;
      }
    }

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

    let game = createGame(3, 'log-cap-seed');
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
        game = moveToTile(
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
    const game = createGame(3, 'mastery-seed');
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
    const game = createGame(3, 'legacy-enemy-xp-seed');
    const target = { q: 2, r: 0 };
    game.player.level = 10;
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-flat-xp'],
    };
    game.enemies['enemy-flat-xp'] = {
      id: 'enemy-flat-xp',
      name: 'Training Dummy',
      coord: target,
      tier: 5,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 999_999,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);

    expect(resolved.player.xp).toBe(0);
  });

  it('awards a bonus when the defeated enemy tier is above the player tier', () => {
    const game = createGame(3, 'enemy-tier-bonus-xp-seed');
    const target = { q: 2, r: 0 };
    game.player.level = 10;
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-bonus-xp'],
    };
    game.enemies['enemy-bonus-xp'] = {
      id: 'enemy-bonus-xp',
      name: 'Training Dummy',
      coord: target,
      tier: 20,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);

    expect(resolved.player.xp).toBe(40);
  });

  it('does not restore hp or mana on level up', () => {
    const game = createGame(3, 'level-up-keeps-resources-seed');
    const target = { q: 2, r: 0 };
    game.player.hp = 9;
    game.player.mana = 4;
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-level-up'],
    };
    game.enemies['enemy-level-up'] = {
      id: 'enemy-level-up',
      name: 'Training Dummy',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 65,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const stats = getPlayerCombatStats(resolved.player);

    expect(resolved.player.level).toBe(2);
    expect(resolved.player.hp).toBe(9);
    expect(resolved.player.mana).toBe(4);
    expect(stats.maxHp).toBe(189);
    expect(stats.maxMana).toBe(14);
  });

  it('starts a temporary fullscreen glow effect on level up', () => {
    const game = createGame(3, 'level-up-glow-seed');

    gainXp(game, levelThreshold(game.player.level), addLog);

    expect(game.player.level).toBe(2);
    expect(game.playerLevelUpVisualEndsAt).toBeGreaterThan(game.worldTimeMs);
  });

  it('supports many equipment slots and artifact loadouts', () => {
    const game = createGame(3, 'equip-seed');
    game.player.level = 20;
    const inventory: Item[] = EQUIPMENT_SLOTS.map((slot, index) => ({
      id: `item-${slot}`,
      slot,
      name: `Item ${index}`,
      quantity: 1,
      tier: 2,
      rarity: 'rare',
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
      healing: 0,
      hunger: 0,
    }));

    game.player.inventory = inventory;
    const equipped = inventory.reduce(
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
    const game = createGame(3, 'equip-level-too-low-seed');
    game.player.level = 3;
    game.player.inventory.push({
      id: 'level-locked-helm',
      slot: 'head',
      name: 'Level Locked Helm',
      quantity: 1,
      tier: 1,
      rarity: 'rare',
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      requiredLevel: 10,
    });

    const attempted = equipItem(game, 'level-locked-helm');

    expect(
      attempted.player.inventory.find(
        (item) => item.id === 'level-locked-helm',
      ),
    ).toBeDefined();
    expect(attempted.logs[0]?.text).toContain(
      'You need to be level 10 or higher to wear Level Locked Helm.',
    );
  });

  it('uses item tier as the default required level', () => {
    const game = createGame(3, 'equip-tier-as-requirement-seed');
    game.player.level = 3;
    game.player.inventory.push({
      id: 'tier-locked-helm',
      slot: 'head',
      name: 'Tier Locked Helm',
      quantity: 1,
      tier: 6,
      rarity: 'rare',
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const attempted = equipItem(game, 'tier-locked-helm');

    expect(
      attempted.player.inventory.find((item) => item.id === 'tier-locked-helm'),
    ).toBeDefined();
    expect(attempted.logs[0]?.text).toContain(
      'You need to be level 6 or higher to wear Tier Locked Helm.',
    );
  });

  it('allows equipping when player level meets requirement', () => {
    const game = createGame(3, 'equip-level-meets-requirement-seed');
    game.player.level = 10;
    game.player.inventory.push({
      id: 'level-locked-helm',
      slot: 'head',
      name: 'Level Locked Helm',
      quantity: 1,
      tier: 1,
      rarity: 'rare',
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      requiredLevel: 10,
    });

    const equipped = equipItem(game, 'level-locked-helm');

    expect(equipped.player.equipment.head?.id).toBe('level-locked-helm');
    expect(
      equipped.player.inventory.find((item) => item.id === 'level-locked-helm'),
    ).toBeUndefined();
  });
});
