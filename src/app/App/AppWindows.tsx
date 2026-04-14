import { useEffect, useMemo, useState, type MutableRefObject } from 'react';
import {
  canEquipItem,
  canUseItem,
  describeStructure,
  type EquipmentSlot,
  type GameState,
  type Item,
  type LogKind,
  getPlayerStats,
  getHostileEnemyIds,
  type Tile,
} from '../../game/state';
import {
  DEFAULT_LOG_FILTERS,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import { GameTooltip } from '../../ui/components/GameTooltip';
import { HeroWindow } from '../../ui/components/HeroWindow';
import { SkillsWindow } from '../../ui/components/SkillsWindow';
import { HexInfoWindow } from '../../ui/components/HexInfoWindow';
import { EquipmentWindow } from '../../ui/components/EquipmentWindow';
import { InventoryWindow } from '../../ui/components/InventoryWindow';
import { RecipeBookWindow } from '../../ui/components/RecipeBookWindow';
import { LogWindow } from '../../ui/components/LogWindow';
import { CombatWindow } from '../../ui/components/CombatWindow';
import { LootWindow } from '../../ui/components/LootWindow';
import { ItemContextMenu } from '../../ui/components/ItemContextMenu';
import { WindowDock } from '../../ui/components/WindowDock';
import type { ItemContextMenuState, TooltipItem } from './types';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { TooltipLine } from '../../ui/tooltips';
import { formatTerrainLabel } from './appHelpers';
import { useTooltipState } from './tooltipStore';

const WINDOW_HANDLER_KEYS = [
  'hero',
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'loot',
  'log',
  'combat',
] as const;

const DEFERRED_WINDOW_KEYS = [
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'loot',
  'log',
  'combat',
] as const;

type ManagedWindowKey = (typeof WINDOW_HANDLER_KEYS)[number];
type DeferredWindowKey = (typeof DEFERRED_WINDOW_KEYS)[number];

const createWindowMoveHandlers = (
  onMoveWindow: AppWindowsProps['onMoveWindow'],
) =>
  WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = (position) => onMoveWindow(key, position);
      return handlers;
    },
    {} as {
      [K in ManagedWindowKey]: (position: WindowPositions[K]) => void;
    },
  );

const createWindowCloseHandlers = (
  onSetWindowVisibility: AppWindowsProps['onSetWindowVisibility'],
) =>
  WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = () => onSetWindowVisibility(key, false);
      return handlers;
    },
    {} as { [K in ManagedWindowKey]: () => void },
  );

const createLoadedWindowState = (
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) =>
  ({
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: renderLootWindow,
    log: windowShown.log,
    combat: renderCombatWindow,
  }) satisfies Record<DeferredWindowKey, boolean>;

