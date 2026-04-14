import { useEffect, useState, type MutableRefObject } from 'react';
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
import type { GameState, Item } from '../../game/state';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { TooltipLine } from '../../ui/tooltips';
import { useTooltipState } from './tooltipStore';
import type { TooltipItem } from './types';

interface AppWindowsProps {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  dockEntries: ReturnType<typeof import('./appHelpers').getDockEntries>;
  renderLootWindow: boolean;
  lootWindowVisible: boolean;
  lootSnapshot: Item[];
  renderCombatWindow: boolean;
  combatWindowVisible: boolean;
  combatSnapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof import('../../game/state').getEnemiesAt>;
  } | null;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
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
}

export function AppWindows({
  windowShown,
  dockEntries,
  renderLootWindow,
  lootWindowVisible,
  lootSnapshot,
  renderCombatWindow,
  combatWindowVisible,
  combatSnapshot,
  tooltipPositionRef,
  onToggleDockWindow,
  onShowItemTooltip,
  onShowTooltip,
  onCloseTooltip,
}: AppWindowsProps) {
  const tooltip = useTooltipState();
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
        onHoverDetail={onShowTooltip}
        onLeaveDetail={onCloseTooltip}
      />
      {loadedWindows.skills ? (
        <SkillsWindow
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.recipes ? <RecipeBookWindow /> : null}
      {loadedWindows.hexInfo ? (
        <HexInfoWindow
          combatSnapshot={combatSnapshot}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.equipment ? (
        <EquipmentWindow
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.inventory ? (
        <InventoryWindow
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      {loadedWindows.loot ? (
        <LootWindow
          loot={lootSnapshot}
          lootWindowVisible={lootWindowVisible}
          onHoverItem={onShowItemTooltip}
          onLeaveItem={onCloseTooltip}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
        />
      ) : null}
      <ItemContextMenu />
      {loadedWindows.log ? <LogWindow /> : null}
      {loadedWindows.combat && combatSnapshot ? (
        <CombatWindow
          combatSnapshot={combatSnapshot}
          combatWindowVisible={combatWindowVisible}
          onHoverDetail={onShowTooltip}
          onLeaveDetail={onCloseTooltip}
          onHoverHeaderAction={onShowTooltip}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />
    </>
  );
}
