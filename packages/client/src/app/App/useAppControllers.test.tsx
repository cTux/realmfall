import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../game/stateFactory';
import type { GameState } from '../../game/stateTypes';
import { DEFAULT_AUDIO_SETTINGS } from '../audioSettings';
import { DEFAULT_GAMEPLAY_SETTINGS } from '../gameplaySettings';
import { DEFAULT_GRAPHICS_SETTINGS } from '../graphicsSettings';
import { DEFAULT_INTERFACE_SETTINGS } from '../interfaceSettings';
import { type AppControllers, useAppControllers } from './useAppControllers';

describe('useAppControllers', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('marks dropped inventory items as ignored for auto-loot', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const initialGame = createGame(2, 'auto-loot-drop-controller-item');
    const gameRef: { current: GameState } = { current: initialGame };
    const tooltipPositionRef = { current: null };
    const worldTimeMsRef = { current: initialGame.worldTimeMs };
    const droppedItemId = initialGame.player.inventory[0]!.id;
    let controllers!: AppControllers;

    function Harness() {
      const [game, setGame] = useState(initialGame);
      gameRef.current = game;
      worldTimeMsRef.current = game.worldTimeMs;
      controllers = useAppControllers({
        currentStructure: game.tiles['0,0']?.structure,
        equipment: game.player.equipment,
        inventory: game.player.inventory,
        gameRef,
        initialAudioSettings: DEFAULT_AUDIO_SETTINGS,
        initialGameplaySettings: DEFAULT_GAMEPLAY_SETTINGS,
        initialGraphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
        initialInterfaceSettings: DEFAULT_INTERFACE_SETTINGS,
        paused: false,
        setGame,
        tooltipPositionRef,
        worldTimeMsRef,
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controllers.actions.handleDropItem(droppedItemId);
      await Promise.resolve();
    });

    expect(controllers.state.autoLootIgnoredItemIds.has(droppedItemId)).toBe(
      true,
    );
    expect(
      gameRef.current.tiles['0,0']?.items.some(
        ({ id }) => id === droppedItemId,
      ),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('marks dropped equipped items as ignored for auto-loot', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const initialGame = createGame(2, 'auto-loot-drop-controller-equipped');
    initialGame.player.equipment.weapon = {
      id: 'equipped-blade',
      slot: 'weapon',
      name: 'Scout Blade',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 2,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };
    const gameRef: { current: GameState } = { current: initialGame };
    const tooltipPositionRef = { current: null };
    const worldTimeMsRef = { current: initialGame.worldTimeMs };
    let controllers!: AppControllers;

    function Harness() {
      const [game, setGame] = useState(initialGame);
      gameRef.current = game;
      worldTimeMsRef.current = game.worldTimeMs;
      controllers = useAppControllers({
        currentStructure: game.tiles['0,0']?.structure,
        equipment: game.player.equipment,
        inventory: game.player.inventory,
        gameRef,
        initialAudioSettings: DEFAULT_AUDIO_SETTINGS,
        initialGameplaySettings: DEFAULT_GAMEPLAY_SETTINGS,
        initialGraphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
        initialInterfaceSettings: DEFAULT_INTERFACE_SETTINGS,
        paused: false,
        setGame,
        tooltipPositionRef,
        worldTimeMsRef,
      });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controllers.actions.handleDropEquippedItem('weapon');
      await Promise.resolve();
    });

    expect(controllers.state.autoLootIgnoredItemIds.has('equipped-blade')).toBe(
      true,
    );
    expect(
      gameRef.current.tiles['0,0']?.items.some(
        ({ id }) => id === 'equipped-blade',
      ),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
