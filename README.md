# `ngx-architect`

This package is a simple and helpful tools for scaffolding modules, containers, and components.
Most of the util functions are based on the [@ngrx/schematics](https://www.npmjs.com/package/@ngrx/schematics) package.

### Install

Add it to your development dependencies:
- **npm**: `npm install --save-dev ngx-architect`
- **yarn**: `yarn install --save-dev ngx-architect`

----

### Scaffolding code

----

#### Module

- Interactive: `ng g ngx-architect:module`
- Non-interactive: `ng g ngx-architect:module --name ModuleName`

----

#### Container

- Interactive: `ng g ngx-architect:container`
- Non-interactive: `ng g ngx-architect:container --name MyContainer --module MyModule`

----

#### Component

- Interactive: `ng g ngx-architect:component`
- Non-interactive: `ng g ngx-architect:component --name MyComponent --module MyModule`
