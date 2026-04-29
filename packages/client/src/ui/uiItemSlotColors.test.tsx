import { renderToStaticMarkup } from 'react-dom/server';
import { ItemSlot as SharedItemSlotButton } from '@realmfall/ui';
import { buildItemFromConfig } from '../game/content/items';
import { ItemId } from '../game/content/ids';
import { GameTag } from '../game/content/tags';
import type { Item } from '../game/stateTypes';
import { ItemSlotButton as ClientItemSlotButton } from './components/ItemSlotButton/ItemSlotButton';

describe('ui item slot colors', () => {
  it('keeps rarity borders while splitting equippable tint within the same themed set', () => {
    const rareStormBlade = buildItemFromConfig('storm-blade', {
      id: 'storm-blade-rare',
      rarity: 'rare',
    });
    const rareStormCloak = buildItemFromConfig('storm-cloak', {
      id: 'storm-cloak-rare',
      rarity: 'rare',
    });

    const bladeMarkup = renderToStaticMarkup(
      <SharedItemSlotButton item={rareStormBlade} size="compact" />,
    );
    const cloakMarkup = renderToStaticMarkup(
      <SharedItemSlotButton item={rareStormCloak} size="compact" />,
    );

    expect(bladeMarkup).toContain('border-color:#60a5fa');
    expect(bladeMarkup).toContain(
      'box-shadow:inset 0 0 0 1px #60a5fa, inset 0 10px 18px -14px #60a5fa, inset 0 -14px 20px -18px rgba(0, 0, 0, 0.85)',
    );
    expect(bladeMarkup).toContain('background-color:#67e8f9');
    expect(cloakMarkup).toContain('border-color:#60a5fa');
    expect(cloakMarkup).toContain(
      'box-shadow:inset 0 0 0 1px #60a5fa, inset 0 10px 18px -14px #60a5fa, inset 0 -14px 20px -18px rgba(0, 0, 0, 0.85)',
    );
    expect(cloakMarkup).toContain('background-color:#14b8a6');
  });

  it('uses a white border for non-equippable items while keeping their configured tint', () => {
    const gold = buildItemFromConfig(ItemId.Gold, {
      id: 'gold-stack',
      quantity: 12,
    });

    const markup = renderToStaticMarkup(
      <SharedItemSlotButton item={gold} size="compact" />,
    );

    expect(markup).toContain('border-color:#f8fafc');
    expect(markup).toContain(
      'box-shadow:inset 0 0 0 1px #f8fafc, inset 0 10px 18px -14px #f8fafc, inset 0 -14px 20px -18px rgba(0, 0, 0, 0.85)',
    );
    expect(markup).toContain('background-color:#fbbf24');
  });

  it('keeps white borders while tinting produce and crafted meals from their icon families', () => {
    const pepper = buildItemFromConfig('pepper', {
      id: 'pepper-stack',
      quantity: 3,
    });
    const beetTonic = buildItemFromConfig('beet-tonic', {
      id: 'beet-tonic-stack',
      quantity: 1,
    });

    const pepperMarkup = renderToStaticMarkup(
      <SharedItemSlotButton item={pepper} size="compact" />,
    );
    const beetTonicMarkup = renderToStaticMarkup(
      <SharedItemSlotButton item={beetTonic} size="compact" />,
    );

    expect(pepperMarkup).toContain('border-color:#f8fafc');
    expect(pepperMarkup).toContain('background-color:#22c55e');
    expect(beetTonicMarkup).toContain('border-color:#f8fafc');
    expect(beetTonicMarkup).toContain('background-color:#b91c1c');
  });

  it('renders recipe pages as green scroll-quill icons with a white border', () => {
    const recipePage: Item = {
      id: 'recipe-craft-weapon',
      itemKey: ItemId.RecipeBook,
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    };

    const markup = renderToStaticMarkup(
      <SharedItemSlotButton item={recipePage} size="compact" />,
    );

    expect(markup).toContain('background-color:#22c55e');
    expect(markup).toContain('border-color:#f8fafc');
    expect(markup).not.toContain('recipe.svg');
  });

  it('treats dagger-family equippables as metal gear instead of neutral fallback', () => {
    const parryingDagger: Item = {
      id: 'generated-offhand-dagger-1',
      itemKey: 'generated-offhand-dagger',
      name: 'Parrying Dagger',
      slot: 'offhand',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 2,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    };

    const markup = renderToStaticMarkup(
      <SharedItemSlotButton item={parryingDagger} size="compact" />,
    );

    expect(markup).toContain('background-color:#94a3b8');
    expect(markup).not.toContain('background-color:#cbd5e1');
  });

  it('renders exact-color edge-wash inset shadows for client slot rgba border overrides', () => {
    const townKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-rgba-border',
    });

    const markup = renderToStaticMarkup(
      <ClientItemSlotButton
        item={townKnife}
        size="compact"
        borderColorOverride="rgba(96, 165, 250, 0.58)"
      />,
    );

    expect(markup).toContain('border-color:rgba(96, 165, 250, 0.58)');
    expect(markup).toContain(
      'box-shadow:inset 0 0 0 1px rgba(96, 165, 250, 0.58), inset 0 10px 18px -14px rgba(96, 165, 250, 0.58), inset 0 -14px 20px -18px rgba(0, 0, 0, 0.85)',
    );
  });

  it('renders exact-color edge-wash inset shadows for shared slot rgb border overrides', () => {
    const townKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-rgb-border',
    });

    const markup = renderToStaticMarkup(
      <SharedItemSlotButton
        item={townKnife}
        size="compact"
        borderColorOverride="rgb(96, 165, 250)"
      />,
    );

    expect(markup).toContain('border-color:rgb(96, 165, 250)');
    expect(markup).toContain(
      'box-shadow:inset 0 0 0 1px rgb(96, 165, 250), inset 0 10px 18px -14px rgb(96, 165, 250), inset 0 -14px 20px -18px rgba(0, 0, 0, 0.85)',
    );
  });
});
