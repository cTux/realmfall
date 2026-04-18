# Browser Entry Metadata

## Scope

This spec covers the static HTML metadata and crawler directives shipped with the browser entry point.

## Current Solution

- `index.html` ships a restrictive Content Security Policy that keeps the browser entry point on same-origin resources, blocks document embedding, and disables plugin-style object loading.
- `index.html` ships a concrete meta description that describes the current game and rendering stack in search and link-preview contexts.
- The production build publishes `robots.txt` from the Vite public asset path so crawlers receive an explicit allow rule instead of a missing-file response.
- Entry metadata remains lightweight and static so these crawl and preview signals do not depend on React booting before they become visible to user agents.

## Main Implementation Areas

- `index.html`
- `public/robots.txt`
