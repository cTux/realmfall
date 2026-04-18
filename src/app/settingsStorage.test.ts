import { clearAudioSettings } from './audioSettings';
import { clearGraphicsSettings } from './graphicsSettings';

describe('settings storage recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('treats malformed shared settings as empty when clearing audio', () => {
    window.localStorage.setItem('settings', '{not-json');

    expect(() => clearAudioSettings()).not.toThrow();
    expect(window.localStorage.getItem('settings')).toBe('{not-json');
  });

  it('treats malformed shared settings as empty when clearing graphics', () => {
    window.localStorage.setItem('settings', '{not-json');
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({ antialias: false }),
    );

    expect(() => clearGraphicsSettings()).not.toThrow();
    expect(window.localStorage.getItem('settings')).toBe('{not-json');
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });
});
