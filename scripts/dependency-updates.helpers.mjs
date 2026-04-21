export const DEPENDENCY_SANITY_COMMANDS = [
  'typecheck',
  'lint',
  'test',
  'build',
];

const SUPPORTED_COMMANDS = new Set(['check', 'update']);
const SUPPORTED_TARGETS = new Set(['major', 'minor']);
const ALLOWED_CHANGED_FILES = new Set(['package.json', 'pnpm-lock.yaml']);

export function parseCliArgs(argv) {
  const options = {
    command: null,
    commit: true,
    help: false,
    target: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--no-commit') {
      options.commit = false;
      continue;
    }

    if (arg === '--target') {
      const target = argv[index + 1];

      if (!target || !SUPPORTED_TARGETS.has(target)) {
        throw new Error('Expected --target to be followed by major or minor.');
      }

      options.target = target;
      index += 1;
      continue;
    }

    if (SUPPORTED_COMMANDS.has(arg)) {
      if (options.command != null) {
        throw new Error(
          `Received multiple commands: ${options.command}, ${arg}`,
        );
      }

      options.command = arg;
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  if (options.help) {
    return options;
  }

  if (options.command == null) {
    throw new Error('Expected a command: check or update.');
  }

  if (options.command === 'check' && options.target != null) {
    throw new Error('The check command does not accept --target.');
  }

  if (options.command === 'update' && options.target == null) {
    throw new Error(
      'The update command requires --target major or --target minor.',
    );
  }

  return options;
}

export function createNcuArgs({ command, target }) {
  const args = ['exec', 'npm-check-updates'];

  if (command === 'update') {
    args.push('-u');
  }

  if (target === 'minor') {
    args.push('--target', 'minor');
  }

  if (target === 'major') {
    args.push('--target', 'latest');
  }

  args.push('--packageManager', 'pnpm');

  return args;
}

export function getDependencyCommitMessage(target) {
  return `chore(dependencies): update ${target} dependency versions`;
}

export function parseChangedFiles(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getUnexpectedChangedFiles(changedFiles) {
  return changedFiles.filter((file) => !ALLOWED_CHANGED_FILES.has(file));
}
