import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';

export function setup(tree: Tree, options: any) {
  const workspaceConfig = tree.read('/angular.json');
  if (!workspaceConfig) {
    throw new SchematicsException('Could not find Angular workspace configuration');
  }

  // convert workspace to string
  const workspaceContent = workspaceConfig.toString();

  // parse workspace string into JSON object
  const workspace: WorkspaceSchema = JSON.parse(workspaceContent);

  if (!options.project) {
    options.project = workspace.defaultProject;
  }
  const projectName = options.project as string;
  const project = workspace.projects[projectName];
  const projectType = project.projectType === 'application' ? 'app' : 'lib';

  if (options.path === undefined) {
    options.path = `${project.sourceRoot}/${projectType}`;
  }
}
