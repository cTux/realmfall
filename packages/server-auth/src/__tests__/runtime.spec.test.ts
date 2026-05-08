import { AuthRuntimeTestkit } from './RuntimeTestkit.js';

describe('auth runtime config', () => {
  let testkit: AuthRuntimeTestkit;

  beforeEach(() => {
    testkit = new AuthRuntimeTestkit();
  });

  it('defaults to localhost on port 3002 with a local realm directory', () => {
    testkit.expect.defaultRuntimeConfigUsesLocalAuthDefaults();
  });

  it('uses HOST, PORT, Google client id, and custom realm overrides when provided', () => {
    testkit.expect.runtimeConfigUsesProvidedOverrides();
  });

  it('formats listen URLs for both HTTP and HTTPS entries', () => {
    testkit.expect.listenUrlsMatchProtocol();
  });
});
