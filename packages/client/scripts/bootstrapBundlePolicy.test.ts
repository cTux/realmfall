import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

interface Violation {
  file: string;
  lineNumber: number;
  line: string;
}

const thisDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(thisDir, '..', 'src');

function hasRuntimeRootImport(filePath: string): Violation[] {
  const fileText = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TSX,
  );

  const violations: Violation[] = [];

  const statements = sourceFile.statements.filter((statement) =>
    ts.isImportDeclaration(statement),
  );
  for (const statement of statements) {
    if (
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@realmfall/ui-react'
    ) {
      continue;
    }

    const importClause = statement.importClause;
    if (!importClause || importClause.isTypeOnly) {
      continue;
    }

    let hasRuntimeBinding = false;
    if (importClause.name) {
      hasRuntimeBinding = true;
    } else if (
      importClause.namedBindings &&
      ts.isNamespaceImport(importClause.namedBindings)
    ) {
      hasRuntimeBinding = true;
    } else if (
      importClause.namedBindings &&
      ts.isNamedImports(importClause.namedBindings)
    ) {
      hasRuntimeBinding = importClause.namedBindings.elements.some(
        (element) => !element.isTypeOnly,
      );
    }

    if (!hasRuntimeBinding) {
      continue;
    }

    const lineAndCharacter = sourceFile.getLineAndCharacterOfPosition(
      statement.getStart(),
    );
    const line = statement
      .getText(sourceFile)
      .split('\n')[0]
      .replace(/\s+/g, ' ')
      .trim();
    violations.push({
      file: relative(projectRoot, filePath).replace(/\\/g, '/'),
      lineNumber: lineAndCharacter.line + 1,
      line,
    });
  }

  return violations;
}

function findForbiddenImports(): Violation[] {
  const eagerFiles = [
    resolve(projectRoot, 'app', 'App', 'components', 'AppShell.tsx'),
    resolve(projectRoot, 'app', 'App', 'usePixiWorldHover.ts'),
    resolve(
      projectRoot,
      'app',
      'App',
      'world',
      'pixiWorldHoverInteractions.ts',
    ),
    resolve(projectRoot, 'app', 'App', 'hooks', 'useItemTooltipController.ts'),
    resolve(projectRoot, 'app', 'audio', 'UiAudioContext.tsx'),
  ];
  const deferredFiles = [
    resolve(projectRoot, 'ui', 'tooltips', 'shared.ts'),
    resolve(projectRoot, 'app', 'App', 'components', 'AppFixedWindows.tsx'),
    resolve(projectRoot, 'ui', 'world', 'worldTooltips.ts'),
    resolve(projectRoot, 'ui', 'components', 'WindowShell.tsx'),
    resolve(projectRoot, 'ui', 'components', 'WindowLoadingState.tsx'),
    resolve(projectRoot, 'ui', 'components', 'WindowHeaderActionButton.tsx'),
    resolve(
      projectRoot,
      'ui',
      'components',
      'InventoryWindow',
      'InventoryWindow.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'InventoryWindow',
      'InventoryWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'HexInfoWindow',
      'HexInfoWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'EquipmentWindow',
      'EquipmentWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'RecipeBookWindow',
      'RecipeBookWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'RecipeBookWindow',
      'RecipeBookVirtualRow.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsAudioPanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsGameplayPanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsGraphicsPanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsInterfacePanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsSavesPanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'GameSettingsWindow',
      'GameSettingsWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'EntityStatusPanel',
      'EntityStatusPanel.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'DebugWindow',
      'DebugWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'LootWindow',
      'LootWindowContent.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'VersionStatusWidget',
      'VersionStatusWidget.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'DraggableWindow',
      'DraggableWindow.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'DraggableWindow',
      'DraggableWindowFrame.tsx',
    ),
    resolve(
      projectRoot,
      'ui',
      'components',
      'HeroWindow',
      'components',
      'StatBar',
      'StatBar.tsx',
    ),
  ];

  return [...eagerFiles, ...deferredFiles].flatMap(hasRuntimeRootImport);
}

describe('bootstrap bundle import policy', () => {
  it('only allows type imports from the root @realmfall/ui-react entry in deferred runtime surfaces', () => {
    expect(findForbiddenImports()).toEqual([]);
  });
});
