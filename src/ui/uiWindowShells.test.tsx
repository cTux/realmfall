import React, { act } from 'react';
import { vi } from 'vitest';
import { DEFAULT_WINDOWS } from '../app/constants';
import { GameTag } from '../game/content/tags';
import { createGame } from '../game/stateFactory';
import { getPlayerOverview } from '../game/stateSelectors';
import { Skill } from '../game/types';
import { EquipmentWindow } from './components/EquipmentWindow';
import { HeroWindow } from './components/HeroWindow';
import { ItemContextMenu } from './components/ItemContextMenu';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { SkillsWindow } from './components/SkillsWindow';
import { mountUi, renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';

setupUiTestEnvironment();

const RECIPE_SKILL_LEVELS = {
  [Skill.Gathering]: 1,
  [Skill.Logging]: 1,
  [Skill.Mining]: 1,
  [Skill.Skinning]: 1,
  [Skill.Fishing]: 1,
  [Skill.Cooking]: 1,
  [Skill.Smelting]: 1,
  [Skill.Crafting]: 1,
};

describe('ui window shell surfaces', () => {
  it('renders lock and recipe actions in the item context menu when available', async () => {
    const markup = await renderMarkup(
      <ItemContextMenu
        item={{
          id: 'iron-chunks',
          itemKey: 'iron-chunks',
          name: 'Iron Chunks',
          tags: [GameTag.ItemResource, GameTag.ItemCraftingMaterial],
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
          locked: true,
        }}
        x={100}
        y={120}
        canEquip={false}
        canUse={false}
        canToggleLock
        isLocked
        canShowRecipes
        canProspectItem
        canSellEntry
        onEquip={() => {}}
        onUse={() => {}}
        onDrop={() => {}}
        onToggleLock={() => {}}
        onShowRecipes={() => {}}
        onProspect={() => {}}
        onSell={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('Unlock');
    expect(markup).toContain('Show recipes');
    expect(markup).toContain('Prospect');
    expect(markup).toContain('Sell');
  });

  it('forwards close-button tooltip handlers through shared window shells', async () => {
    const hoverDetail = vi.fn();
    const game = createGame(2, 'window-tooltip-forwarding');
    const heroOverview = getPlayerOverview(game.player);
    const ui = await mountUi(
      <>
        <HeroWindow
          position={DEFAULT_WINDOWS.hero}
          onMove={() => {}}
          hero={{
            ...heroOverview,
            rawAttack: heroOverview.attack,
            rawDefense: heroOverview.defense,
            buffs: [],
            debuffs: [],
            abilityIds: ['kick'],
          }}
          hunger={50}
          onHoverDetail={hoverDetail}
          onLeaveDetail={() => {}}
        />
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipes={[]}
          recipeSkillLevels={RECIPE_SKILL_LEVELS}
          inventoryCountsByItemKey={{}}
          preferredSkill={null}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
          onHoverDetail={hoverDetail}
        />
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={game.player.equipment}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
          onHoverDetail={hoverDetail}
        />
      </>,
    );

    const closeButtons = Array.from(
      ui.host.querySelectorAll('button[aria-label="Close"]'),
    );
    expect(closeButtons).toHaveLength(3);

    await act(async () => {
      closeButtons.forEach((button) => {
        button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      });
    });

    expect(hoverDetail).toHaveBeenCalledTimes(3);

    await ui.unmount();
  });

  it('shows custom tooltips for empty equipment slots', async () => {
    const hoverDetail = vi.fn();
    const game = createGame(2, 'empty-slot-tooltip');
    const ui = await mountUi(
      <EquipmentWindow
        position={DEFAULT_WINDOWS.equipment}
        onMove={() => {}}
        equipment={game.player.equipment}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
        onUnequip={() => {}}
        onContextItem={() => {}}
        onHoverDetail={hoverDetail}
        onLeaveDetail={() => {}}
      />,
    );

    const emptyButtons = Array.from(ui.host.querySelectorAll('button')).filter(
      (button) => button.getAttribute('aria-label') === 'Weapon empty',
    );
    expect(emptyButtons).toHaveLength(1);

    await act(async () => {
      emptyButtons[0]?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Weapon',
      [
        {
          kind: 'text',
          text: 'Equip weapon gear here.',
        },
      ],
      'rgba(148, 163, 184, 0.9)',
    );

    await ui.unmount();
  });

  it('uses PascalCase skill labels for profession tooltip titles', async () => {
    const hoverDetail = vi.fn();
    const game = createGame(2, 'skills-tooltip-title');
    const heroOverview = getPlayerOverview(game.player);
    const ui = await mountUi(
      <SkillsWindow
        position={DEFAULT_WINDOWS.skills}
        onMove={() => {}}
        skills={heroOverview.skills}
        onHoverDetail={hoverDetail}
        onLeaveDetail={() => {}}
      />,
    );

    const craftingRow = Array.from(
      ui.host.querySelectorAll('div[class*="skillRow"]'),
    ).find((row) => row.textContent?.includes('crafting'));
    expect(craftingRow).not.toBeUndefined();

    await act(async () => {
      craftingRow?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(hoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      'Crafting',
      expect.any(Array),
      'rgba(56, 189, 248, 0.9)',
    );

    await ui.unmount();
  });
});
