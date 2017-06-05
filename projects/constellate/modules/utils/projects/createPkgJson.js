const R = require('ramda')
const semver = require('semver')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const getPackageName = require('./getPackageName')
const getAllProjects = require('./getAllProjects')

module.exports = function createPkgJson(project, options = {}) {
  const compiler = project.config.compiler
  const isWebpackCompiler = compiler === 'webpack' || compiler === 'webpack-node'
  const allProjects = getAllProjects()

  const versions = process.env.NODE_ENV === 'development'
    ? // Explicity set each version as being a development version
      allProjects.reduce((acc, cur) => Object.assign(acc, { [cur.name]: '0.0.0-development' }), {})
    : options.versions || {}

  if (
    !versions ||
    !R.allPass(
      [projectName => R.find(R.equals(projectName), Object.keys(versions))],
      allProjects.map(R.prop('name')),
    )
  ) {
    TerminalUtils.error(
      'When creating a production build all version numbers should be provided for each project',
    )
    process.exit(1)
  }

  const nodeVersion = R.path(['config', 'compilerOptions', 'nodeVersion'], project)

  // Create a package.json file for the build of the project
  const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
  const buildPkgJson = Object.assign(
    {},
    {
      files: ['modules'],
    },
    sourcePkgJson,
    {
      engines: {
        node: `>=${nodeVersion || semver.major(process.versions.node)}`,
      },
      version: versions[project.name],
      dependencies: Object.assign(
        {},
        isWebpackCompiler
          ? // When doing a webpack bundled project we need to include all the npm
            // dependencies from our constellate dependencies as we will inline
            // bundle all our constellate dependencies.
            project.bundledDependencies.reduce((acc, dependencyName) => {
              const dependency = R.find(R.propEq('name', dependencyName), allProjects)
              const pkgJson = readPkg.sync(dependency.paths.packageJson, { normalize: false })
              return Object.assign(acc, pkgJson.dependencies || {})
            }, {})
          : {},
        // Add dependency references to our constellate dependencies
        project.dependencies.reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [getPackageName(dependencyName)]: `^${versions[dependencyName]}`,
            }),
          {},
        ),
        sourcePkgJson.dependencies || {},
      ),
    },
  )
  writePkg.sync(project.paths.buildRoot, buildPkgJson)
}
