import type { CombatState, Enemy } from '../game/types';
import { EventEmitter } from './EventEmitter';
import { HexCoord } from './HexCoord';
import { CombatActor } from './CombatActor';
import { EnemyEntity } from './EnemyEntity';

interface CombatResolvers {
  getEnemyById?: (enemyId: string) => Enemy | undefined;
}

export class CombatEncounter extends EventEmitter {
  constructor(
    private readonly state: CombatState,
    private readonly resolvers: CombatResolvers = {},
  ) {
    super();
  }

  get coord() {
    return HexCoord.from(this.state.coord);
  }

  get enemyIds() {
    return [...this.state.enemyIds];
  }

  get started() {
    return this.state.started;
  }

  get startedAtMs() {
    return this.state.startedAtMs;
  }

  get playerActor() {
    return new CombatActor(this.state.player, 'player', 'player');
  }

  get enemyActors() {
    return this.state.enemyIds.map(
      (enemyId) =>
        new CombatActor(
          this.state.enemies[enemyId] ?? {
            abilityIds: [],
            globalCooldownMs: 0,
            globalCooldownEndsAt: 0,
            cooldownEndsAt: {},
            casting: null,
          },
          'enemy',
          enemyId,
        ),
    );
  }

  get enemies() {
    return this.state.enemyIds
      .map((enemyId) => this.resolvers.getEnemyById?.(enemyId))
      .filter((enemy): enemy is Enemy => enemy !== undefined)
      .map((enemy) => new EnemyEntity(enemy));
  }

  snapshot(): CombatState {
    return this.state;
  }
}
