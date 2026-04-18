import { createVitest } from 'vitest/node';
import { load } from '../../node_modules/@raegen/vite-plugin-vitest-cache/dist/load.js';
import { prune } from '../../node_modules/@raegen/vite-plugin-vitest-cache/dist/prune.js';
import {
  createMeasurement,
  format,
  formatDim,
  version,
} from '../../node_modules/@raegen/vite-plugin-vitest-cache/dist/util.js';

const convertToUserConfig = ({ shard, cache: _cache, ...config }) => ({
  ...config,
  shard: shard ? `${shard.index}/${shard.count}` : undefined,
});

async function getFiles(config) {
  const vitest = await createVitest('test', convertToUserConfig(config));

  try {
    const specs = await vitest.getRelevantTestSpecifications();
    return specs.map(({ moduleId }) => moduleId);
  } finally {
    await vitest.close();
  }
}

export default async ({ config, provide }) => {
  if (!config.vCache.silent) {
    console.log(format('[vCache]'), formatDim(version));
  }

  const files = await getFiles(config);
  const building = createMeasurement('built hashes in', config.vCache.silent);
  const output = await load(files, config.vCache.dir);
  building.done().log();

  provide('v-cache:data', output);
  provide('v-cache:config', config.vCache);

  const counts = Object.values(output).reduce(
    (acc, { data }) => {
      acc.total++;
      if (data) {
        acc.cache++;
      }
      return acc;
    },
    {
      total: 0,
      cache: 0,
    },
  );

  return async () => {
    if (!config.vCache.silent) {
      console.log(
        format('[vCache]'),
        formatDim(`${counts.cache}/${counts.total} files read from cache`),
      );
    }

    await prune(output, config);
  };
};
