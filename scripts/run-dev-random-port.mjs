import { networkInterfaces } from 'node:os';
import process from 'node:process';
import { createServer } from 'vite';

function isOptionToken(value) {
  return value.startsWith('-');
}

function readOptionalValue(args, index) {
  const nextValue = args[index + 1];

  if (!nextValue || isOptionToken(nextValue)) {
    return [true, index];
  }

  return [nextValue, index + 1];
}

function readRequiredValue(args, index, optionName) {
  const nextValue = args[index + 1];

  if (!nextValue || isOptionToken(nextValue)) {
    throw new Error(`Missing value for ${optionName}.`);
  }

  return [nextValue, index + 1];
}

function assignBooleanOption(target, key) {
  target[key] = true;
}

function assignStringOption(target, key, value) {
  target[key] = value;
}

function parseDevRandomArgs(args) {
  const inlineConfig = {
    server: {},
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (!argument) {
      continue;
    }

    if (argument === '--') {
      continue;
    }

    if (argument === '--host') {
      const [host, nextIndex] = readOptionalValue(args, index);
      inlineConfig.server.host = host;
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--host=')) {
      inlineConfig.server.host = argument.slice('--host='.length) || true;
      continue;
    }

    if (argument === '--open') {
      const [open, nextIndex] = readOptionalValue(args, index);
      inlineConfig.server.open = open;
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--open=')) {
      inlineConfig.server.open = argument.slice('--open='.length) || true;
      continue;
    }

    if (argument === '--strictPort') {
      assignBooleanOption(inlineConfig.server, 'strictPort');
      continue;
    }

    if (argument === '--cors') {
      assignBooleanOption(inlineConfig.server, 'cors');
      continue;
    }

    if (argument === '--force') {
      inlineConfig.optimizeDeps = {
        ...inlineConfig.optimizeDeps,
        force: true,
      };
      continue;
    }

    if (argument === '--clearScreen') {
      inlineConfig.clearScreen = true;
      continue;
    }

    if (argument === '--mode') {
      const [mode, nextIndex] = readRequiredValue(args, index, '--mode');
      assignStringOption(inlineConfig, 'mode', mode);
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--mode=')) {
      assignStringOption(
        inlineConfig,
        'mode',
        argument.slice('--mode='.length),
      );
      continue;
    }

    if (argument === '--base') {
      const [base, nextIndex] = readRequiredValue(args, index, '--base');
      assignStringOption(inlineConfig, 'base', base);
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--base=')) {
      assignStringOption(
        inlineConfig,
        'base',
        argument.slice('--base='.length),
      );
      continue;
    }

    if (argument === '--config') {
      const [configFile, nextIndex] = readRequiredValue(
        args,
        index,
        '--config',
      );
      assignStringOption(inlineConfig, 'configFile', configFile);
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--config=')) {
      assignStringOption(
        inlineConfig,
        'configFile',
        argument.slice('--config='.length),
      );
      continue;
    }

    if (argument === '--logLevel') {
      const [logLevel, nextIndex] = readRequiredValue(
        args,
        index,
        '--logLevel',
      );
      assignStringOption(inlineConfig, 'logLevel', logLevel);
      index = nextIndex;
      continue;
    }

    if (argument.startsWith('--logLevel=')) {
      assignStringOption(
        inlineConfig,
        'logLevel',
        argument.slice('--logLevel='.length),
      );
      continue;
    }

    if (argument === '--help' || argument === '-h') {
      console.log(
        'Usage: pnpm dev:random [root] [--host [host]] [--open [path]] [--cors] [--strictPort] [--force] [--mode mode] [--base base] [--config path] [--logLevel level] [--clearScreen]',
      );
      process.exit(0);
    }

    if (isOptionToken(argument)) {
      throw new Error(`Unsupported argument for dev:random: ${argument}`);
    }

    if (inlineConfig.root) {
      throw new Error(
        `Unexpected extra positional argument for dev:random: ${argument}`,
      );
    }

    inlineConfig.root = argument;
  }

  return inlineConfig;
}

function formatHostForUrl(host) {
  return host.includes(':') ? `[${host}]` : host;
}

function getProtocol(server) {
  return server.config.server.https ? 'https' : 'http';
}

function isLoopbackHost(host) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  );
}

function getNetworkUrls(port, protocol) {
  return Object.values(networkInterfaces())
    .flatMap((networkInterface) => networkInterface ?? [])
    .filter((entry) => entry.family === 'IPv4' && !entry.internal)
    .map((entry) => `${protocol}://${entry.address}:${port}/`);
}

function resolveListenHost(configuredHost) {
  if (configuredHost === undefined || configuredHost === false) {
    return 'localhost';
  }

  if (configuredHost === true) {
    return undefined;
  }

  return configuredHost;
}

function resolveDisplayUrls(server) {
  const address = server.httpServer?.address();

  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve the Vite dev server address.');
  }

  const protocol = getProtocol(server);
  const configuredHost = server.config.server.host;
  const base =
    server.config.rawBase === './' || server.config.rawBase === ''
      ? '/'
      : server.config.rawBase;
  const local = [];
  const network = [];

  if (typeof configuredHost === 'string') {
    const url = `${protocol}://${formatHostForUrl(configuredHost)}:${address.port}${base}`;

    if (isLoopbackHost(configuredHost)) {
      local.push(url);
    } else if (configuredHost === '0.0.0.0' || configuredHost === '::') {
      local.push(`${protocol}://localhost:${address.port}${base}`);
      network.push(
        ...getNetworkUrls(address.port, protocol).map(
          (url) => `${url.slice(0, -1)}${base}`,
        ),
      );
    } else {
      network.push(url);
    }
  } else {
    local.push(`${protocol}://localhost:${address.port}${base}`);

    if (configuredHost === true) {
      network.push(
        ...getNetworkUrls(address.port, protocol).map(
          (url) => `${url.slice(0, -1)}${base}`,
        ),
      );
    }
  }

  return {
    local,
    network,
  };
}

const inlineConfig = parseDevRandomArgs(process.argv.slice(2));
const server = await createServer(inlineConfig);
const httpServer = server.httpServer;

if (!httpServer) {
  throw new Error('Vite did not create an HTTP server for dev:random.');
}

// Bind directly to port 0 so the OS picks and reserves the ephemeral port.
await new Promise((resolve, reject) => {
  httpServer.once('error', reject);
  httpServer.once('listening', resolve);
  httpServer.listen(0, resolveListenHost(server.config.server.host));
});

server.resolvedUrls = resolveDisplayUrls(server);
server.printUrls();

if (server.config.server.open) {
  server.openBrowser();
}

if (process.stdin.isTTY) {
  server.bindCLIShortcuts({ print: true });
}

const closeServer = async (signal) => {
  await server.close();

  if (signal) {
    process.exit(0);
  }
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void closeServer(signal);
  });
}
