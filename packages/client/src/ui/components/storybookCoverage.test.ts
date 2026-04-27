import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentsDir = join(
  process.cwd(),
  'packages',
  'client',
  'src',
  'ui',
  'components',
);
const sharedComponentsDir = join(
  process.cwd(),
  'packages',
  'ui',
  'src',
  'components',
);

const sharedComponentStoryDirs = new Map<string, string>([
  ['ActionBar', 'ActionBar'],
  ['GameTooltip', 'Tooltip'],
  ['ItemContextMenu', 'ContextMenu'],
  ['ItemSlotButton', 'ItemSlot'],
  ['WindowDock', 'DockPanel'],
]);

describe('storybook coverage', () => {
  it('keeps a story for each top-level UI component directory', () => {
    const missingDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'storybook')
      .map((entry) => entry.name)
      .filter((name) => !hasComponentStoryCoverage(name));

    expect(missingDirs).toEqual([]);
  });

  it('keeps stories for standalone and nested shared components', () => {
    const missingStandaloneComponents = readdirSync(componentsDir, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
      .map((entry) => entry.name)
      .filter(isStandaloneComponentFile)
      .filter((name) => {
        const baseName = name.slice(0, -'.tsx'.length);
        return !existsSync(join(componentsDir, `${baseName}.stories.tsx`));
      });

    expect(missingStandaloneComponents).toEqual([]);
    expect(
      existsSync(
        join(
          componentsDir,
          'HeroWindow',
          'components',
          'StatBar',
          'StatBar.stories.tsx',
        ),
      ),
    ).toBe(true);
  });

  it('renders dictionary catalogs from the live config arrays', () => {
    const dictionaryStories = readFileSync(
      join(componentsDir, 'storybook', 'ContentDictionaries.stories.tsx'),
      'utf8',
    );
    const dictionaryData = readFileSync(
      join(componentsDir, 'storybook', 'dictionaryStoryData.ts'),
      'utf8',
    );

    expect(dictionaryStories).toContain(
      "await import('./dictionaryStoryData')",
    );
    expect(dictionaryData).toContain('createStorybookFixtures()');
    expect(dictionaryData).toContain('fixtures.items');
    expect(dictionaryData).toContain('fixtures.enemies');
    expect(dictionaryData).toContain('fixtures.structures');
    expect(dictionaryData).toContain('Object.values(ABILITIES)');
    expect(dictionaryData).toContain('STATUS_EFFECT_DEFINITIONS');
  });
});

function hasStoryFile(directory: string): boolean {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return hasStoryFile(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.stories.tsx');
  });
}

function hasComponentStoryCoverage(componentDirectoryName: string) {
  const sharedDirectory = sharedComponentStoryDirs.get(componentDirectoryName);
  if (sharedDirectory) {
    return hasStoryFile(join(sharedComponentsDir, sharedDirectory));
  }

  return hasStoryFile(join(componentsDir, componentDirectoryName));
}

function isStandaloneComponentFile(name: string) {
  return (
    !name.endsWith('.stories.tsx') &&
    !name.endsWith('.test.tsx') &&
    /^[A-Z]/.test(name)
  );
}
