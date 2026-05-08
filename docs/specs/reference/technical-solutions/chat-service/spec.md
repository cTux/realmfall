# Chat Service

## Scope

This spec covers the standalone chat-service package that stores recent chat messages, exposes HTTP read and write routes, and broadcasts websocket notifications when new messages arrive.

## Current Solution

- `packages/server-chat` mirrors the existing server package infra with Fastify, TypeScript build and typecheck scripts, Oxlint, Vitest, and the shared localhost HTTPS helper used by the other server packages.
- `packages/server-chat/src/app.ts` exposes `GET /api/version`, `GET /api/messages`, and `POST /api/messages`.
- `GET /api/messages?limit=<1-100>` returns the most recent messages in chronological order and defaults to a limit of `50` when the caller omits the query parameter.
- `POST /api/messages` expects `{ "idToken": string, "name": string, "message": string }`, trims the submitted `name` and `message`, verifies the Google player token through `packages/server-auth/src/googleAuth.ts`, and stores the verified Google subject as the message author id.
- The message-create route returns `503` when the shared Google client id is not configured, `400` for malformed request bodies or invalid message limits, and `401` for invalid Google player tokens.
- `packages/server-chat/src/chatService.ts` keeps the current chat history in memory only. Restarting the service clears the stored messages.
- `packages/server-chat/src/websocketServer.ts` runs a separate websocket server that broadcasts `{ "type": "messages-available", "latestMessageId": string, "totalMessages": number }` to every connected client when the service stores a new chat message.
- `packages/server-chat/src/runtime.ts` defaults the chat HTTP service to `localhost:8443`, defaults websocket notifications to `localhost:8080`, and reuses `REALMFALL_AUTH_GOOGLE_CLIENT_ID` as the shared Google player verification configuration.
- `packages/server-chat/src/dev.ts` and `packages/server-chat/scripts/serve-https.mjs` run the chat HTTP service on local HTTPS with the shared localhost certificate helper while keeping the websocket server on its own port, and `packages/server-chat/src/index.ts` serves the plain HTTP production entrypoint plus the websocket server.

## Main Implementation Areas

- `packages/server-chat/package.json`
- `packages/server-chat/README.md`
- `packages/server-chat/scripts/serve-https.mjs`
- `packages/server-chat/src/app.ts`
- `packages/server-chat/src/chatService.ts`
- `packages/server-chat/src/dev.ts`
- `packages/server-chat/src/index.ts`
- `packages/server-chat/src/runtime.ts`
- `packages/server-chat/src/version.ts`
- `packages/server-chat/src/websocketServer.ts`
- `packages/server-chat/src/__tests__/*`
