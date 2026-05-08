import { ChatWebSocketTestkit } from './ChatWebSocketTestkit.js';

describe('chat websocket notifications', () => {
  let testkit: ChatWebSocketTestkit;

  beforeEach(async () => {
    testkit = new ChatWebSocketTestkit();
    await testkit.actions.startServer();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('broadcasts new-message availability to every connected client', async () => {
    await testkit.expect.broadcastsMessagesAvailableToAllClients();
  });
});
