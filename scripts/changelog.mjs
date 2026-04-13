import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const releasesPath = path.join(rootDir, 'docs', 'changelog', 'releases.json');
const unreleasedPath = path.join(
  rootDir,
  'docs',
  'changelog',
  'unreleased.json',
);

const usage = 'Usage: node scripts/changelog.mjs <build|release>';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function normalizeAreas(areas) {
  if (!Array.isArray(areas)) {
    return [];
  }

  return areas
    .filter(
      (area) =>
        area && typeof area.name === 'string' && Array.isArray(area.changes),
    )
    .map((area) => ({
      name: area.name.trim(),
      changes: area.changes
        .filter(
          (change) => typeof change === 'string' && change.trim().length > 0,
        )
        .map((change) => change.trim()),
    }))
    .filter((area) => area.name.length > 0 && area.changes.length > 0);
}

function formatRelease(release) {
  const lines = [`## ${release.version} - ${release.date}`, ''];

  for (const area of normalizeAreas(release.areas)) {
    lines.push(`### ${area.name}`, '');

    for (const change of area.changes) {
      lines.push(`- ${change}`);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function buildMarkdown(releases) {
  const sections = [
    '# Changelog',
    '',
    'Game-facing release notes only. Tooling, CI, documentation, and other infrastructure-only changes are intentionally excluded.',
    '',
  ];

  const normalizedReleases = Array.isArray(releases) ? releases : [];

  for (const release of normalizedReleases) {
    sections.push(formatRelease(release), '');
  }

  return `${sections.join('\n').trimEnd()}\n`;
}

async function writeChangelog(releases) {
  await writeFile(changelogPath, buildMarkdown(releases), 'utf8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function build() {
  const releases = await readJson(releasesPath);
  await writeChangelog(releases);
}

async function release() {
  const packageJson = await readJson(packageJsonPath);
  const releases = await readJson(releasesPath);
  const unreleased = await readJson(unreleasedPath);
  const currentVersion = packageJson.version;
  const latestRelease = Array.isArray(releases) ? releases[0] : undefined;

  if (!currentVersion || typeof currentVersion !== 'string') {
    throw new Error('package.json must contain a string version.');
  }

  if (latestRelease?.version === currentVersion) {
    await writeChangelog(releases);
    return;
  }

  const unreleasedAreas = normalizeAreas(unreleased?.areas);

  if (unreleasedAreas.length === 0) {
    throw new Error(
      `Version ${currentVersion} is newer than the changelog source, but docs/changelog/unreleased.json has no game-facing changes.`,
    );
  }

  const nextRelease = {
    version: currentVersion,
    date: today(),
    areas: unreleasedAreas,
  };

  const nextReleases = [
    nextRelease,
    ...(Array.isArray(releases) ? releases : []),
  ];

  await writeJson(releasesPath, nextReleases);
  await writeJson(unreleasedPath, { areas: [] });
  await writeChangelog(nextReleases);
}

const mode = globalThis.process.argv[2];

if (mode === 'build') {
  await build();
} else if (mode === 'release') {
  await release();
} else {
  throw new Error(usage);
}
