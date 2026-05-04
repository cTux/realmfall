# Howler Background Music Design

## Summary

Replace the current background-music playback hook with a direct `howler`-backed controller that keeps the existing mood resolver and shuffled playlist behavior while adding immediate mood-switch crossfades, deterministic fade timing, and explicit track lifecycle cleanup.

## Goals

- Use `howler` directly for background music playback.
- Keep the existing background-music mood routing for `ambient`, `combat`, `dungeon`, and `town`.
- Shuffle tracks within each mood and cycle through the full mood playlist before repeating.
- Prevent immediate same-track repeats when a mood has more than one track.
- Crossfade immediately when the game mood changes.
- Fade music in on initial playback and on natural track-to-track advancement.
- Preserve music mute and volume behavior from audio settings.
- Keep the background-music runtime inside the lazy audio chunk rather than moving it onto the bootstrap path.

## Non-Goals

- Do not redesign UI sound-effects playback or voice playback in this change.
- Do not add new player-facing audio settings for fade durations, shuffle mode, or crossfade toggles.
- Do not change how music mood is chosen from combat or structure state.
- Do not add a second playlist or content registry outside the existing `assets/music/<mood>` structure.

## Current Problem

Background music currently runs through `react-use-audio-player`, which keeps the playlist-selection logic but hides the low-level playback lifecycle. The requested behavior needs explicit control over two overlapping music instances during transitions, deterministic fade timing, and direct end or failure handling. The current hook can advance tracks and retry failures, but immediate crossfade behavior is not expressed as a first-class part of the implementation.

## Recommended Approach

Keep the current music selection boundaries and replace only the playback layer.

- `backgroundMusic.ts`, `backgroundMusicLibrary.ts`, and `backgroundMusicPlaylist.ts` continue to own mood resolution and shuffled per-mood track selection.
- `useBackgroundMusicController.ts` becomes a direct `howler` controller that owns one active playback slot and one incoming transition slot.
- Each track transition is explicit: create a `Howl`, start the new track at zero volume, fade it in, fade the previous track out, then stop and unload the previous track.
- The latest requested mood always wins. If a new mood arrives while a prior transition is still loading or fading, the controller cancels the stale incoming track and starts a transition for the newest mood.

This keeps the requested behavior local to background music, preserves existing audio settings integration, and avoids widening the work into a broader audio-engine migration.

## Architecture

### Playback Boundary

Keep the `BackgroundMusicControllerBridge` and `useBackgroundMusicController` boundary under `packages/client/src/app/audio`.

The hook should own:

- user-gesture activation state
- per-mood cycle state
- the currently active track instance
- the in-flight incoming track instance during a crossfade
- the latest requested mood

The hook should not own:

- mood resolution logic
- music file discovery
- persisted audio settings shape

### Howler Track Instance Shape

Represent each playback slot with narrow controller state:

```ts
type BackgroundMusicPlayback = {
  mood: BackgroundMusicMood;
  trackId: string;
  howl: Howl;
  soundId: number;
};
```

Each slot should use a single-source `Howl` for one selected MP3 asset. The controller keeps at most two live slots at once: the audible active track and the incoming transition track.

### Fade Timings

Use fixed controller constants rather than new settings:

- initial playback fade-in: `500ms`
- natural next-track fade-in: `500ms`
- mood-change crossfade duration: `1000ms`

These values are intentionally deterministic and small enough to feel responsive when combat starts.

### Initial Playback

The hook should keep the current delayed activation model: music begins only after the first user pointer or keyboard gesture.

On first activation:

1. Select the next track for the current mood from the existing cycle helper.
2. Create a `Howl` for that track.
3. Start playback at volume `0`.
4. Fade to the current `musicVolume` over `500ms`.

If music is muted at activation time, the track may still be created so the controller has a live playback instance, but it must remain muted.

### Natural Track Advancement

When a track ends without a mood change:

1. Select the next eligible track in the same mood from the cycle helper.
2. Create a fresh `Howl`.
3. Start it at volume `0`.
4. Fade to the current effective music volume over `500ms`.
5. Stop and unload the finished instance.

Each playback instance is one track only. Reusing one `Howl` across multiple sources is not part of this design.

### Immediate Mood Change Crossfade

When the requested mood changes and playback is already active:

