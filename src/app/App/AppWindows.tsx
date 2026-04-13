import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type MutableRefObject,
} from 'react';
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
import { GameTooltip } from '../../ui/components/GameTooltip';
import { HeroWindow } from '../../ui/components/HeroWindow';
import { WindowLoadingState } from '../../ui/components/WindowLoadingState';
import { WindowDock } from '../../ui/components/WindowDock';
import type { ItemContextMenuState, TooltipItem, TooltipState } from './types';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { TooltipLine } from '../../ui/tooltips';
import { formatTerrainLabel } from './appHelpers';

const SkillsWindow = lazy(() =>
  import('../../ui/components/SkillsWindow').then((module) => ({
    default: module.SkillsWindow,
  })),
);

const HexInfoWindow = lazy(() =>
  import('../../ui/components/HexInfoWindow').then((module) => ({
    default: module.HexInfoWindow,
  })),
);

const EquipmentWindow = lazy(() =>
  import('../../ui/components/EquipmentWindow').then((module) => ({
    default: module.EquipmentWindow,
  })),
);

const InventoryWindow = lazy(() =>
  import('../../ui/components/InventoryWindow').then((module) => ({
    default: module.InventoryWindow,
  })),
);

const RecipeBookWindow = lazy(() =>
  import('../../ui/components/RecipeBookWindow').then((module) => ({
    default: module.RecipeBookWindow,
  })),
);

const LogWindow = lazy(() =>
  import('../../ui/components/LogWindow').then((module) => ({
    default: module.LogWindow,
  })),
);

const CombatWindow = lazy(() =>
  import('../../ui/components/CombatWindow').then((module) => ({
    default: module.CombatWindow,
  })),
);

const LootWindow = lazy(() =>
  import('../../ui/components/LootWindow').then((module) => ({
    default: module.LootWindow,
  })),
);

const ItemContextMenu = lazy(() =>
  import('../../ui/components/ItemContextMenu').then((module) => ({
    default: module.ItemContextMenu,
  })),
);

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
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
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
  onShowTooltip: (
    event: React.MouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
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
  onStartCombat: () => void;
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
  onSetHome: () => void;
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
  tooltipPositionRef,
  itemMenu,
  onMoveWindow,
  onSetWindowVisibility,
  onToggleDockWindow,
  onShowItemTooltip,
  onShowTooltip,
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
  onStartCombat,
  onToggleFilterMenu,
  onToggleLogFilter,
  onEquipmentHover,
  onInteract,
  onProspect,
  onSellAll,
  onBuyTownItem,
  onSetHome,
}: AppWindowsProps) {
  const [loadedWindows, setLoadedWindows] = useState(() => ({
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: renderLootWindow,
    log: windowShown.log,
    combat: renderCombatWindow,
  }));

  useEffect(() => {
    setLoadedWindows((current) => {
      const next = {
        skills: current.skills || windowShown.skills,
        recipes: current.recipes || windowShown.recipes,
        hexInfo: current.hexInfo || windowShown.hexInfo,
        equipment: current.equipment || windowShown.equipment,
        inventory: current.inventory || windowShown.inventory,
        loot: current.loot || renderLootWindow,
        log: current.log || windowShown.log,
        combat: current.combat || renderCombatWindow,
      };

      return Object.keys(next).every(
        (key) =>
          current[key as keyof typeof current] ===
          next[key as keyof typeof next],
      )
        ? current
        : next;
    });
  }, [renderCombatWindow, renderLootWindow, windowShown]);

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
        thirst={game.player.thirst}
        worldTimeMs={game.worldTimeMs}
        onHoverDetail={onShowTooltip}
        onLeaveDetail={onCloseTooltip}
      />
      {loadedWindows.skills ? (
        <Suspense fallback={<WindowLoadingState />}>
          <SkillsWindow
            position={windows.skills}
            onMove={(position) => onMoveWindow('skills', position)}
            visible={windowShown.skills}
            onClose={() => onSetWindowVisibility('skills', false)}
            skills={stats.skills}
          />
        </Suspense>
      ) : null}
      {loadedWindows.recipes ? (
        <Suspense fallback={<WindowLoadingState />}>
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
        </Suspense>
      ) : null}
      {loadedWindows.hexInfo ? (
        <Suspense fallback={<WindowLoadingState />}>
          <HexInfoWindow
            position={windows.hexInfo}
            onMove={(position) => onMoveWindow('hexInfo', position)}
            visible={windowShown.hexInfo}
            onClose={() => onSetWindowVisibility('hexInfo', false)}
            isHome={
              game.homeHex.q === game.player.coord.q &&
              game.homeHex.r === game.player.coord.r
            }
            onSetHome={onSetHome}
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
        </Suspense>
      ) : null}
      {loadedWindows.equipment ? (
        <Suspense fallback={<WindowLoadingState />}>
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
        </Suspense>
      ) : null}
      {loadedWindows.inventory ? (
        <Suspense fallback={<WindowLoadingState />}>
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
        </Suspense>
      ) : null}
      {loadedWindows.loot ? (
        <Suspense fallback={<WindowLoadingState />}>
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
        </Suspense>
      ) : null}
      {itemMenu ? (
        <Suspense fallback={null}>
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
        </Suspense>
      ) : null}
      {loadedWindows.log ? (
        <Suspense fallback={<WindowLoadingState />}>
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
        </Suspense>
      ) : null}
      {loadedWindows.combat && combatSnapshot ? (
        <Suspense fallback={<WindowLoadingState />}>
          <CombatWindow
            position={windows.combat}
            onMove={(position) => onMoveWindow('combat', position)}
            visible={windowShown.combat && combatWindowVisible}
            onClose={() => onSetWindowVisibility('combat', false)}
            combat={combatSnapshot.combat}
            playerParty={[
              {
                id: 'player',
                name: 'Player',
                level: stats.level,
                hp: stats.hp,
                maxHp: stats.maxHp,
                mana: game.player.mana,
                maxMana: stats.maxMana,
                actor: combatSnapshot.combat.player,
              },
            ]}
            enemies={combatSnapshot.enemies}
            worldTimeMs={game.worldTimeMs}
            onStart={onStartCombat}
            onHoverDetail={onShowTooltip}
            onLeaveDetail={onCloseTooltip}
          />
        </Suspense>
      ) : null}
      <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />
    </>
  );
}
