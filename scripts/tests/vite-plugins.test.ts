import {
  createAppModulePreloadPlugin,
  minifyJsonAssetsPlugin,
} from '../../vite/plugins';

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

  it('injects a source App modulepreload hint before the dev bundle exists', () => {
    const plugin = createAppModulePreloadPlugin();
    const transformIndexHtml = plugin.transformIndexHtml;
    const handler =
      typeof transformIndexHtml === 'object'
        ? transformIndexHtml.handler
        : transformIndexHtml;

    if (typeof handler !== 'function') {
      throw new Error(
        'Expected createAppModulePreloadPlugin to define transformIndexHtml',
      );
    }

    expect(handler('<html></html>', {} as never)).toEqual([
      {
        tag: 'link',
        attrs: {
          href: '/src/app/App/index.ts',
          rel: 'modulepreload',
        },
        injectTo: 'head',
      },
    ]);
  });

  it('injects the emitted App chunk modulepreload hint for production HTML', () => {
    const plugin = createAppModulePreloadPlugin();
    const transformIndexHtml = plugin.transformIndexHtml;
    const handler =
      typeof transformIndexHtml === 'object'
        ? transformIndexHtml.handler
        : transformIndexHtml;

    if (typeof handler !== 'function') {
      throw new Error(
        'Expected createAppModulePreloadPlugin to define transformIndexHtml',
      );
    }

    expect(
      handler('<html></html>', {
        bundle: {
          'assets/js/App-abc.js': {
            type: 'chunk',
            name: 'App',
            fileName: 'assets/js/App-abc.js',
          },
        },
      } as never),
    ).toEqual([
      {
        tag: 'link',
        attrs: {
          crossorigin: true,
          href: '/assets/js/App-abc.js',
          rel: 'modulepreload',
        },
        injectTo: 'head',
      },
    ]);
  });
});
