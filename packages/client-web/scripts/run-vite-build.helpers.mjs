import { stripVTControlCharacters } from 'node:util';

const PLUGIN_TIMING_LABEL = '[PLUGIN_TIMINGS] Warning:';
const PLUGIN_TIMING_DOC_URL =
  'https://rolldown.rs/options/checks#plugintimings';
const SUPPRESSED_PLUGIN_TIMINGS = new Set([
  '@rolldown/plugin-babel',
  'unplugin-detect-duplicated-deps',
  'rollup-plugin-visualizer',
  'vite:asset',
]);

export function stripAnsi(text) {
  return stripVTControlCharacters(text);
}

export function shouldSuppressPluginTimingBlock(blockLines) {
  const normalizedLines = blockLines.map((line) => stripAnsi(line).trim());

  if (!normalizedLines.some((line) => line.includes(PLUGIN_TIMING_LABEL))) {
    return false;
  }

  const breakdownPlugins = normalizedLines
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').replace(/\s+\(.+$/, ''));

  if (breakdownPlugins.length > 0) {
    return breakdownPlugins.every((pluginName) =>
      SUPPRESSED_PLUGIN_TIMINGS.has(pluginName),
    );
  }

  const singlePluginMatch = normalizedLines
    .join(' ')
    .match(/plugin [`'"]?([^`'".]+?)(?:[`'"]|\.| See|$)/i);

  if (!singlePluginMatch) {
    return false;
  }

  return SUPPRESSED_PLUGIN_TIMINGS.has(singlePluginMatch[1]);
}

export function filterKnownPluginTimingWarnings(output) {
  if (!output.includes(PLUGIN_TIMING_LABEL)) {
    return output;
  }

  const usesCrLf = output.includes('\r\n');
  const newline = usesCrLf ? '\r\n' : '\n';
  const lines = output.split(/\r?\n/);
  const filteredLines = [];
  let pluginTimingBlock = null;

  const flushPluginTimingBlock = () => {
    if (!pluginTimingBlock) {
      return;
    }

    if (!shouldSuppressPluginTimingBlock(pluginTimingBlock)) {
      filteredLines.push(...pluginTimingBlock);
    }

    pluginTimingBlock = null;
  };

  for (const line of lines) {
    const normalizedLine = stripAnsi(line);

    if (pluginTimingBlock) {
      pluginTimingBlock.push(line);

      if (normalizedLine.includes(PLUGIN_TIMING_DOC_URL)) {
        flushPluginTimingBlock();
      }
      continue;
    }

    if (normalizedLine.includes(PLUGIN_TIMING_LABEL)) {
      pluginTimingBlock = [line];

      if (normalizedLine.includes(PLUGIN_TIMING_DOC_URL)) {
        flushPluginTimingBlock();
      }
      continue;
    }

    filteredLines.push(line);
  }

  flushPluginTimingBlock();

  return filteredLines.join(newline);
}
