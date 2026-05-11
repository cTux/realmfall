import { HexInfoWindowContentTestkit } from './HexInfoWindowContentTestkit';

describe('HexInfoWindowContent slot styles', () => {
  let testkit: HexInfoWindowContentTestkit;

  beforeEach(() => {
    testkit = new HexInfoWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('keeps stable slot style objects across renders', async () => {
    await testkit.expect.slotStyleConstantsStable();
  });
});
