// @flow
/* eslint-disable no-use-before-define */

export type PackageVersions = { [string]: string }

export type PackageWatcher = {|
  start: () => void,
  stop: () => void,
|}

export type PackagePaths = {|
  appRoot: string,
  appRootNodeModules: string,
  root: string,
  packageJson: string,
  packageLockJson: string,
  nodeModules: string,
  webpackCache: string,
|}

export type BuildPlugin = {|
  name: string,
  clean: () => Promise<mixed>,
  build: () => Promise<mixed>,
|}

export type DeployPath = string

export type DeployPlugin = {|
  name: string,
  deploy: DeployPath => Promise<mixed>,
|}

export type DevelopPlugin = {|
  name: string,
  develop: PackageWatcher => Promise<mixed>,
|}

export type PackagePlugins = {
  buildPlugin: ?BuildPlugin,
  deployPlugin: ?DeployPlugin,
  developPlugin: ?DevelopPlugin,
}

export type Package = {|
  name: string,
  config: Object,
  packageJson: Object,
  packageName: string,
  version: string,
  paths: PackagePaths,
  plugins: PackagePlugins,
  dependencies: Array<string>,
  devDependencies: Array<string>,
|}

export type PackageMap = { [string]: Package }
