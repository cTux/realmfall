import { describe, expect, it, vi } from 'vitest';
import { buildItemFromConfig } from './stateLockedChestsTestkit';
import { ItemId } from './content/ids';
import * as lockedChestRules from './lockedChests';
import { createGame, getTileAt, Skill, useItem } from './state';

function createLockedChestGame(
  seed: string,
  itemKey: ItemId.Lockpick | ItemId.ChestKey,
  lockpickingLevel = 1,
) {
  const game = createGame(3, seed);
  game.player.coord = { q: 0, r: 0 };
  game.tiles['0,0'] = {
    ...game.tiles['0,0']!,
    coord: { q: 0, r: 0 },
    terrain: 'plains',
    structure: 'locked-chest',
    items: [],
    enemyIds: [],
  };
  game.player.skills[Skill.Lockpicking].level = lockpickingLevel;
  game.player.inventory.push(
    buildItemFromConfig(itemKey, {
      id: itemKey === ItemId.Lockpick ? 'lockpick-1' : 'chest-key-1',
    }),
  );
  return game;
}

describe('locked chest item actions', () => {
  it('refuses chest openers away from a locked chest tile without consuming them', () => {
    const game = createGame(3, 'no-chest-lockpick');
    game.player.inventory.push(
      buildItemFromConfig(ItemId.Lockpick, { id: 'lockpick-1' }),
    );

    const blocked = useItem(game, 'lockpick-1');

    expect(
      blocked.player.inventory.find((item) => item.id === 'lockpick-1'),
    ).toBeDefined();
    expect(blocked.logs[0]?.text).toContain(
      'can only be used on a locked chest',
    );
  });

  it('breaks a lockpick on failed ordinary chest use and leaves the chest closed', () => {
    vi.spyOn(lockedChestRules, 'isLockedChestMimic').mockReturnValue(false);
    vi.spyOn(lockedChestRules, 'getLockpickBreakChance').mockReturnValue(1);

    const failed = useItem(
      createLockedChestGame('lockpick-fail-seed', ItemId.Lockpick, 1),
      'lockpick-1',
    );

    expect(getTileAt(failed, failed.player.coord).structure).toBe(
      'locked-chest',
    );
    expect(getTileAt(failed, failed.player.coord).items).toEqual([]);
    expect(
      failed.player.inventory.find((item) => item.id === 'lockpick-1'),
    ).toBeUndefined();
    expect(failed.player.skills[Skill.Lockpicking].xp).toBe(1);
  });

  it('opens an ordinary chest on lockpick success, consumes the item, drops loot, and grants one lockpicking xp', () => {
    vi.spyOn(lockedChestRules, 'isLockedChestMimic').mockReturnValue(false);
    vi.spyOn(lockedChestRules, 'getLockpickBreakChance').mockReturnValue(0);

    const opened = useItem(
      createLockedChestGame('lockpick-success-seed', ItemId.Lockpick, 100),
      'lockpick-1',
    );

    expect(getTileAt(opened, opened.player.coord).structure).toBeUndefined();
    expect(getTileAt(opened, opened.player.coord).items).toHaveLength(1);
    expect(
      opened.player.inventory.find((item) => item.id === 'lockpick-1'),
    ).toBeUndefined();
    expect(opened.player.skills[Skill.Lockpicking].xp).toBe(1);
  });

  it('opens an ordinary chest with a chest key and does not grant lockpicking xp', () => {
    vi.spyOn(lockedChestRules, 'isLockedChestMimic').mockReturnValue(false);

    const opened = useItem(
      createLockedChestGame('key-open-seed', ItemId.ChestKey, 1),
      'chest-key-1',
    );

    expect(getTileAt(opened, opened.player.coord).structure).toBeUndefined();
    expect(getTileAt(opened, opened.player.coord).items).toHaveLength(1);
    expect(
      opened.player.inventory.find((item) => item.id === 'chest-key-1'),
    ).toBeUndefined();
    expect(opened.player.skills[Skill.Lockpicking].xp).toBe(0);
  });

  it('reveals a mimic, consumes the opener, removes the chest structure, and starts combat immediately', () => {
    vi.spyOn(lockedChestRules, 'isLockedChestMimic').mockReturnValue(true);

    const revealed = useItem(
      createLockedChestGame('mimic-reveal-seed', ItemId.Lockpick, 1),
      'lockpick-1',
    );

    expect(
      getTileAt(revealed, revealed.player.coord).structure,
    ).toBeUndefined();
    expect(
      revealed.player.inventory.find((item) => item.id === 'lockpick-1'),
    ).toBeUndefined();
    expect(revealed.player.skills[Skill.Lockpicking].xp).toBe(1);
    expect(revealed.combat?.started).toBe(true);
    expect(revealed.combat?.enemyIds).toHaveLength(1);
    expect(revealed.enemies[revealed.combat!.enemyIds[0]!]!.enemyTypeId).toBe(
      'mimic',
    );
  });
});
