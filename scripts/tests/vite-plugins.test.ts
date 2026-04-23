import { minifyJsonAssetsPlugin } from '../../vite/plugins';

describe('Vite plugin policy', () => {
  it('minifies emitted JSON assets without changing non-JSON assets', () => {
    const plugin = minifyJsonAssetsPlugin();
    const generateBundle = plugin.generateBundle;
    if (typeof generateBundle !== 'function') {
      throw new Error(
        'Expected minifyJsonAssetsPlugin to define generateBundle',
      );
    }
    const bundle = {
      'assets/misc/en.json': {
        type: 'asset',
        fileName: 'assets/misc/en.json',
        source: '{\n  "app.title": "Realmfall",\n  "ui.ready": true\n}\n',
      },
      'assets/js/App.js': {
        type: 'chunk',
        fileName: 'assets/js/App.js',
        code: 'export {};',
      },
    };

    generateBundle.call({} as never, {} as never, bundle as never, false);

    expect(bundle['assets/misc/en.json'].source).toBe(
      '{"app.title":"Realmfall","ui.ready":true}\n',
    );
    expect(bundle['assets/js/App.js'].code).toBe('export {};');
  });
});
