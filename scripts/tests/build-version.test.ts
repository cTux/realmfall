import {
  createBuildVersion,
  getAppBuildVersion,
} from '../client/scripts/build-version.helpers';

describe('build version helpers', () => {
  it('uses the package version when no git revision is available', () => {
    expect(createBuildVersion('0.2.347', null)).toBe('0.2.347');
  });

  it('appends the git revision as semver build metadata', () => {
    expect(createBuildVersion('0.2.347', 'abc123def456')).toBe(
      '0.2.347+abc123def456',
    );
  });

  it('falls back to the package version when git metadata is unavailable', () => {
    expect(getAppBuildVersion('0.2.347', 'Z:/not-a-repo')).toBe('0.2.347');
  });
});
