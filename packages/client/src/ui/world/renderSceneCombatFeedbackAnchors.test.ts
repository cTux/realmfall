import { applyEnemyAbility } from '@realmfall/core/game/stateCombatEnemyAbility';
import { applyPlayerAbility } from '@realmfall/core/game/stateCombatPlayerAbility';
import { StateCombatTestkit } from '@realmfall/core/game/stateCombatTestkit';
import { createCombatState } from '@realmfall/core/game/stateCombatState';
import { getVisibleTiles } from '@realmfall/core/game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getLabelsLayer,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestkit';
import { getWorldHexSize, tileToPoint } from './renderSceneMath';

const combatTestkit = new StateCombatTestkit();

setupRenderSceneTestEnvironment();

describe('renderScene combat feedback anchors', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: 'jsdom' });
    vi.stubGlobal(
      'OffscreenCanvas',
      class MockOffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders player damage text above the enemy target instead of above the player attacker', async () => {
    const { renderScene } = await import('./renderScene');
    const game = combatTestkit.actions.createEncounterGame(
      'combat-feedback-player-target-anchor',
    );
    const targetCoord = combatTestkit.actions.seedEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 50,
      maxHp: 50,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });
    const app = createMockApp();

    game.combat = createCombatState(
      game,
      targetCoord,
      ['enemy-2,0-0'],
      game.worldTimeMs,
    );
    game.combat!.started = true;

    applyPlayerAbility(game, 'kick', 'enemy-2,0-0');

    const damageEvent = game.worldFloatingTextEvents.find(
      (event) => event.kind === 'damage' || event.kind === 'critical-damage',
    );
    expect(damageEvent).toBeDefined();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 300,
      } as never,
    );

    const text = getVisibleFloatingTexts(app).find(
      (candidate) => candidate.text === `${damageEvent!.amount}`,
    );
    const enemyPoint = getRelativePoint(app, game, targetCoord);
    const playerPoint = getRelativePoint(app, game, game.player.coord);

    expect(text).toBeDefined();
    expect(text!.position.x).toBeCloseTo(enemyPoint.x, 4);
    expect(Math.abs(text!.position.x - enemyPoint.x)).toBeLessThan(
      Math.abs(text!.position.x - playerPoint.x),
    );
  });

  it('renders enemy damage text above the player target instead of above the enemy attacker', async () => {
    const { renderScene } = await import('./renderScene');
    const scenario = createEnemyDamageScenario();
    const app = createMockApp();

    renderScene(
      app as never,
      scenario.game,
      getVisibleTiles(scenario.game),
      scenario.game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 300,
      } as never,
    );

    const text = getVisibleFloatingTexts(app).find(
      (candidate) => candidate.text === `${scenario.damageEvent.amount}`,
    );
    const enemyPoint = getRelativePoint(
      app,
      scenario.game,
      scenario.targetCoord,
    );
    const playerPoint = getRelativePoint(
      app,
      scenario.game,
      scenario.game.player.coord,
    );

    expect(text).toBeDefined();
    expect(text!.position.x).toBeCloseTo(playerPoint.x, 4);
    expect(Math.abs(text!.position.x - playerPoint.x)).toBeLessThan(
      Math.abs(text!.position.x - enemyPoint.x),
    );
  });

  it('keeps player-targeted damage text above the original hit target location after the player moves', async () => {
    const { renderScene } = await import('./renderScene');
    const scenario = createEnemyDamageScenario();
    const app = createMockApp();
    const originalPlayerCoord = { ...scenario.game.player.coord };

    scenario.game.player.coord = { q: 0, r: 1 };

    renderScene(
      app as never,
      scenario.game,
      getVisibleTiles(scenario.game),
      scenario.game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 300,
      } as never,
    );

    const text = getVisibleFloatingTexts(app).find(
      (candidate) => candidate.text === `${scenario.damageEvent.amount}`,
    );
    const originalTargetPoint = getRelativePoint(
      app,
      scenario.game,
      originalPlayerCoord,
    );
    const movedPlayerPoint = getRelativePoint(
      app,
      scenario.game,
      scenario.game.player.coord,
    );

    expect(text).toBeDefined();
    expect(text!.position.x).toBeCloseTo(originalTargetPoint.x, 4);
    expect(Math.abs(text!.position.x - originalTargetPoint.x)).toBeLessThan(
      Math.abs(text!.position.x - movedPlayerPoint.x),
    );
  });

  it('renders enemy healing text above the healed ally target instead of above the caster', async () => {
    const { renderScene } = await import('./renderScene');
    const game = combatTestkit.actions.createEncounterGame(
      'combat-feedback-enemy-heal-target-anchor',
    );
    const casterCoord = { q: 2, r: 0 };
    const allyCoord = { q: 2, r: 1 };
    const app = createMockApp();

    game.tiles['2,0'] = {
      coord: casterCoord,
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.tiles['2,1'] = {
      coord: allyCoord,
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,1-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Priest',
      tier: 1,
      coord: casterCoord,
      hp: 30,
      maxHp: 30,
      mana: 30,
      maxMana: 30,
      attack: 12,
      defense: 0,
      xp: 5,
      elite: false,
      abilityIds: ['fieldDressing'],
    };
    game.enemies['enemy-2,1-0'] = {
      id: 'enemy-2,1-0',
      name: 'Wolf',
      tier: 1,
      coord: allyCoord,
      hp: 10,
      maxHp: 30,
      mana: 0,
      maxMana: 0,
      attack: 6,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.combat = createCombatState(
      game,
      casterCoord,
      ['enemy-2,0-0', 'enemy-2,1-0'],
      game.worldTimeMs,
    );
    game.combat!.started = true;

    applyEnemyAbility(game, 'enemy-2,0-0', 'fieldDressing');

    const healingEvent = game.worldFloatingTextEvents.find(
      (event) => event.kind === 'healing',
    );
    expect(healingEvent).toBeDefined();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 300,
      } as never,
    );

    const text = getVisibleFloatingTexts(app).find(
      (candidate) => candidate.text === `${healingEvent!.amount}`,
    );
    const casterPoint = getRelativePoint(app, game, casterCoord);
    const allyPoint = getRelativePoint(app, game, allyCoord);

    expect(text).toBeDefined();
    expect(text!.position.x).toBeCloseTo(allyPoint.x, 4);
    expect(Math.abs(text!.position.x - allyPoint.x)).toBeLessThan(
      Math.abs(text!.position.x - casterPoint.x),
    );
  });
});

