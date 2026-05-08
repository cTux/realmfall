import { ChatServerTestkit } from './ChatServerTestkit.js';

describe('buildServer', () => {
  let testkit: ChatServerTestkit;

  beforeEach(() => {
    testkit = new ChatServerTestkit();
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

  it('returns the latest messages from GET /api/messages', async () => {
    await testkit.expect.messagesEndpointReturnsRecentMessages();
  });

  it('verifies a player token, stores a message, and emits a notification', async () => {
    await testkit.expect.postMessageStoresVerifiedMessageAndBroadcasts();
  });

  it('rejects invalid message payloads', async () => {
    await testkit.expect.postMessageRejectsInvalidPayloads();
  });

  it('rejects invalid player tokens', async () => {
    await testkit.expect.postMessageRejectsInvalidTokens();
  });

  it('reports a missing Google client id as a service configuration error', async () => {
    await testkit.expect.postMessageReportsMissingGoogleClientId();
  });

  it('reads HTTPS certificate buffers from certificate file paths', () => {
    const fixture = testkit.actions.createHttpsFixture();

    testkit.expect.httpsOptionsReadCertificateBuffers(fixture);
  });
});
