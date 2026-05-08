import { ChatRuntimeTestkit } from './RuntimeTestkit.js';

describe('chat runtime config', () => {
  let testkit: ChatRuntimeTestkit;

  beforeEach(() => {
    testkit = new ChatRuntimeTestkit();
  });

  it('defaults to localhost on port 8443 with websocket notifications on port 8080', () => {
    testkit.expect.defaultRuntimeConfigUsesChatDefaults();
  });

  it('uses HOST, PORT, WS_PORT, and the shared Google client id when provided', () => {
    testkit.expect.runtimeConfigUsesProvidedOverrides();
  });

  it('formats listen URLs for both HTTP and HTTPS plus ws and wss', () => {
    testkit.expect.listenUrlsMatchProtocol();
  });
});
