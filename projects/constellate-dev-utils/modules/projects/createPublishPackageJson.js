const R = require('ramda')
const semver = require('semver')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')

module.exports = function createPublishPackageJson(project, versions) {
  const allProjects = getAllProjects()

  const projectHasVersion = p => R.find(R.equals(p.name), Object.keys(versions))

  if (!versions || !R.allPass([projectHasVersion], R.values(allProjects))) {
    TerminalUtils.error(
      'When creating a build for publishing all version numbers should be provided for each project',
    )
    process.exit(1)
  }

  const nodeVersion = R.path(['config', 'compilerOptions', 'nodeVersion'], project)

  const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })

  const newPkgJson = Object.assign(
    {
      version: versions[project.name],
    },
    sourcePkgJson,
    {
      version: versions[project.name],
      engines: {
        node: `>=${nodeVersion || semver.major(process.versions.node)}`,
      },
      files: ['modules'],
      dependencies: Object.assign(
        {},
        // Add dependency references to our constellate dependencies
        project.dependencies.reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [allProjects[dependencyName].packageName]: `^${versions[dependencyName]}`,
            }),
          {},
        ),
        // TODO: Move to respective webpack plugin
        /*
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
          */
        sourcePkgJson.dependencies || {},
      ),
    },
  )

  writePkg.sync(project.paths.packageJson, newPkgJson)
}
