import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';
import { setup } from '../setup';
import { ModuleSchema } from './schema';

export function module(options: ModuleSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setup(tree, options);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        name: options.name
      }),
      move(normalize(options.path as string))
    ]);

    return chain([
      mergeWith(templateSource)
    ]);
  };
}
