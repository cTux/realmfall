# Browser Response Hardening

## Scope

This spec covers the browser security headers emitted by the local Vite server, Vite preview, and the static HTTPS preview server configuration.

## Current Solution

- The app emits a strict `Content-Security-Policy` in both Vite-served and static preview responses.
- The current CSP blocks framing, disallows plugin content, restricts script execution to same-origin sources, and limits network, worker, image, font, and manifest sources to the current app runtime needs.
- `X-Frame-Options: DENY` is sent alongside CSP frame blocking for defense in depth.
- `X-Content-Type-Options: nosniff` is sent so browsers do not content-sniff responses into unexpected executable types.
- `Referrer-Policy: strict-origin-when-cross-origin` is sent so cross-origin navigation does not leak full in-app paths.
- `Permissions-Policy` disables browser capabilities the game does not use, including camera, microphone, geolocation, accelerometer, gyroscope, payment, and USB access.
- Vite dev headers allow inline scripts only where the dev server runtime requires them; preview and static serving keep the stricter production script policy.

## Main Implementation Areas

- `vite.config.ts`
- `serve.json`
