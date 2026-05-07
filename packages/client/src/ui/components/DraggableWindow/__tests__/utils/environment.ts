let reactActEnvironmentInstalled = false;

export function ensureReactActEnvironment() {
  if (reactActEnvironmentInstalled) {
    return;
  }

  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  reactActEnvironmentInstalled = true;
}
