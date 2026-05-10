import type { CombatActorState } from '../game/types';
import { EventEmitter } from './EventEmitter';

export type CombatActorKind = 'player' | 'enemy';

export class CombatActor extends EventEmitter {
  constructor(
    private readonly state: CombatActorState,
    public readonly kind: CombatActorKind,
    public readonly id: string,
  ) {
    super();
  }

  get abilityIds() {
    return [...this.state.abilityIds];
  }

  get globalCooldownMs() {
    return this.state.globalCooldownMs;
  }

  get effectiveGlobalCooldownMs() {
    return this.state.effectiveGlobalCooldownMs ?? this.state.globalCooldownMs;
  }

  get globalCooldownEndsAt() {
    return this.state.globalCooldownEndsAt;
  }

  get cooldownEndsAt() {
    return { ...this.state.cooldownEndsAt };
  }

  get casting() {
    return this.state.casting ? { ...this.state.casting } : null;
  }

  get isCasting() {
    return this.state.casting !== null;
  }

  snapshot(): CombatActorState {
    return this.state;
  }
}
