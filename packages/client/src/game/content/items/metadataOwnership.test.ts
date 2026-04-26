import { describe, expect, it } from 'vitest';
import { GAME_TAGS } from '../tags';
import { CRAFTABLE_ICON_ITEM_CONFIGS } from '../generatedCraftingEquipment';
import { GENERATED_ICON_POOLS } from '../generatedEquipment';
import { campSpearItemConfig } from './campSpear';
import { clothItemConfig } from './cloth';
import { flaxItemConfig } from './flax';
import { hearthTotemItemConfig } from './hearthTotem';
import { hideBucklerItemConfig } from './hideBuckler';
import { logsItemConfig } from './logs';
import { stringItemConfig } from './string';

describe('item config metadata ownership', () => {
  it('keeps handcrafted item metadata on the owning configs', () => {
    expect(campSpearItemConfig.iconPool).toEqual(
      GENERATED_ICON_POOLS.twoHandedSword,
    );
    expect(campSpearItemConfig.tags).toEqual(
      expect.arrayContaining([GAME_TAGS.item.crafted]),
    );

    expect(logsItemConfig.tags).toEqual(
      expect.arrayContaining([
        GAME_TAGS.item.gathered,
        GAME_TAGS.item.wood,
        GAME_TAGS.item.craftingMaterial,
      ]),
    );

    expect(clothItemConfig.tags).toEqual(
      expect.arrayContaining([
        GAME_TAGS.item.cloth,
        GAME_TAGS.item.prospectable,
        GAME_TAGS.item.craftingMaterial,
      ]),
    );
    expect(flaxItemConfig.tags).toEqual(
      expect.arrayContaining([
        GAME_TAGS.item.gathered,
        GAME_TAGS.item.craftingMaterial,
        GAME_TAGS.item.cloth,
      ]),
    );
    expect(stringItemConfig.tags).toEqual(
      expect.arrayContaining([
        GAME_TAGS.item.gathered,
        GAME_TAGS.item.craftingMaterial,
      ]),
    );
  });

  it('keeps offhand item ability metadata on the owning configs', () => {
    expect(hideBucklerItemConfig.grantedAbilityPool).toBeTruthy();
    expect(hearthTotemItemConfig.category).toBe('artifact');
    expect(hearthTotemItemConfig.iconPool).toEqual(
      GENERATED_ICON_POOLS.magicalSphere,
    );
    expect(hearthTotemItemConfig.grantedAbilityPool).toBeTruthy();
    expect(hearthTotemItemConfig.tags).toEqual(
      expect.arrayContaining([
        GAME_TAGS.item.crafted,
        GAME_TAGS.item.mana,
        GAME_TAGS.item.totem,
      ]),
    );
  });

  it('keeps craftable icon offhand ability metadata on the family configs', () => {
    const magicalSphere = CRAFTABLE_ICON_ITEM_CONFIGS.find(
      (config) => config.key === 'icon-magical-sphere-01',
    );
    const shield = CRAFTABLE_ICON_ITEM_CONFIGS.find(
      (config) => config.key === 'icon-shield-01',
    );

    expect(magicalSphere?.grantedAbilityPool).toBeTruthy();
    expect(shield?.grantedAbilityPool).toBeTruthy();
  });
});
