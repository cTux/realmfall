# Realmfall Chat Server

`@realmfall/server-chat` is the standalone Node service package for recent chat history and message-availability notifications. It mirrors the existing server package infra and reuses `server-auth`'s Google player verification helper to identify the user who posts each message.

## Requirements

- Use the repo root workspace install with Node `v25.9.0` and `pnpm@11`.
- Start this package through its filtered package commands. Root `pnpm dev` and `pnpm serve` do not include it.
- `POST /api/messages` returns `503` until `REALMFALL_AUTH_GOOGLE_CLIENT_ID` is configured for the shared Google player verification path.

## Current API

- `GET /api/version`: returns `{ "version": "<root package version with git short SHA when available>" }`
- `GET /api/messages?limit=<1-100>`: returns `{ "messages": ChatMessage[] }` with the most recent messages in chronological order; the default limit is `50`
- `POST /api/messages`: accepts `{ "idToken": "<google id token>", "name": "<display name>", "message": "<chat message>" }` and returns `{ "message": ChatMessage }`
- WebSocket notifications on `WS_PORT`: broadcasts `{ "type": "messages-available", "latestMessageId": "<id>", "totalMessages": <count> }` whenever the service stores a new message

## Environment

- `REALMFALL_AUTH_GOOGLE_CLIENT_ID`: shared Google OAuth client id used by `server-auth` and `server-chat` for player verification
- `HOST`
- `PORT`
- `WS_PORT`

## Local Commands

- `pnpm --filter @realmfall/server-chat dev`
- `pnpm --filter @realmfall/server-chat build`
- `pnpm --filter @realmfall/server-chat serve`
- `pnpm --filter @realmfall/server-chat start`
- `pnpm --filter @realmfall/server-chat typecheck`
- `pnpm --filter @realmfall/server-chat lint`
- `pnpm --filter @realmfall/server-chat test`

## Notes

- `pnpm --filter @realmfall/server-chat dev` runs the source chat service on `https://localhost:8443` plus `ws://localhost:8080` by default, using the shared localhost certificate helper for the HTTPS server.
- `pnpm --filter @realmfall/server-chat serve` runs the built chat service with the same local HTTPS and websocket ports so release-like local checks use matching transport behavior.
- `pnpm --filter @realmfall/server-chat start` runs the built HTTP entrypoint on `PORT` plus websocket notifications on `WS_PORT`.
- Message history is in-memory only. Restarting the process clears the stored chat log.
- Message creation trims leading and trailing whitespace from the submitted `name` and `message` fields before persisting them.

## Related Docs

- Root overview: [`README.md`](../../README.md)
- Workflow: [`docs/WORKFLOW.md`](../../docs/WORKFLOW.md)
- Architecture spec: [`docs/specs/reference/technical-solutions/application-architecture/spec.md`](../../docs/specs/reference/technical-solutions/application-architecture/spec.md)
- Chat service spec: [`docs/specs/reference/technical-solutions/chat-service/spec.md`](../../docs/specs/reference/technical-solutions/chat-service/spec.md)
