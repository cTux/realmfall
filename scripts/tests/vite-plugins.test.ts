import { vi } from 'vitest';
import {
  createAppModulePreloadPlugin,
  createVitePlugins,
  minifyJsonAssetsPlugin,
} from '../../vite/plugins';

const reactCompilerPreset = vi.hoisted(() => ({
  name: 'react-compiler-preset',
}));
const reactCompilerPresetOptions = vi.hoisted(() => [] as unknown[]);
const babelPluginOptions = vi.hoisted(() => [] as unknown[]);
const reactPluginOptions = vi.hoisted(() => [] as unknown[]);

vi.mock('@vitejs/plugin-react', () => ({
  default: (options: unknown) => {
    reactPluginOptions.push(options);
    return [
      {
        name: 'vite:react',
      },
    ];
  },
  reactCompilerPreset: (options: unknown) => {
    reactCompilerPresetOptions.push(options);
    return reactCompilerPreset;
  },
}));

vi.mock('@rolldown/plugin-babel', () => ({
  default: (options: unknown) => {
    babelPluginOptions.push(options);
    return {
      name: 'rolldown:babel',
    };
  },
}));

describe('Vite plugin policy', () => {
  beforeEach(() => {
    babelPluginOptions.length = 0;
    reactCompilerPresetOptions.length = 0;
    reactPluginOptions.length = 0;
  });

  it('enables React Compiler through the Vite Babel plugin', () => {
    createVitePlugins({
      appBuildVersion: 'test-version',
      isStorybookScript: false,
      isVitestRun: false,
      runBundleVisualizer: false,
      runDuplicateDepsAudit: false,
    });

    expect(reactPluginOptions).toHaveLength(1);
    expect(reactPluginOptions[0]).toBeUndefined();
    expect(reactCompilerPresetOptions).toEqual([undefined]);
    expect(babelPluginOptions).toEqual([
      {
        presets: [reactCompilerPreset],
      },
    ]);
  });

  it('keeps the Vitest cache plugin ahead of React transforms during test runs', () => {
    const plugins = createVitePlugins({
      appBuildVersion: 'test-version',
      isStorybookScript: false,
      isVitestRun: true,
      runBundleVisualizer: false,
      runDuplicateDepsAudit: false,
    });

    expect(JSON.stringify(plugins.slice(0, 3))).toContain(
      'realmfall-vitest-cache',
    );
  });

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

  it('uses the Vite base for modulepreload paths', () => {
    const plugin = createAppModulePreloadPlugin();
    const transformIndexHtml = plugin.transformIndexHtml;
    const handler =
      typeof transformIndexHtml === 'object'
        ? transformIndexHtml.handler
        : transformIndexHtml;

    plugin.configResolved?.({ base: '/realmfall/' } as never);

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
      } as never,
    )).toEqual([
      {
        tag: 'link',
        attrs: {
          crossorigin: true,
          href: '/realmfall/assets/js/App-abc.js',
          rel: 'modulepreload',
        },
        injectTo: 'head',
      },
    ]);
  });
});
