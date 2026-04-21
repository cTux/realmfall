# Browser Response Hardening

## Scope

This spec covers the browser security headers emitted by the local Vite server, Vite preview, and the static HTTPS preview server configuration.

## Current Solution

- The app emits a strict `Content-Security-Policy` in both Vite-served and static preview responses.
- The current CSP blocks framing, disallows plugin content, restricts script execution to same-origin sources, and limits network, worker, image, font, and manifest sources to the current app runtime needs.
- The current CSP separates style element and style attribute allowances so production responses keep inline style elements disabled while allowing the runtime's existing inline style attributes.
- `Cross-Origin-Opener-Policy: same-origin` is sent so the app keeps a same-origin browsing context group instead of sharing one with unrelated cross-origin windows.
- `Cross-Origin-Resource-Policy: same-origin` is sent so other origins cannot embed app-hosted resources unless the response is explicitly relaxed.
- `X-Frame-Options: DENY` is sent alongside CSP frame blocking for defense in depth.
- `X-Content-Type-Options: nosniff` is sent so browsers do not content-sniff responses into unexpected executable types.
- `Referrer-Policy: strict-origin-when-cross-origin` is sent so cross-origin navigation does not leak full in-app paths.
- `Permissions-Policy` disables browser capabilities the game does not use, including camera, microphone, geolocation, accelerometer, gyroscope, payment, and USB access.
- Vite dev headers allow inline scripts and inline style elements only where the dev server runtime requires them; preview and static serving keep the stricter production script policy and self-only style elements.

## Main Implementation Areas

- `vite.config.ts`
- `vite.security.ts`
- `serve.json`
