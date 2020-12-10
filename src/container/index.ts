import { normalize, strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  branchAndMerge,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url
} from '@angular-devkit/schematics';
import { InsertChange } from '@schematics/angular/utility/change';
import * as ts from 'typescript';
import { setup } from '../setup';
import { insertExport, insertImport, insertItem } from '../utils';
import { ContainerSchema } from './schema';

export function container(options: ContainerSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setup(tree, options);

    const thePath = normalize(`/${options.path as string}/${strings.dasherize(options.module)}/containers/`);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        name: options.name
      }),
      move(thePath)
    ]);

    return chain([
      branchAndMerge(chain([addImportExport(options)])),
      mergeWith(templateSource),
    ]);
  };
}

function addImportExport(options: ContainerSchema): Rule {
  return (tree: Tree) => {
    const thePath = normalize(`/${options.path as string}/${strings.dasherize(options.module)}/containers/`);
    const theContainersBarrelFile = normalize(`${ thePath }/index.ts`);
    const theBarrelText = tree.read(theContainersBarrelFile);
    if (theBarrelText === null) {
      throw new SchematicsException(`File ${theContainersBarrelFile} does not exist.`);
    }

    const sourceText = theBarrelText.toString('utf-8');
    const theSource = ts.createSourceFile(
      theContainersBarrelFile,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const theRelativePath = `./${strings.dasherize(options.name)}/${strings.dasherize(options.name)}.component`;

    const theContainerImport = insertImport(
      theSource,
      theContainersBarrelFile,
      `${strings.classify(options.name)}Component`,
      theRelativePath,
      false
    );
    const theContainerExport = insertExport(
      theSource,
      theContainersBarrelFile,
      '*',
      theRelativePath
    );
    const theContainerArrayInsert = insertItem(
      theSource,
      theContainersBarrelFile,
      `${strings.classify(options.name)}Component`,
    );

    const changes = [
      theContainerImport,
      theContainerArrayInsert,
      theContainerExport,
    ];
    const recorder = tree.beginUpdate(theContainersBarrelFile);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    tree.commitUpdate(recorder);
    return tree;
  };
}