1. Select the next eligible track from the new mood immediately.
2. Cancel and unload any stale incoming transition track that has not become active yet.
3. Create a `Howl` for the newly selected track.
4. Start the new track at volume `0`.
5. Fade the current active track from its current audible volume to `0` over `1000ms`.
6. Fade the incoming track from `0` to the current effective music volume over `1000ms`.
7. After fade completion, stop and unload the old active track.
8. Promote the incoming track to active.

The controller must not wait for the current track to finish when the mood changes.

### Settings Integration

Audio settings remain authoritative for background music:

- `musicVolume` updates the active and incoming `Howl` volumes immediately.
- `muted` or `musicMuted` mute the active and incoming `Howl` instances immediately.
- unmuting restores playback to the configured `musicVolume`.

The controller should treat the effective target volume as:

```ts
const targetMusicVolume =
  settings.muted || settings.musicMuted ? 0 : settings.musicVolume;
```

That target volume is the value fades should use when starting or promoting a track.

### Load Failure Handling

If a selected track fails to load or play:

- immediately select the next eligible track in the same mood
- continue retrying until the number of failed selections reaches the playlist length for that attempt
- if every track in that mood fails during the attempt, leave the controller silent and wait for the next natural retry trigger such as a later mood change or user activation in a new session

This preserves the current retry intent without creating an infinite synchronous retry loop.

### Cleanup

On unmount and on slot replacement:

- detach Howler listeners for `end`, `loaderror`, `playerror`, and fade completion
- stop any playing instance
- unload the `Howl`
- clear stale refs so completed fade callbacks cannot reactivate discarded tracks

This keeps the lazy audio domain from leaking background playback across app remounts.

### Dependency And Bundle Shape

Add `howler` as a direct dependency of `@realmfall/client`.

Because background music is lazily imported through `BackgroundMusicControllerBridge`, the direct `howler` usage should remain in the `background-audio` lazy chunk. The current chunk-routing helper already recognizes `howler`, so the implementation should preserve that split while removing the now-unused `react-use-audio-player` runtime dependency from the background-music path.

## Behavior And Data Flow

### Playlist Rules

- Each mood keeps its own shuffle bag.
- A mood playlist must cycle through all of its tracks before resetting the bag.
- When a playlist has more than one track, the next selection must avoid repeating the last completed track if another option exists.
- Single-track moods simply replay that one track when needed.

### Rapid Mood Flapping

If moods change repeatedly during an unfinished crossfade:

- the newest mood replaces the previous pending transition
- the stale incoming track is stopped and unloaded
- the currently audible track fades toward the newest transition target

The result should always converge to the latest mood rather than finishing older transitions in order.

### Activation Before Audio Unlock

The app continues to rely on explicit user input before starting music playback. No autoplay attempt should occur before the existing activation boundary is crossed.

## Testing

Add or update tests for:

- initial activation loading the selected mood track and fading it in
- natural track end advancing to the next shuffled track in the same mood
- immediate mood changes starting a crossfade without waiting for the prior track to end
- settings updates muting, unmuting, and changing volume on active and incoming tracks
- rapid repeated mood changes discarding stale incoming transitions
- selected-track load failures retrying within the same mood and stopping after the playlist-sized retry budget is exhausted
- controller cleanup stopping and unloading active and incoming tracks on unmount
- playlist helper coverage confirming full-cycle shuffle behavior and no immediate repeat when alternatives exist

Use mocked `Howl` instances in the controller tests so the suite remains deterministic and can assert listener registration, fade calls, stop calls, and unload calls directly.

## File Targets

Likely touch points:

- `packages/client/package.json`
- `packages/client/vite/chunks.ts`
- `packages/client/src/app/audio/useBackgroundMusicController.ts`
- `packages/client/src/app/audio/useBackgroundMusicController.test.tsx`
- `packages/client/src/app/audio/backgroundMusic.test.ts`
- `packages/client/src/test/setup.shared.ts`

Possible additional helper extraction if the hook becomes too broad:

- `packages/client/src/app/audio/backgroundMusicHowler.ts`

## Resolved Decisions

- Mood changes switch immediately through a crossfade rather than waiting for track end.
- Shuffle and full-cycle playlist behavior stay per mood and reuse the existing selection helper.
- Fade timings are fixed implementation constants, not player settings.
- This change is scoped to background music rather than all audio playback in the client.
