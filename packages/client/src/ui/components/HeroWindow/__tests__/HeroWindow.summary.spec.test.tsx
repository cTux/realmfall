import { HeroWindowTestkit } from './HeroWindowTestkit';

describe('HeroWindow summary', () => {
  let testkit: HeroWindowTestkit;

  beforeEach(() => {
    testkit = new HeroWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders the hero summary with the detailed derived stat list', async () => {
    await testkit.actions.render();
    await testkit.expect.statSheetSummaryVisible();
  });

  it('keeps the hero summary outside the stat scroller', async () => {
    await testkit.actions.render({
      position: { x: 16, y: 24, width: 320, height: 260 },
    });
    await testkit.expect.summaryIsOutsideScroller();
  });
});
