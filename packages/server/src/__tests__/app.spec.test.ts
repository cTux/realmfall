import { AppServerTestkit } from './AppServerTestkit.js';

describe('buildServer', () => {
  let testkit: AppServerTestkit;

  beforeEach(() => {
    testkit = new AppServerTestkit();
    testkit.actions.buildServer();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('returns the configured game version from GET /api/version', async () => {
    await testkit.expect.versionEndpointMatchesConfiguredVersion(
      '0.2.470+abcdef123456',
    );
  });

  it('reads HTTPS certificate buffers from certificate file paths', () => {
    const fixture = testkit.actions.createHttpsFixture();

    testkit.expect.httpsOptionsReadCertificateBuffers(fixture);
  });
});
