import {
  collectSourceFiles,
  getClientImportSpecifiers,
} from './utils/boundaryScan';

type BoundaryViolation = {
  filePath: string;
  specifier: string;
};

export class UiGameBoundaryTestkit {
  readonly actions = {
    collectViolations: () => {
      const sourceFiles = collectSourceFiles('src');

      return sourceFiles.flatMap((filePath) =>
        getClientImportSpecifiers(filePath).map((specifier) => ({
          filePath,
          specifier,
        })),
      );
    },
  };

  readonly expect = {
    noDirectClientImportsOutsideBridges: (violations: BoundaryViolation[]) => {
      expect(violations).toEqual([]);
    },
  };
}
