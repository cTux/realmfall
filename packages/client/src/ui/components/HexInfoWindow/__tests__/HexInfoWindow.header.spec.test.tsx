import { setWorldClockTime } from '../../../../app/App/worldClockStore';
import { HexInfoWindowTestkit } from './HexInfoWindowTestkit';
import { buildCombatState } from './utils/hexInfoWindowFixtures';

describe('HexInfoWindow header', () => {
  let testkit: HexInfoWindowTestkit;

  beforeEach(() => {
    testkit = new HexInfoWindowTestkit();
    setWorldClockTime(0);
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('keeps the close button on the same compact header-action sizing contract as the home action', async () => {
    await testkit.actions.mount();
    await testkit.expect.closeAndHomeButtonsMatchSize();
  });

  it('uses the leaf world clock subscription for the combat forfeit timer', async () => {
    setWorldClockTime(61_000);

    await testkit.actions.mount({
      combat: buildCombatState({ started: true, startedAtMs: 0 }),
    });

    await testkit.expect.combatForfeitButtonVisible();
  });
});
