import {
  canEquipItem,
  canUseItem,
  describeStructure,
  type EquipmentSlot,
  type GameState,
  type Item,
  type LogKind,
  getPlayerStats,
  type Tile,
} from '../../game/state';
import {
  DEFAULT_LOG_FILTERS,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import { HeroWindow } from '../../ui/components/HeroWindow';
import { SkillsWindow } from '../../ui/components/SkillsWindow';
import { HexInfoWindow } from '../../ui/components/HexInfoWindow';
import { EquipmentWindow } from '../../ui/components/EquipmentWindow';
import { InventoryWindow } from '../../ui/components/InventoryWindow';
import { RecipeBookWindow } from '../../ui/components/RecipeBookWindow';
import { LogWindow } from '../../ui/components/LogWindow';
import { GameTooltip } from '../../ui/components/GameTooltip';
import { CombatWindow } from '../../ui/components/CombatWindow';
import { LootWindow } from '../../ui/components/LootWindow';
import { ItemContextMenu } from '../../ui/components/ItemContextMenu';
import { WindowDock } from '../../ui/components/WindowDock';
import type { ItemContextMenuState, TooltipItem, TooltipState } from './types';
import { formatTerrainLabel } from './appHelpers';

interface AppWindowsProps {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  dockEntries: ReturnType<typeof import('./appHelpers').getDockEntries>;
  stats: ReturnType<typeof getPlayerStats>;
  game: GameState;
  currentTile: Tile;
  recipeBookKnown: boolean;
  recipes: ReturnType<typeof import('../../game/state').getRecipeBookRecipes>;
  inventoryCounts: Record<string, number>;
  interactLabel: string | null;
  canProspect: boolean;
  canSell: boolean;
  prospectExplanation: string | null;
  sellExplanation: string | null;
  townStock: ReturnType<typeof import('../../game/state').getTownStock>;
  gold: number;
  renderLootWindow: boolean;
  lootWindowVisible: boolean;
  lootSnapshot: Item[];
  renderCombatWindow: boolean;
  combatWindowVisible: boolean;
  combatSnapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof import('../../game/state').getEnemiesAt>;
  } | null;
  showFilterMenu: boolean;
  logFilters: Record<LogKind, boolean>;
  filteredLogs: GameState['logs'];
  tooltip: TooltipState | null;
  itemMenu: ItemContextMenuState | null;
  onMoveWindow: (
    key: keyof WindowPositions,
    position: WindowPositions[keyof WindowPositions],
  ) => void;
  onSetWindowVisibility: (
    key: keyof WindowVisibilityState,
    shown: boolean,
  ) => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  onShowItemTooltip: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
    equipped?: TooltipItem,
  ) => void;
  onCloseTooltip: () => void;
  onCloseItemMenu: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSort: () => void;
  onEquip: (itemId: string) => void;
  onUseItem: (itemId: string) => void;
  onCraftRecipe: (recipeId: string) => void;
  onDropItem: (itemId: string) => void;
  onDropEquippedItem: (slot: EquipmentSlot) => void;
  onContextItem: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
  ) => void;
  onEquippedContextItem: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
    slot: EquipmentSlot,
  ) => void;
  onTakeLootItem: (itemId: string) => void;
  onTakeAllLoot: () => void;
  onAttackEnemy: (enemyId: string) => void;
  onToggleFilterMenu: () => void;
  onToggleLogFilter: (kind: LogKind) => void;
  onEquipmentHover: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
  ) => void;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onBuyTownItem: (itemId: string) => void;
}

