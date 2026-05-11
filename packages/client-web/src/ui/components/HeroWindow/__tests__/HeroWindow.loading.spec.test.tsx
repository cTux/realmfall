import { HeroWindowTestkit } from './HeroWindowTestkit';

describe('HeroWindow loading', () => {
  let testkit: HeroWindowTestkit;

  beforeEach(() => {
    testkit = new HeroWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders the window shell while content is still loading', async () => {
    await testkit.actions.renderImmediately();
    await testkit.expect.loadingWindowShellVisible();
  });
});
