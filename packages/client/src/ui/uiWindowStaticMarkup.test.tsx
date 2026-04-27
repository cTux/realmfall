import React from 'react';
import { Tooltip as GameTooltip } from '@realmfall/ui';
import { getAbilityDefinition } from '../game/abilities';
import { getItemConfigByKey, getPlayerOverview } from '../game/stateSelectors';
import { DEFAULT_WINDOWS } from '../app/constants';
import { rarityColor } from './rarity';
import { CombatWindow } from './components/CombatWindow';
import { EquipmentWindow } from './components/EquipmentWindow';
import { HeroWindow } from './components/HeroWindow';
import { HexInfoWindow } from './components/HexInfoWindow';
import { InventoryWindow } from './components/InventoryWindow';
import { LogWindow } from './components/LogWindow';
import { LootWindow } from './components/LootWindow';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { SkillsWindow } from './components/SkillsWindow';
import { renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';
import { DEFAULT_LOG_FILTERS } from '../app/constants';
import { resolveIconAsset } from './iconAssets';
import { WINDOW_LABELS } from './windowLabels';
import {
  buildBaseHexInfoProps,
  combatWindowState,
  createWindowMarkupGame,
  equippedWindowItem,
  inventoryWindowItem,
  recipeWindowSkillLevels,
} from './uiWindowMarkupTestHelpers';

setupUiTestEnvironment();

describe('ui window static markup', () => {
  it('renders all major windows to static markup', async () => {
    const game = createWindowMarkupGame();
    const heroOverview = getPlayerOverview(game.player);

    const markup = await renderMarkup(
      <>
        <HeroWindow
          position={DEFAULT_WINDOWS.hero}
          onMove={() => {}}
          hero={{
            ...heroOverview,
            rawAttack: heroOverview.attack + 2,
            rawDefense: heroOverview.defense + 2,
            buffs: [],
            debuffs: ['hunger'],
            abilityIds: ['kick'],
          }}
          hunger={45}
        />
        <SkillsWindow
          position={DEFAULT_WINDOWS.skills}
          onMove={() => {}}
          skills={heroOverview.skills}
        />
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipes={[]}
          recipeSkillLevels={recipeWindowSkillLevels}
          inventoryCountsByItemKey={{}}
          preferredSkill={null}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
          onToggleFavoriteRecipe={() => {}}
        />
        <HexInfoWindow
          {...buildBaseHexInfoProps()}
          terrain="Forest"
          structure="Tree"
          interactLabel="Chop tree"
          canInteract
          canTerritoryAction
          territoryActionLabel="Cl(a)im"
          canHealTerritoryNpc
          canBulkSellEquipment
          structureHp={3}
          structureMaxHp={5}
          territoryNpc={{ name: 'Araken' }}
          townStock={[
            {
              item: equippedWindowItem,
              price: 12,
            },
          ]}
          gold={20}
        />
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={{ ...game.player.equipment, head: equippedWindowItem }}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
        />
        <InventoryWindow
          position={DEFAULT_WINDOWS.inventory}
          onMove={() => {}}
          inventory={[inventoryWindowItem, equippedWindowItem]}
          equipment={{ ...game.player.equipment, head: equippedWindowItem }}
          learnedRecipeIds={[]}
          onSort={() => {}}
          onActivateItem={() => {}}
          onSellItem={() => {}}
          onContextItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <InventoryWindow
          position={DEFAULT_WINDOWS.inventory}
          onMove={() => {}}
          inventory={[]}
          equipment={game.player.equipment}
          learnedRecipeIds={[]}
          onSort={() => {}}
          onActivateItem={() => {}}
          onSellItem={() => {}}
          onContextItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LootWindow
          position={DEFAULT_WINDOWS.loot}
          onMove={() => {}}
          loot={[inventoryWindowItem, equippedWindowItem]}
          equipment={{ ...game.player.equipment, head: equippedWindowItem }}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LootWindow
          position={DEFAULT_WINDOWS.loot}
          onMove={() => {}}
          loot={[]}
          equipment={game.player.equipment}
          onClose={() => {}}
          onTakeAll={() => {}}
          onTakeItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LogWindow
          position={DEFAULT_WINDOWS.log}
          onMove={() => {}}
          filters={DEFAULT_LOG_FILTERS}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu
          onToggleMenu={() => {}}
          onToggleFilter={() => {}}
          logs={game.logs.slice(0, 2)}
        />
        <CombatWindow
          position={DEFAULT_WINDOWS.combat}
          onMove={() => {}}
          combat={combatWindowState}
          playerParty={[
            {
              id: 'player',
              name: 'Player',
              level: 10,
              hp: 20,
              maxHp: 30,
              mana: 12,
              maxMana: 20,
              attack: 9,
              actor: combatWindowState.player,
              buffs: [],
              debuffs: [],
            },
          ]}
          enemies={[
            {
              id: 'enemy-1',
              name: 'Marauder',
              coord: { q: 1, r: 0 },
              rarity: 'epic',
              tier: 3,
              hp: 6,
              maxHp: 10,
              attack: 5,
              defense: 2,
              xp: 12,
              elite: true,
            },
          ]}
          worldTimeMs={0}
          onStart={() => {}}
          onHoverDetail={() => {}}
          onLeaveDetail={() => {}}
        />
        <GameTooltip
          tooltip={{
            title: 'Knight Blade',
            x: 50,
            y: 70,
            borderColor: rarityColor('rare'),
            lines: [
              { kind: 'text', text: 'RARE TIER 2 WEAPON' },
              {
                kind: 'stat',
                label: 'Attack',
                value: '+4',
                tone: 'item',
                icon: getItemConfigByKey('town-knife')?.icon,
              },
              { kind: 'stat', label: 'Defense', value: '+1', tone: 'item' },
              { kind: 'bar', label: 'HP', current: 3, max: 10 },
            ],
          }}
        />
        <GameTooltip tooltip={null} />
      </>,
    );

    expect(markup).toContain(WINDOW_LABELS.hero.suffix);
    expect(markup).toContain('Hunger');
    expect(markup).toContain('Attack');
    expect(markup).toContain('Defense');
    expect(markup).toContain(')kills');
    expect(markup).toContain('logging');
    expect(markup).toContain('Lv 1 - 0/8');
    expect(markup).not.toContain(
      'gathering level equals the percent chance to pull +1 extra resource',
    );
    expect(markup).toContain(WINDOW_LABELS.recipes.suffix);
    expect(markup).toContain(WINDOW_LABELS.hexInfo.suffix);
    expect(markup).toContain('Cl(a)im');
    expect(markup).toContain('(Q) Heal');
    expect(markup).toContain('H(o)me');
    expect(markup).toContain('(Q) Gather');
    expect(markup).toContain('Structure HP');
    expect(markup).toContain('12');
    expect(markup).toContain('aria-label="Gold"');
    expect(markup).not.toContain('gp');
    expect(markup).not.toContain('Enemies0');
    expect(markup).not.toContain('Forest');
    expect(markup).not.toContain('Tree');
    expect(markup).toContain('aria-label="armor"');
    expect(markup).toContain('x12');
    expect(markup).toContain('Empty');
    expect(markup).toContain('Tak(e) all');
    expect(markup).toContain('S(e)ll all');
    expect(markup).toContain('Filters');
    expect(markup).toContain('Epic');
    expect(markup).toContain('Player Lv 10');
    expect(markup).toContain('Marauder Lv 3');
    expect(markup).toContain('MP');
    expect(markup).not.toContain('Casting');
    expect(markup).toContain('Kick');
    expect(markup).toContain(getAbilityDefinition('fireball').name);
    expect(markup).toContain('(Q) Start');
    expect(markup).toContain('Knight Blade');
    expect(markup).toContain(
      resolveIconAsset(getItemConfigByKey('town-knife')?.icon ?? ''),
    );
  });
});
