import { getConsumableEffectDescriptors } from './consumables';
import { buildItemFromConfig } from './content/items';
import { createGame, useItem } from './state';

describe('consumable scaling', () => {
  it('describes consumables through one shared effect descriptor model', () => {
    expect(
      getConsumableEffectDescriptors(
        buildItemFromConfig('hunter-stew', {
          id: 'hunter-stew-descriptor',
        }),
      ),
    ).toEqual([
      { kind: 'foodRestorePercent', amount: 20 },
      { kind: 'hunger', amount: 60 },
      { kind: 'thirst', amount: 12 },
    ]);
    expect(
      getConsumableEffectDescriptors(
        buildItemFromConfig('mana-potion', {
          id: 'mana-potion-descriptor',
        }),
      ),
    ).toEqual([{ kind: 'manaPercent', amount: 35 }]);
    expect(
      getConsumableEffectDescriptors(
        buildItemFromConfig('home-scroll', {
          id: 'home-scroll-descriptor',
        }),
      ),
    ).toEqual([{ kind: 'homeScroll' }]);
  });

  it('restores at least 10 percent hp and mp from food', () => {
    const game = createGame(3, 'food-percent-floor-seed');
    const ration = buildItemFromConfig('trail-ration', {
      id: 'trail-ration-1',
    });
    game.player.inventory.push(ration);
    game.player.hp = 20;
    game.player.mana = 4;
    game.player.hunger = 80;

    const used = useItem(game, 'trail-ration-1');

    expect(used.player.hp).toBe(35);
    expect(used.player.mana).toBe(6);
    expect(used.player.hunger).toBe(92);
    expect(
      used.player.inventory.find((item) => item.id === 'trail-ration-1'),
    ).toBeUndefined();
  });

  it('uses the food healing rating as the percent restore value above the floor', () => {
    const game = createGame(3, 'food-percent-scale-seed');
    const stew = buildItemFromConfig('hunter-stew', {
      id: 'hunter-stew-1',
    });
    game.player.inventory.push(stew);
    game.player.hp = 20;
    game.player.mana = 4;
    game.player.hunger = 20;
    game.player.thirst = 40;

    const used = useItem(game, 'hunter-stew-1');

    expect(used.player.hp).toBe(50);
    expect(used.player.mana).toBe(7);
    expect(used.player.hunger).toBe(80);
    expect(used.player.thirst).toBe(52);
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
});
