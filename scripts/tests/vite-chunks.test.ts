import {
  getManualChunk,
  resolveModulePreloadDependencies,
} from '../../vite/chunks';

describe('Vite chunk policy', () => {
  it('keeps Vite preload helpers out of lazy domain chunks', () => {
    expect(getManualChunk('\0vite/preload-helper.js')).toBe('build-runtime');
    expect(getManualChunk('/project/node_modules/react/jsx-runtime.js')).toBe(
      'react-core',
    );
    expect(
      getManualChunk(
        '/project/node_modules/react-use-audio-player/dist/index.js',
      ),
    ).toBeUndefined();
  });

  it('routes directly imported gameplay mutation modules into the state chunk', () => {
    expect(getManualChunk('/project/src/game/stateItemActions.ts')).toBe(
      'state',
    );
    expect(
      getManualChunk('/project/src/game/stateItemModificationActions.ts'),
    ).toBe('state');
    expect(getManualChunk('/project/src/game/stateWorldActions.ts')).toBe(
      'state',
    );
  });

  it('filters lazy Pixi and audio chunks from modulepreload dependencies', () => {
    expect(
      resolveModulePreloadDependencies(
        'assets/js/App-abc.js',
        [
          'assets/js/background-audio-abc.js',
          'assets/js/pixi-abc.js',
          'assets/js/react-core-abc.js',
          'assets/css/index-abc.css',
        ],
        { hostId: 'index.html', hostType: 'html' },
      ),
    ).toEqual(['assets/js/react-core-abc.js', 'assets/css/index-abc.css']);
  });
});