const mergeLoadedWindowState = (
  current: Record<DeferredWindowKey, boolean>,
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) => {
  const next = createLoadedWindowState(
    windowShown,
    renderLootWindow,
    renderCombatWindow,
  );

  for (const key of DEFERRED_WINDOW_KEYS) {
    next[key] = current[key] || next[key];
  }

  return DEFERRED_WINDOW_KEYS.every((key) => current[key] === next[key])
    ? current
    : next;
};

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
  claimStatus: ReturnType<
    typeof import('../../game/state').getCurrentHexClaimStatus
  >;
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
  onClaimHex: () => void;
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
  claimStatus,
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
  onClaimHex,
  onSetHome,
}: AppWindowsProps) {
  const tooltip = useTooltipState();
  const windowMoveHandlers = useMemo(
    () => createWindowMoveHandlers(onMoveWindow),
    [onMoveWindow],
  );
  const windowCloseHandlers = useMemo(
    () => createWindowCloseHandlers(onSetWindowVisibility),
    [onSetWindowVisibility],
  );
  const [loadedWindows, setLoadedWindows] = useState(() =>
    createLoadedWindowState(windowShown, renderLootWindow, renderCombatWindow),
  );

  useEffect(() => {
    setLoadedWindows((current) =>
      mergeLoadedWindowState(
        current,
        windowShown,
        renderLootWindow,
        renderCombatWindow,
      ),
    );
  }, [renderCombatWindow, renderLootWindow, windowShown]);

  return (
    <>
      <WindowDock entries={dockEntries} onToggle={onToggleDockWindow} />

      <HeroWindow
        position={windows.hero}
        onMove={windowMoveHandlers.hero}
        visible={windowShown.hero}
        onClose={windowCloseHandlers.hero}
        stats={stats}
        hunger={game.player.hunger}
        thirst={game.player.thirst}
        worldTimeMs={game.worldTimeMs}
        onHoverDetail={onShowTooltip}
        onLeaveDetail={onCloseTooltip}
      />
      {loadedWindows.skills ? (
        <SkillsWindow
          position={windows.skills}
          onMove={windowMoveHandlers.skills}
          visible={windowShown.skills}
          onClose={windowCloseHandlers.skills}
          skills={stats.skills}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.recipes ? (
        <RecipeBookWindow
          position={windows.recipes}
          onMove={windowMoveHandlers.recipes}
          visible={windowShown.recipes}
          onClose={windowCloseHandlers.recipes}
          hasRecipeBook={recipeBookKnown}
          currentStructure={describeStructure(currentTile.structure)}
          recipes={recipes}
          inventoryCounts={inventoryCounts}
          onCraft={onCraftRecipe}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.hexInfo ? (
        <HexInfoWindow
          position={windows.hexInfo}
          onMove={windowMoveHandlers.hexInfo}
          visible={windowShown.hexInfo}
          onClose={windowCloseHandlers.hexInfo}
          isHome={
            game.homeHex.q === game.player.coord.q &&
            game.homeHex.r === game.player.coord.r
          }
          canSetHome={
            !currentTile.claim || currentTile.claim.ownerType === 'player'
          }
          onSetHome={onSetHome}
          terrain={formatTerrainLabel(currentTile.terrain)}
          structure={
            currentTile.structure
              ? describeStructure(currentTile.structure)
              : null
          }
          enemyCount={
            game.combat
              ? (combatSnapshot?.enemies.length ?? 0)
              : getHostileEnemyIds(game, currentTile.coord).length
          }
          interactLabel={interactLabel}
          canInteract={Boolean(interactLabel)}
          canProspect={canProspect}
          canSell={canSell}
          canClaim={claimStatus.canClaim}
          claimExplanation={claimStatus.reason}
          prospectExplanation={prospectExplanation}
          sellExplanation={sellExplanation}
          onInteract={onInteract}
          onProspect={onProspect}
          onSellAll={onSellAll}
          onClaim={onClaimHex}
          structureHp={currentTile.structureHp}
          structureMaxHp={currentTile.structureMaxHp}
          territoryName={currentTile.claim?.ownerName ?? null}
          territoryOwnerType={currentTile.claim?.ownerType ?? null}
          territoryNpc={currentTile.claim?.npc ?? null}
          townStock={townStock}
          gold={gold}
          onBuyItem={onBuyTownItem}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.equipment ? (
        <EquipmentWindow
          position={windows.equipment}
          onMove={windowMoveHandlers.equipment}
          visible={windowShown.equipment}
          onClose={windowCloseHandlers.equipment}
          equipment={game.player.equipment}
          onHoverItem={onEquipmentHover}
          onLeaveItem={onCloseTooltip}
          onUnequip={onUnequip}
          onContextItem={onEquippedContextItem}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.inventory ? (
        <InventoryWindow
          position={windows.inventory}
          onMove={windowMoveHandlers.inventory}
          visible={windowShown.inventory}
          onClose={windowCloseHandlers.inventory}
          inventory={game.player.inventory}
          equipment={game.player.equipment}
          onSort={onSort}
          onEquip={onEquip}
          onContextItem={onContextItem}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.loot ? (
        <LootWindow
          position={windows.loot}
          onMove={windowMoveHandlers.loot}
          visible={windowShown.loot && lootWindowVisible}
          loot={lootSnapshot}
          equipment={game.player.equipment}
          onClose={windowCloseHandlers.loot}
          onTakeAll={onTakeAllLoot}
          onTakeItem={onTakeLootItem}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
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
      {loadedWindows.log ? (
        <LogWindow
          position={windows.log}
          onMove={windowMoveHandlers.log}
          visible={windowShown.log}
          onClose={windowCloseHandlers.log}
          filters={logFilters}
          defaultFilters={DEFAULT_LOG_FILTERS}
          showFilterMenu={showFilterMenu}
          onToggleMenu={onToggleFilterMenu}
          onToggleFilter={onToggleLogFilter}
          logs={filteredLogs}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.combat && combatSnapshot ? (
        <CombatWindow
          position={windows.combat}
          onMove={windowMoveHandlers.combat}
          visible={windowShown.combat && combatWindowVisible}
          onClose={windowCloseHandlers.combat}
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
          onHoverHeaderAction={onShowTooltip}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />
    </>
  );
}
