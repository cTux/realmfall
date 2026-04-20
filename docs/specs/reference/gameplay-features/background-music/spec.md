# Background Music

## Scope

This spec covers the runtime background-music player, its area and combat-based playlist switching, and the current playlist-cycle behavior.

## Current Behavior

- Realmfall now ships area music playlists under `src/assets/music` for `ambient`, `combat`, `dungeon`, and `town`.
- Background music uses `react-use-audio-player` and starts from a lazily loaded controller so the main startup path does not absorb the full audio-player dependency eagerly.
- Music selection is driven by the current play state in this priority order: active combat uses the combat playlist, dungeon tiles use the dungeon playlist, town tiles use the town playlist, and every other location uses the ambient playlist.
- Each playlist chooses a random track, removes it from the current cycle, and avoids repeating a track until every track in that playlist has been played once.
- When a playlist cycle resets and multiple tracks exist, the first track of the next cycle does not immediately repeat the last track from the previous cycle.
- Background music waits for a user activation before starting playback so browser autoplay restrictions do not break the runtime.
- The shared audio mute toggle and master volume affect background music, and a dedicated music-only mute toggle can silence only the music layer without muting UI or voice audio.

## Verification Path

- Load the app, avoid any pointer or keyboard interaction, and confirm music does not start before user activation.
- Interact once, remain in the standard world, and confirm an ambient track begins.
- Enter combat and confirm the current music switches to a combat track.
- Move onto a dungeon tile outside combat and confirm dungeon music replaces the previous playlist.
- Move onto a town tile, including faction-owned towns, and confirm the town playlist plays.
- Let tracks finish within the same mood and confirm the playlist rotates through different tracks before repeating.

## Main Implementation Areas

- `src/app/App`
- `src/app/audio`
- `src/assets/music`
- `vite.config.ts`
