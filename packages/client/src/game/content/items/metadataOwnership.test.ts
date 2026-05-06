import { describe, expect, it } from 'vitest';
import { GAME_TAGS } from '../tags';
import { CRAFTABLE_ICON_ITEM_CONFIGS } from '../generatedCraftingEquipment';
import { GENERATED_EQUIPMENT_FAMILIES } from '../generatedEquipmentFamilies';
import { EquipmentSlotId } from '../ids';
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

  it('keeps generated crafting ingredient and declarative ring metadata on the family configs', () => {
    const ringFamily = GENERATED_EQUIPMENT_FAMILIES.find(
      (family) => family.familyKey === 'ring' && family.craft !== undefined,
    );
    const ringCraft = ringFamily?.craft;
    const swordCraft = GENERATED_EQUIPMENT_FAMILIES.find(
      (family) => family.familyKey === 'sword' && family.craft !== undefined,
    )?.craft;
    const magicalSphereCraft = GENERATED_EQUIPMENT_FAMILIES.find(
      (family) =>
        family.familyKey === 'magicalSphere' && family.craft !== undefined,
    )?.craft;

    expect(
      GENERATED_EQUIPMENT_FAMILIES.filter(
        (family) => family.familyKey === 'ring',
      ),
    ).toHaveLength(1);
    expect(ringFamily?.ring?.mirroredDropVariants).toEqual([
      { key: 'generated-ring-left', slot: EquipmentSlotId.RingLeft },
      { key: 'generated-ring-right', slot: EquipmentSlotId.RingRight },
    ]);
    expect(ringFamily?.ring?.craftedSlotDistribution).toEqual({
      slots: [EquipmentSlotId.RingLeft, EquipmentSlotId.RingRight],
      oddCountBias: 'first',
    });
    expect(ringCraft?.slot).toBe(EquipmentSlotId.RingLeft);

    expect(swordCraft?.ingredients).toEqual([
      { kind: 'redistributed-ingot', quantity: 2 },
      { itemKey: 'sticks', quantity: 1 },
    ]);
    expect(magicalSphereCraft?.ingredients).toEqual([
      { itemKey: 'gold-ingot', quantity: 2 },
      { itemKey: 'platinum-ingot', quantity: 1 },
      { itemKey: 'arcane-dust', quantity: 3 },
    ]);
  });
});
