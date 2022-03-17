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
import { insertImport, insertItem } from '../utils';
import { ComponentSchema } from './schema';

export function component(options: ComponentSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setup(tree, options);

    const thePath = normalize(`/${options.path as string}/${strings.dasherize(options.module)}/components/`);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        name: options.name
      }),
      move(thePath)
    ]);

    return chain([
      branchAndMerge(chain([addImport(options)])),
      mergeWith(templateSource),
    ]);
  };
}

function addImport(options: ComponentSchema): Rule {
  return (tree: Tree) => {
    const thePath = normalize(`/${options.path as string}/${strings.dasherize(options.module)}/components/`);
    const theComponentsBarrelFile = normalize(`${ thePath }/index.ts`);
    const theBarrelText = tree.read(theComponentsBarrelFile);
    if (theBarrelText === null) {
      throw new SchematicsException(`File ${theComponentsBarrelFile} does not exist.`);
    }

    const sourceText = theBarrelText.toString('utf-8');
    const theSource = ts.createSourceFile(
      theComponentsBarrelFile,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const theRelativePath = `./${strings.dasherize(options.name)}/${strings.dasherize(options.name)}.component`;

    const theContainerImport = insertImport(
      theSource,
      theComponentsBarrelFile,
      `${strings.classify(options.name)}Component`,
      theRelativePath,
      false
    );
    const theContainerArrayInsert = insertItem(
      theSource,
      theComponentsBarrelFile,
      `${strings.classify(options.name)}Component`,
    );

    const changes = [
      theContainerImport,
      theContainerArrayInsert,
    ];
    const recorder = tree.beginUpdate(theComponentsBarrelFile);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    tree.commitUpdate(recorder);
    return tree;
  };
}