function getVisibleFloatingTexts(app: ReturnType<typeof createMockApp>) {
  return collectDescendants(getLabelsLayer(app)).filter(
    (child): child is FloatingTextNode =>
      child !== null &&
      typeof child === 'object' &&
      'text' in child &&
      'position' in child &&
      'visible' in child &&
      Boolean((child as FloatingTextNode).visible),
  );
}

function getRelativePoint(
  app: ReturnType<typeof createMockApp>,
  game: ReturnType<StateCombatTestkit['actions']['createEncounterGame']>,
  coord: { q: number; r: number },
) {
  const hexSize = getWorldHexSize(app.screen, game.radius);
  return tileToPoint(
    {
      q: coord.q - game.player.coord.q,
      r: coord.r - game.player.coord.r,
    },
    app.screen.width / 2,
    app.screen.height / 2,
    hexSize,
  );
}

type FloatingTextNode = {
  position: { x: number; y: number };
  text: string;
  visible: boolean;
};

function createEnemyDamageScenario() {
  for (let index = 0; index < 32; index += 1) {
    const game = combatTestkit.actions.createEncounterGame(
      `combat-feedback-enemy-target-anchor:${index}`,
    );
    const targetCoord = combatTestkit.actions.seedEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 50,
      maxHp: 50,
      attack: 100,
      defense: 0,
      xp: 5,
      elite: false,
    });

    game.combat = createCombatState(
      game,
      targetCoord,
      ['enemy-2,0-0'],
      game.worldTimeMs,
    );
    game.combat!.started = true;

    applyEnemyAbility(game, 'enemy-2,0-0', 'kick');

    const damageEvent = game.worldFloatingTextEvents.find(
      (event) => event.kind === 'damage' || event.kind === 'critical-damage',
    );
    if (damageEvent) {
      return { damageEvent, game, targetCoord };
    }
  }

  throw new Error('Expected enemy ability scenario to produce floating damage');
}
