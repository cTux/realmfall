export function isDebugWindowRequested(search = window.location.search) {
  return new URLSearchParams(search).get('debug') === 'true';
}
