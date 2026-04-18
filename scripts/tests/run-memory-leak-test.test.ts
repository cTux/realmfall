import {
  createFuiteArgs,
  MEMORY_LEAK_HEALTHCHECK_URL,
  MEMORY_LEAK_OUTPUT_PATH,
  MEMORY_LEAK_SCENARIO_PATH,
  MEMORY_LEAK_URL,
} from '../run-memory-leak-test.mjs';

describe('memory leak runner', () => {
  it('targets the fixed local HTTPS dev URL and writes JSON output', () => {
    expect(MEMORY_LEAK_URL).toBe('https://localhost:5173');
    expect(MEMORY_LEAK_HEALTHCHECK_URL).toBe(
      'https://localhost:5173/version.json',
    );
    expect(MEMORY_LEAK_OUTPUT_PATH.replaceAll('\\', '/')).toContain(
      '/.tests/memory-leaks/latest.json',
    );
  });

  it('builds fuite args with certificate bypass flags', () => {
    expect(createFuiteArgs()).toEqual([
      'exec',
      'fuite',
      'https://localhost:5173',
      '--output',
      MEMORY_LEAK_OUTPUT_PATH,
      '--scenario',
      MEMORY_LEAK_SCENARIO_PATH,
      '--browser-arg',
      '--ignore-certificate-errors',
      '--browser-arg',
      '--allow-insecure-localhost',
    ]);
  });
});
