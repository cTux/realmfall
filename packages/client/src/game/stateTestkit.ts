import {
  createGeneratedWorldBossEncounter,
  createPlacedWorldBossEncounter,
  findEnemy,
  findFactionNpcTile,
  findFactionTownTile,
  makeCombatState,
} from './stateTestHelpers';

export class StateTestkit {
  readonly actions = {
    createGeneratedWorldBossEncounter: (
      ...args: Parameters<typeof createGeneratedWorldBossEncounter>
    ) => createGeneratedWorldBossEncounter(...args),
    createPlacedWorldBossEncounter: (
      ...args: Parameters<typeof createPlacedWorldBossEncounter>
    ) => createPlacedWorldBossEncounter(...args),
    findEnemy: (...args: Parameters<typeof findEnemy>) => findEnemy(...args),
    findFactionNpcTile: (...args: Parameters<typeof findFactionNpcTile>) =>
      findFactionNpcTile(...args),
    findFactionTownTile: (...args: Parameters<typeof findFactionTownTile>) =>
      findFactionTownTile(...args),
    makeCombatState: (...args: Parameters<typeof makeCombatState>) =>
      makeCombatState(...args),
  };
}
