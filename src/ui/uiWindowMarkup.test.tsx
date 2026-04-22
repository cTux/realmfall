import React from 'react';
import { getAbilityDefinition } from '../game/abilities';
import { EquipmentSlotId } from '../game/content/ids';
import { Skill } from '../game/types';
import { getItemConfigByKey, getPlayerStats } from '../game/stateSelectors';
import { createGame } from '../game/stateFactory';
import type { Item } from '../game/stateTypes';
import { DEFAULT_WINDOWS } from '../app/constants';
import { rarityColor } from './rarity';
import { CombatWindow } from './components/CombatWindow';
import { EquipmentWindow } from './components/EquipmentWindow';
import { GameTooltip } from './components/GameTooltip';
import { HeroWindow } from './components/HeroWindow';
import { HexInfoWindow } from './components/HexInfoWindow';
import { InventoryWindow } from './components/InventoryWindow';
import { LogWindow } from './components/LogWindow';
import { LootWindow } from './components/LootWindow';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { SkillsWindow } from './components/SkillsWindow';
import { renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';
import { DEFAULT_LOG_FILTERS } from '../app/constants';
import { WINDOW_LABELS } from './windowLabels';

setupUiTestEnvironment();

describe('ui window markup', () => {
  it('renders all major windows to static markup', async () => {
    const game = createGame(3, 'ui-render-seed');
    const stats = getPlayerStats(game.player);
    const equippedItem: Item = {
      id: 'equip-helm',
      slot: EquipmentSlotId.Head,
      name: 'Horned Helm',
      quantity: 1,
      tier: 2,
      rarity: 'uncommon',
      power: 0,
      defense: 2,
      maxHp: 1,
      healing: 0,
      hunger: 0,
    };
    const inventoryItem: Item = {
      id: 'resource-gold',
      name: 'Gold',
      quantity: 12,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };
    const combat = {
      coord: { q: 1, r: 0 },
      enemyIds: ['enemy-1'],
      player: {
        abilityIds: ['fireball', 'kick'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 900,
        cooldownEndsAt: { kick: 1000, fireball: 4500 },
        casting: {
          abilityId: 'fireball',
          targetId: 'enemy-1',
          endsAt: 500,
        },
      },
      started: false,
      enemies: {
        'enemy-1': {
          abilityIds: ['kick'] as Array<'kick'>,
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 900,
          cooldownEndsAt: { kick: 1000 },
          casting: null,
        },
      },
    };

    const markup = await renderMarkup(
      <>
        <HeroWindow
          position={DEFAULT_WINDOWS.hero}
          onMove={() => {}}
          stats={{
            ...stats,
            rawAttack: stats.attack + 2,
            rawDefense: stats.defense + 2,
            buffs: [],
            debuffs: ['hunger'],
            abilityIds: ['kick'],
          }}
          hunger={45}
        />
        <SkillsWindow
          position={DEFAULT_WINDOWS.skills}
          onMove={() => {}}
          skills={stats.skills}
        />
        <RecipeBookWindow
          position={DEFAULT_WINDOWS.recipes}
          onMove={() => {}}
          currentStructure="camp"
          recipes={[]}
          recipeSkillLevels={{
            [Skill.Gathering]: 1,
            [Skill.Logging]: 1,
            [Skill.Mining]: 1,
            [Skill.Skinning]: 1,
            [Skill.Fishing]: 1,
            [Skill.Cooking]: 1,
            [Skill.Smelting]: 1,
            [Skill.Crafting]: 1,
          }}
          inventoryCountsByItemKey={{}}
          materialFilterItemKey={null}
          onResetMaterialFilter={() => {}}
          onCraft={() => {}}
        />
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Forest"
          structure="Tree"
          enemyCount={0}
          interactLabel="Chop tree"
          canInteract
          canTerritoryAction
          territoryActionLabel="Cl(a)im"
          canBulkProspectEquipment={false}
          canBulkSellEquipment={false}
          territoryActionExplanation={null}
          bulkProspectEquipmentExplanation={null}
          bulkSellEquipmentExplanation={null}
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          structureHp={3}
          structureMaxHp={5}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[
            {
              item: equippedItem,
              price: 12,
            },
          ]}
          gold={20}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <EquipmentWindow
          position={DEFAULT_WINDOWS.equipment}
          onMove={() => {}}
          equipment={{ ...game.player.equipment, head: equippedItem }}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
          onUnequip={() => {}}
          onContextItem={() => {}}
        />
        <InventoryWindow
          position={DEFAULT_WINDOWS.inventory}
          onMove={() => {}}
          inventory={[inventoryItem, equippedItem]}
          equipment={{ ...game.player.equipment, head: equippedItem }}
          learnedRecipeIds={[]}
          onSort={() => {}}
          onActivateItem={() => {}}
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
          onContextItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <LootWindow
          position={DEFAULT_WINDOWS.loot}
          onMove={() => {}}
          loot={[inventoryItem, equippedItem]}
          equipment={{ ...game.player.equipment, head: equippedItem }}
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
          combat={combat}
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
              actor: combat.player,
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
    expect(markup).toContain('(Q) Gather');
    expect(markup).toContain('Structure HP');
    expect(markup).toContain('Town Stock');
    expect(markup).not.toContain('Enemies0');
    expect(markup).toContain('aria-label="armor"');
    expect(markup).toContain('x12');
    expect(markup).toContain('Empty');
    expect(markup).toContain('Tak(e) all');
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
    expect(markup).toContain(getItemConfigByKey('town-knife')?.icon ?? '');
  });

  it('shows explanations instead of unavailable prospect and sell buttons', async () => {
    const markup = await renderMarkup(
      <>
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Plains"
          structure="Forge"
          enemyCount={0}
          interactLabel={null}
          canInteract={false}
          canTerritoryAction={false}
          territoryActionLabel="Cl(a)im"
          canBulkProspectEquipment={false}
          canBulkSellEquipment={false}
          territoryActionExplanation={null}
          bulkProspectEquipmentExplanation="Nothing in your pack can be prospected."
          bulkSellEquipmentExplanation={null}
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[]}
          gold={0}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
        <HexInfoWindow
          position={DEFAULT_WINDOWS.hexInfo}
          onMove={() => {}}
          isHome={false}
          onSetHome={() => {}}
          terrain="Plains"
          structure="Town"
          enemyCount={0}
          interactLabel={null}
          canInteract={false}
          canTerritoryAction={false}
          territoryActionLabel="Cl(a)im"
          canBulkProspectEquipment={false}
          canBulkSellEquipment={false}
          territoryActionExplanation={null}
          bulkProspectEquipmentExplanation={null}
          bulkSellEquipmentExplanation="No equippable items to sell."
          onInteract={() => {}}
          onTerritoryAction={() => {}}
          onProspect={() => {}}
          onSellAll={() => {}}
          territoryName={null}
          territoryOwnerType={null}
          territoryNpc={null}
          townStock={[]}
          gold={0}
          onBuyItem={() => {}}
          onHoverItem={() => {}}
          onLeaveItem={() => {}}
        />
      </>,
    );

    expect(markup).toContain('Nothing in your pack can be prospected.');
    expect(markup).toContain('No equippable items to sell.');
    expect(markup).not.toContain('Sell all equippable');
    expect(markup).not.toContain('>Prospect<');
  });

  it('does not show empty-state text when a hex has an available interact action', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        position={DEFAULT_WINDOWS.hexInfo}
        onMove={() => {}}
        isHome={false}
        onSetHome={() => {}}
        terrain="Forest"
        structure="Tree"
        enemyCount={0}
        interactLabel="Chop tree"
        canInteract
        canTerritoryAction={false}
        territoryActionLabel="Cl(a)im"
        canBulkProspectEquipment={false}
        canBulkSellEquipment={false}
        territoryActionExplanation={null}
        bulkProspectEquipmentExplanation={null}
        bulkSellEquipmentExplanation={null}
        onInteract={() => {}}
        onTerritoryAction={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        territoryName={null}
        territoryOwnerType={null}
        territoryNpc={null}
        townStock={[]}
        gold={0}
        onBuyItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(markup).toContain('(Q) Gather');
    expect(markup).not.toContain('Nothing of note stirs here.');
  });

  it('keeps claim requirement copy out of the hex window body', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        position={DEFAULT_WINDOWS.hexInfo}
        onMove={() => {}}
        isHome={false}
        onSetHome={() => {}}
        terrain="Plains"
        structure={null}
        enemyCount={0}
        interactLabel={null}
        canInteract={false}
        canTerritoryAction={false}
        territoryActionLabel="Cl(a)im"
        territoryActionExplanation="Claiming needs 1 Cloth and 1 Sticks for a banner."
        canBulkProspectEquipment={false}
        canBulkSellEquipment={false}
        bulkProspectEquipmentExplanation={null}
        bulkSellEquipmentExplanation={null}
        onInteract={() => {}}
        onTerritoryAction={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        territoryName={null}
        territoryOwnerType={null}
        territoryNpc={null}
        townStock={[]}
        gold={0}
        onBuyItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    expect(markup).toContain('Cl(a)im');
    expect(markup).not.toContain(
      'Claiming needs 1 Cloth and 1 Sticks for a banner.',
    );
  });
});
