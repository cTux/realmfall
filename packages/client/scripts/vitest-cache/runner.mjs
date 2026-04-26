import { inject, TestRunner as VitestTestRunner } from 'vitest';
import { TaskCache } from '../../../node_modules/@raegen/vite-plugin-vitest-cache/dist/cache.js';
import { flagCache } from '../../../node_modules/@raegen/vite-plugin-vitest-cache/dist/util.js';

function getTasks(task) {
  if (!task || typeof task !== 'object') {
    return [];
  }

  if (!Array.isArray(task.tasks)) {
    return [task];
  }

  return [task, ...task.tasks.flatMap((child) => getTasks(child))];
}

export default class CachedRunner extends VitestTestRunner {
  cache = new TaskCache(inject('v-cache:data'));
  options = inject('v-cache:config');

  async provideCoverage(path) {
    try {
      await super.importFile(path, 'collect');
    } catch {
      // Coverage collection should not fail the cached restore path.
    }
  }

  shouldCache(task) {
    return this.options.states.includes(task.result.state);
  }

  shouldLog() {
    return !this.options.silent;
  }

  async onBeforeCollect(paths) {
    const restored = [];

    for (const testPath of [...paths]) {
      const cached = this.cache.restore(testPath);

      if (cached) {
        paths.splice(paths.indexOf(testPath), 1);

        if (this.shouldLog()) {
          flagCache(cached);
        }

        restored.push(cached);

        await this.onCollected?.([cached]);
        await this.onTaskUpdate?.(
          getTasks(cached).map((task) => [task.id, task.result, task.meta]),
          [],
        );
      }

      if (this.config.coverage.enabled) {
        await this.provideCoverage(testPath);
      }
    }

    return restored;
  }

  async onAfterRunFiles(files) {
    for await (const file of files) {
      if (this.shouldCache(file)) {
        await this.cache.save(file.filepath, file);
      }
    }

    return super.onAfterRunFiles(files);
  }
}
