import * as ts from 'typescript';
import { Change, InsertChange, NoopChange } from '@schematics/angular/utility/change';

export function insertImport(
  source: ts.SourceFile,
  fileToEdit: string,
  symbolName: string,
  fileName: string,
  isDefault = false
): Change {
  const rootNode = source;
  const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);

  // get nodes that map to import statements from the file fileName
  const relevantImports = allImports.filter((node) => {
    // StringLiteral of the ImportDeclaration is the import file (fileName in this case).
    const importFiles = node
      .getChildren()
      .filter((child) => child.kind === ts.SyntaxKind.StringLiteral)
      .map((n) => (n as ts.StringLiteral).text);

    return importFiles.filter((file) => file === fileName).length === 1;
  });

  if (relevantImports.length > 0) {
    let importsAsterisk = false;
    // imports from import file
    const imports: ts.Node[] = [];
    relevantImports.forEach((n) => {
      Array.prototype.push.apply(
        imports,
        findNodes(n, ts.SyntaxKind.Identifier)
      );
      if (findNodes(n, ts.SyntaxKind.AsteriskToken).length > 0) {
        importsAsterisk = true;
      }
    });

    // if imports * from fileName, don't add symbolName
    if (importsAsterisk) {
      return new NoopChange();
    }

    const importTextNodes = imports.filter(
      (n) => (n as ts.Identifier).text === symbolName
    );

    // insert import if it's not there
    if (importTextNodes.length === 0) {
      const fallbackPos =
        findNodes(
          relevantImports[0],
          ts.SyntaxKind.CloseBraceToken
        )[0].getStart() ||
        findNodes(relevantImports[0], ts.SyntaxKind.FromKeyword)[0].getStart();

      return insertAfterLastOccurrence(
        imports,
        `, ${symbolName}`,
        fileToEdit,
        fallbackPos
      );
    }

    return new NoopChange();
  }

  // no such import declaration exists
  const useStrict = findNodes(rootNode, ts.SyntaxKind.StringLiteral).filter(
    (n) => n.getText() === 'use strict'
  );
  let fallbackPos = 0;
  if (useStrict.length > 0) {
    fallbackPos = useStrict[0].end;
  }

  const open = isDefault ? '' : '{ ';
  const close = isDefault ? '' : ' }';
  // if there are no imports or 'use strict' statement, insert import at beginning of file
  const insertAtBeginning = allImports.length === 0 && useStrict.length === 0;
  const separator = insertAtBeginning ? '' : ';\n';
  const toInsert =
    `${separator}import ${open}${symbolName}${close}` +
    ` from '${fileName}'${insertAtBeginning ? ';\n' : ''}`;

  return insertAfterLastOccurrence(
    allImports,
    toInsert,
    fileToEdit,
    fallbackPos,
    ts.SyntaxKind.StringLiteral
  );
}

export function insertExport(
  source: ts.SourceFile,
  fileToEdit: string,
  symbolName: string,
  fileName: string
): Change {
  const rootNode = source;
  const allExports = findNodes(rootNode, ts.SyntaxKind.ExportDeclaration);

  // get nodes that map to export statements from the file fileName
  const relevantExports = allExports.filter((node) => {
    const exportFiles = node
      .getChildren()
      .filter((child) => child.kind === ts.SyntaxKind.StringLiteral)
      .map((n) => (n as ts.StringLiteral).text);

    return exportFiles.filter((file) => file === fileName).length === 1;
  });

  if (relevantExports.length > 0) {
    return new NoopChange();
  }

  // no such export declaration exists
  let fallbackPos = findNodes(rootNode, ts.SyntaxKind.EndOfFileToken)[0].end;

  // if there are no exports insert the export at the end of file
  const insertFirst = allExports.length === 0;
  const separator = insertFirst ? '' : ';\n';
  const toInsert = `${separator}export ${symbolName} from '${fileName}'${insertFirst ? ';\n' : ''}`;

  return insertAfterLastOccurrence(
    allExports,
    toInsert,
    fileToEdit,
    fallbackPos,
    ts.SyntaxKind.StringLiteral
  );
}

export function insertItem(
  source: ts.SourceFile,
  fileToEdit: string,
  symbolName: string
): Change {
  const rootNode = source;
  const theNodes = findNodes(rootNode, ts.SyntaxKind.ArrayLiteralExpression, 1);

  let theNode = theNodes[0];
  // We found the field but it's empty. Insert it just before the `]`.
  let position = theNode.getEnd();
  position--;

  const separator = (theNode as ts.ArrayLiteralExpression).elements.length === 0 ? '\n' : '';
  const toInsert = `${separator}  ${symbolName},\n`;

  return new InsertChange(fileToEdit, position, toInsert);
}

export function findNodes(
  node: ts.Node,
  kind: ts.SyntaxKind,
  max = Infinity
): ts.Node[] {
  if (!node || max == 0) {
    return [];
  }

  const arr: ts.Node[] = [];
  if (node.kind === kind) {
    arr.push(node);
    max--;
  }
  if (max > 0) {
    for (const child of node.getChildren()) {
      findNodes(child, kind, max).forEach((node) => {
        if (max > 0) {
          arr.push(node);
        }
        max--;
      });

      if (max <= 0) {
        break;
      }
    }
  }

  return arr;
}

export function insertAfterLastOccurrence(
  nodes: ts.Node[],
  toInsert: string,
  file: string,
  fallbackPos: number,
  syntaxKind?: ts.SyntaxKind
): Change {
  let lastItem = nodes.sort(nodesByPosition).pop();
  if (lastItem && syntaxKind) {
    lastItem = findNodes(lastItem, syntaxKind).sort(nodesByPosition).pop();
  }
  if (!lastItem && fallbackPos == undefined) {
    throw new Error(
      `tried to insert ${toInsert} as first occurence with no fallback position`
    );
  }
  const lastItemPosition: number = lastItem ? lastItem.end : fallbackPos;

  return new InsertChange(file, lastItemPosition, toInsert);
}

/**
 * Helper for sorting nodes.
 * @return function to sort nodes in increasing order of position in sourceFile
 */
function nodesByPosition(first: ts.Node, second: ts.Node): number {
  return first.pos - second.pos;
}
