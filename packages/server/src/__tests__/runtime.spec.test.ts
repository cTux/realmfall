import { ServerRuntimeTestkit } from './ServerRuntimeTestkit.js';

describe('server runtime config', () => {
  let testkit: ServerRuntimeTestkit;

  beforeEach(() => {
    testkit = new ServerRuntimeTestkit();
  });

  it('defaults to localhost on port 3001', () => {
    testkit.expect.defaultRuntimeConfigUsesLocalhost();
  });

  it('uses HOST and PORT overrides when provided', () => {
    testkit.expect.runtimeConfigUsesProvidedHostAndPort();
  });

  it('formats listen URLs for both HTTP and HTTPS entries', () => {
    testkit.expect.listenUrlsMatchProtocol();
  });
});
