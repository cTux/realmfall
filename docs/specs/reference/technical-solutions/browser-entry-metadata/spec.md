# Browser Entry Metadata

## Scope

This spec covers the static HTML metadata and crawler directives shipped with the browser entry point.

## Current Solution

- `index.html` ships a restrictive meta-delivered Content Security Policy for resource loading, while anti-framing protection is delivered as HTTP response headers through the configured Vite and static-serve paths so browsers enforce document embedding denial.
- `index.html` ships a concrete meta description that describes the current game and rendering stack in search and link-preview contexts.
- `index.html` modulepreloads the deferred `src/app/App/index.ts` entry so the browser can fetch the App chunk during i18n loading without evaluating the App module before bootstrap imports it.
- The production build publishes `robots.txt` from the Vite public asset path so crawlers receive an explicit allow rule instead of a missing-file response.
- The shipped browser entry does not register a service worker or publish a web app manifest, keeping startup metadata focused on the playable tab experience instead of installable offline behavior.
- Entry metadata remains lightweight and static so these crawl and preview signals do not depend on React booting before they become visible to user agents.

## Main Implementation Areas

- `index.html`
- `serve.json`
- `vite.config.ts`
- `public/robots.txt`
