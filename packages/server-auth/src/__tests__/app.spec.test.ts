import { AuthServerTestkit } from './AuthServerTestkit.js';

describe('buildServer', () => {
  let testkit: AuthServerTestkit;

  beforeEach(() => {
    testkit = new AuthServerTestkit();
    testkit.actions.buildServer();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('returns the configured build version from GET /api/version', async () => {
    await testkit.expect.versionEndpointMatchesConfiguredVersion(
      '0.2.470+abcdef123456',
    );
  });

  it('returns the configured realm directory from GET /api/realms', async () => {
    await testkit.expect.realmDirectoryMatchesConfiguredRealms();
  });

  it('verifies a Google player token and returns the normalized player identity', async () => {
    await testkit.expect.googleVerifyResponseMatchesConfiguredPlayer();
  });

  it('rejects invalid Google player tokens', async () => {
    await testkit.expect.googleVerifyRejectsInvalidTokens();
  });

  it('reports a missing Google client id as a service configuration error', async () => {
    await testkit.expect.googleVerifyReportsMissingGoogleClientId();
  });

  it('reads HTTPS certificate buffers from certificate file paths', () => {
    const fixture = testkit.actions.createHttpsFixture();

    testkit.expect.httpsOptionsReadCertificateBuffers(fixture);
  });
});
