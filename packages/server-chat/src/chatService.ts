import { randomUUID } from 'node:crypto';

export type ChatMessage = {
  createdAt: string;
  id: string;
  message: string;
  name: string;
  userId: string;
};

type AddChatMessageInput = {
  message: string;
  name: string;
  userId: string;
};

type CreateChatMessageStoreOptions = {
  createId?: () => string;
  now?: () => Date;
};

export type ChatMessageStore = {
  addMessage: (input: AddChatMessageInput) => ChatMessage;
  countMessages: () => number;
  listRecentMessages: (limit: number) => ChatMessage[];
};

export function createChatMessageStore(
  options: CreateChatMessageStoreOptions = {},
): ChatMessageStore {
  const createId = options.createId ?? randomUUID;
  const now = options.now ?? (() => new Date());
  const messages: ChatMessage[] = [];

  return {
    addMessage(input) {
      const chatMessage = {
        createdAt: now().toISOString(),
        id: createId(),
        message: input.message,
        name: input.name,
        userId: input.userId,
      };

      messages.push(chatMessage);

      return { ...chatMessage };
    },
    countMessages() {
      return messages.length;
    },
    listRecentMessages(limit) {
      return messages.slice(-limit).map((message) => ({ ...message }));
    },
  };
}
