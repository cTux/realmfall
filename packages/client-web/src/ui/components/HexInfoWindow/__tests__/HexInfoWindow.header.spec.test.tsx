import { setWorldClockTime } from '../../../../app/App/worldClockStore';
import { HexInfoWindowTestkit } from './HexInfoWindowTestkit';
import { buildCombatState } from './utils/hexInfoWindowFixtures';

const HEX_INFO_WINDOW_HEADER_TIMEOUT_MS = 10_000;

vi.setConfig({ testTimeout: HEX_INFO_WINDOW_HEADER_TIMEOUT_MS });

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

  it('expands the outpost picker from the header action and forwards the selected build', async () => {
    await testkit.actions.mount({
      canBuildOutpost: true,
      outpostBuildOptions: [
        {
          costLabel: '3 Logs, 2 Stone, 1 Cloth',
          description:
            'A raised perch that extends scouting across nearby shardland.',
          disabled: false,
          disabledReason: null,
          title: 'Watchtower',
          type: 'watchtower',
        },
      ],
    });

    await testkit.clickButtonByText('Build outpost');
    await testkit.expect.outpostOptionVisible('Watchtower');
    await testkit.clickButtonByText('Build');

    expect(testkit.mock.onBuildOutpost).toHaveBeenCalledWith('watchtower');
  });
});