export function AppWindows({
  windows,
  windowShown,
  dockEntries,
  stats,
  game,
  currentTile,
  recipeBookKnown,
  recipes,
  inventoryCounts,
  interactLabel,
  canProspect,
  canSell,
  prospectExplanation,
  sellExplanation,
  townStock,
  gold,
  renderLootWindow,
  lootWindowVisible,
  lootSnapshot,
  renderCombatWindow,
  combatWindowVisible,
  combatSnapshot,
  showFilterMenu,
  logFilters,
  filteredLogs,
  tooltip,
  itemMenu,
  onMoveWindow,
  onSetWindowVisibility,
  onToggleDockWindow,
  onShowItemTooltip,
  onCloseTooltip,
  onCloseItemMenu,
  onUnequip,
  onSort,
  onEquip,
  onUseItem,
  onCraftRecipe,
  onDropItem,
  onDropEquippedItem,
  onContextItem,
  onEquippedContextItem,
  onTakeLootItem,
  onTakeAllLoot,
  onAttackEnemy,
  onToggleFilterMenu,
  onToggleLogFilter,
  onEquipmentHover,
  onInteract,
  onProspect,
  onSellAll,
  onBuyTownItem,
}: AppWindowsProps) {
  return (
    <>
      <WindowDock entries={dockEntries} onToggle={onToggleDockWindow} />

      <HeroWindow
        position={windows.hero}
        onMove={(position) => onMoveWindow('hero', position)}
        visible={windowShown.hero}
        onClose={() => onSetWindowVisibility('hero', false)}
        stats={stats}
        hunger={game.player.hunger}
      />
      <SkillsWindow
        position={windows.skills}
        onMove={(position) => onMoveWindow('skills', position)}
        visible={windowShown.skills}
        onClose={() => onSetWindowVisibility('skills', false)}
        skills={stats.skills}
      />
      <RecipeBookWindow
        position={windows.recipes}
        onMove={(position) => onMoveWindow('recipes', position)}
        visible={windowShown.recipes}
        onClose={() => onSetWindowVisibility('recipes', false)}
        hasRecipeBook={recipeBookKnown}
        currentStructure={describeStructure(currentTile.structure)}
        recipes={recipes}
        inventoryCounts={inventoryCounts}
        onCraft={onCraftRecipe}
      />
      <HexInfoWindow
        position={windows.hexInfo}
        onMove={(position) => onMoveWindow('hexInfo', position)}
        visible={windowShown.hexInfo}
        onClose={() => onSetWindowVisibility('hexInfo', false)}
        terrain={formatTerrainLabel(currentTile.terrain)}
        structure={describeStructure(currentTile.structure)}
        enemyCount={
          game.combat
            ? (combatSnapshot?.enemies.length ?? 0)
            : currentTile.enemyIds.length
        }
        interactLabel={interactLabel}
        canInteract={Boolean(interactLabel)}
        canProspect={canProspect}
        canSell={canSell}
        prospectExplanation={prospectExplanation}
        sellExplanation={sellExplanation}
        onInteract={onInteract}
        onProspect={onProspect}
        onSellAll={onSellAll}
        structureHp={currentTile.structureHp}
        structureMaxHp={currentTile.structureMaxHp}
        townStock={townStock}
        gold={gold}
        onBuyItem={onBuyTownItem}
        onHoverItem={onShowItemTooltip}
        onLeaveItem={onCloseTooltip}
      />
      <EquipmentWindow
        position={windows.equipment}
        onMove={(position) => onMoveWindow('equipment', position)}
        visible={windowShown.equipment}
        onClose={() => onSetWindowVisibility('equipment', false)}
        equipment={game.player.equipment}
        onHoverItem={onEquipmentHover}
        onLeaveItem={onCloseTooltip}
        onUnequip={onUnequip}
        onContextItem={onEquippedContextItem}
      />
      <InventoryWindow
        position={windows.inventory}
        onMove={(position) => onMoveWindow('inventory', position)}
        visible={windowShown.inventory}
        onClose={() => onSetWindowVisibility('inventory', false)}
        inventory={game.player.inventory}
        equipment={game.player.equipment}
        onSort={onSort}
        onEquip={onEquip}
        onContextItem={onContextItem}
        onHoverItem={onShowItemTooltip}
        onLeaveItem={onCloseTooltip}
      />
      {renderLootWindow ? (
        <LootWindow
          position={windows.loot}
          onMove={(position) => onMoveWindow('loot', position)}
          visible={windowShown.loot && lootWindowVisible}
          loot={lootSnapshot}
          equipment={game.player.equipment}
          onClose={() => onSetWindowVisibility('loot', false)}
          onTakeAll={onTakeAllLoot}
          onTakeItem={onTakeLootItem}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
        />
      ) : null}
      {itemMenu ? (
        <ItemContextMenu
          item={itemMenu.item}
          x={itemMenu.x}
          y={itemMenu.y}
          equipLabel={itemMenu.slot ? 'Unequip' : 'Equip'}
          canEquip={itemMenu.slot ? true : canEquipItem(itemMenu.item)}
          canUse={canUseItem(itemMenu.item)}
          onEquip={() => {
            if (itemMenu.slot) {
              onUnequip(itemMenu.slot);
            } else {
              onEquip(itemMenu.item.id);
            }
            onCloseItemMenu();
          }}
          onUse={() => {
            onUseItem(itemMenu.item.id);
            onCloseItemMenu();
          }}
          onDrop={() => {
            if (itemMenu.slot) {
              onDropEquippedItem(itemMenu.slot);
            } else {
              onDropItem(itemMenu.item.id);
            }
            onCloseItemMenu();
          }}
          onClose={onCloseItemMenu}
        />
      ) : null}
      <LogWindow
        position={windows.log}
        onMove={(position) => onMoveWindow('log', position)}
        visible={windowShown.log}
        onClose={() => onSetWindowVisibility('log', false)}
        filters={logFilters}
        defaultFilters={DEFAULT_LOG_FILTERS}
        showFilterMenu={showFilterMenu}
        onToggleMenu={onToggleFilterMenu}
        onToggleFilter={onToggleLogFilter}
        logs={filteredLogs}
      />
      {renderCombatWindow && combatSnapshot ? (
        <CombatWindow
          position={windows.combat}
          onMove={(position) => onMoveWindow('combat', position)}
          visible={windowShown.combat && combatWindowVisible}
          onClose={() => onSetWindowVisibility('combat', false)}
          combat={combatSnapshot.combat}
          enemies={combatSnapshot.enemies}
          player={{
            hp: stats.hp,
            maxHp: stats.maxHp,
            attack: stats.attack,
            defense: stats.defense,
          }}
          onAttack={onAttackEnemy}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} />
    </>
  );
}
