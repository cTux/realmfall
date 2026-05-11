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

  return eagerFiles.flatMap(hasRuntimeRootImport);
}

describe('bootstrap bundle import policy', () => {
  it('only allows type imports from the root @realmfall/ui-react entry in the eager App path', () => {
    expect(findForbiddenImports()).toEqual([]);
  });
});
