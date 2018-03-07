// @flow
/* eslint-disable no-use-before-define */

export type ProjectVersions = { [string]: string }

export type ProjectWatcher = {|
  start: () => void,
  stop: () => void,
|}

export type ProjectPaths = {|
  appRoot: string,
  appRootNodeModules: string,
  root: string,
  packageJson: string,
  packageLockJson: string,
  nodeModules: string,
  webpackCache: string,
|}

export type BuildPlugin = {|
  build: () => Promise<mixed>,
|}

export type CleanPlugin = {|
  clean: () => Promise<mixed>,
|}

export type DeployPath = string

export type DeployPlugin = {|
  deploy: DeployPath => Promise<mixed>,
|}

export type DevelopPlugin = {|
  develop: ProjectWatcher => Promise<mixed>,
|}

export type ProjectPlugins = {
  buildPlugin: ?BuildPlugin,
  cleanPlugin: ?CleanPlugin,
  deployPlugin: ?DeployPlugin,
  developPlugin: ?DevelopPlugin,
}

export type Project = {|
  name: string,
  config: Object,
  packageJson: Object,
  packageName: string,
  version: string,
  paths: ProjectPaths,
  plugins: ProjectPlugins,
  dependencies: Array<string>,
  devDependencies: Array<string>,
|}

export type ProjectMap = { [string]: Project }
