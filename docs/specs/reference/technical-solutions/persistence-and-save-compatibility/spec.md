# Persistence And Save Compatibility

## Scope

This spec covers browser save storage, hydration normalization, and autosave behavior.

## Current Solution

- Saves are stored in browser local storage.
- Stored payloads contain both game and UI state.
- The app persists snapshots with world time and UI window state while intentionally excluding transient log history from the saved payload.
- `src/persistence/storage.ts` wraps saved JSON in AES-GCM using a client-side passphrase-derived key.
- That wrapper is implementation obfuscation for local saves, not a real security boundary or meaningful client-side secret protection.
- Loaded saves are normalized before they are used by the app.
- Normalization handles legacy gold shape migration, item id deduplication, missing structure HP, combat actor defaults, old window-collapsed UI state, thirst defaults, learned recipes, and legacy claim NPC fields.
- Home tile safety is re-established during normalization when needed.
- Autosave uses a debounce plus interval-backed flush model.
- Gameplay and UI persistence dirtiness are tracked separately so UI-only changes do not rebuild the gameplay snapshot on every autosave scheduling pass.
- The app serializes persisted segments and skips redundant writes when nothing meaningful changed.
- Pending saves are coalesced while previous writes are in flight.
- Manual saves are serialized behind any in-flight autosave so older writes cannot finish later and overwrite newer explicit saves.
- Dirty tracking and the last-saved snapshot advance only after a storage write succeeds, so failed writes stay retryable on the next autosave flush or manual save.

## Main Implementation Areas

- `src/persistence/storage.ts`
- `src/app/normalize.ts`
- `src/app/App/useAppPersistence.ts`
