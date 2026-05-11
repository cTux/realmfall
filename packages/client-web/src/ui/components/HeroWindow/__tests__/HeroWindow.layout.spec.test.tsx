import { HeroWindowTestkit } from './HeroWindowTestkit';

describe('HeroWindow layout', () => {
  let testkit: HeroWindowTestkit;

  beforeEach(() => {
    testkit = new HeroWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders a resizable shell with an internal stat sheet scroller', async () => {
    await testkit.actions.render({
      position: { x: 16, y: 24, width: 320, height: 260 },
    });
    await testkit.expect.resizableWindowShellAndScroller();
  });
});
