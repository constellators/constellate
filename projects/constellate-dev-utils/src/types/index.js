// @flow

export type CleanOptions = {
  nodeModules?: boolean,
  build?: boolean,
}

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
  clean: () => Promise<mixed>,
  outputDir: string,
|}

export type DevelopPlugin = {|
  start: ProjectWatcher => Promise<mixed>,
|}

export type DeployPath = string

export type DeployPlugin = {|
  deploy: DeployPath => Promise<mixed>,
|}

export type ProjectPlugins = {
  buildPlugin: ?BuildPlugin,
  developPlugin: ?DevelopPlugin,
  deployPlugin: ?DeployPlugin,
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
