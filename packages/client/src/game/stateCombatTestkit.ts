import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';

export class StateCombatTestkit {
  readonly actions = {
    createEncounterGame: (seed: string) => createCombatEncounterGame(seed),
    seedEncounter: (...args: Parameters<typeof seedCombatEncounter>) =>
      seedCombatEncounter(...args),
  };
}
