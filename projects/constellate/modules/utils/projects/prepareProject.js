const fs = require('fs-extra')
const R = require('ramda')
const path = require('path')
const semver = require('semver')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const getPackageName = require('./getPackageName')
const getAllProjects = require('./getAllProjects')
const getLastVersion = require('./getLastVersion')

/**
 * Create symlinks for each of the constellate projects that are marked as
 * dependencies for this project. For us to have gotten here they should
 * have all been built already.  We can therefore symlink the build folder
 * for each respective dependency into the node_modules directory for the
 * project we are about to build. This will make sure any possible bundling
 * will succeed.
 *
 * @param  {Project} project The project
 *
 * @return {void}
 */
function createSymLinks(project) {
  const compiler = project.config.compiler
  const isWebpackCompiler = compiler === 'webpack' || compiler === 'webpack-node'
  const allProjects = getAllProjects()

  // Sym link source node_modules into build directory
  if (fs.existsSync(project.paths.nodeModules)) {
    fs.ensureSymlinkSync(project.paths.nodeModules, project.paths.buildNodeModules)
  }

  const depMap = project.allDependencies.reduce((acc, dependencyName) => {
    const dependency = R.find(R.propEq('name', dependencyName), allProjects)
    const packageName = getPackageName(dependency.name)

    // We will link the build root of our dependency to the node_modules
    // of the target project.
    const target = path.resolve(project.paths.nodeModules, `./${packageName}`)
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(dependency.paths.buildRoot, target)

    return Object.assign(acc, { [dependencyName]: { packageName, project: dependency } })
  }, {})

  if (isWebpackCompiler) {
    project.bundledDependencies.forEach((dependencyName) => {
      const dependency = depMap[dependencyName].project

      // We will symlink each npm dependency of our constellate dependencies
      // into our source node_modules
      const pkgJson = readPkg.sync(dependency.paths.packageJson, { normalize: false })
      if (!pkgJson.dependencies) {
        TerminalUtils.verbose(
          `No npm dependencies to link from ${dependency.name} to ${project.name}`,
        )
        return
      }
      Object.keys(pkgJson.dependencies).forEach((npmDepName) => {
        TerminalUtils.verbose(`Linking npm dependency ${npmDepName} to ${project.name}`)
        fs.ensureSymlinkSync(
          path.resolve(dependency.paths.nodeModules, `./${npmDepName}`),
          path.resolve(project.paths.nodeModules, `./${npmDepName}`),
        )
      })
    })
  }

  project.dependencies.forEach((dependencyName) => {
    // Sym link the node_modules directory from the project's source directory
    // into the build directory for the project. This way we don't need to
    // reinstall the dependencies.
    if (fs.existsSync(project.paths.nodeModules)) {
      fs.ensureSymlinkSync(
        project.paths.nodeModules,
        path.resolve(project.paths.buildRoot, './node_modules'),
      )
    }
    TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
  })
}

function createBuildPkgJson(project, options = {}) {
  const providedVersions = options.versions || {}

  const compiler = project.config.compiler
  const isWebpackCompiler = compiler === 'webpack' || compiler === 'webpack-node'
  const allProjects = getAllProjects()

  const versions = process.env.NODE_ENV === 'development'
    ? allProjects.reduce(
        (acc, cur) =>
          Object.assign(acc, {
            [cur.name]: providedVersions[project.name]
              ? providedVersions[project.name]
              : getLastVersion(project),
          }),
        {},
      )
    : providedVersions

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
  const newPkgJson = Object.assign({}, sourcePkgJson, {
    engines: {
      node: `>=${nodeVersion || semver.major(process.versions.node)}`,
    },
    version: versions[project.name],
    files: ['modules'],
    dependencies: Object.assign(
      {},
      // Add dependency references to our constellate dependencies
      project.dependencies.reduce(
        (acc, dependencyName) =>
          Object.assign(acc, {
            [getPackageName(dependencyName)]: `^${versions[dependencyName]}`,
          }),
        {},
      ),
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
      sourcePkgJson.dependencies || {},
    ),
  })
  writePkg.sync(project.paths.buildPackageJson, newPkgJson)
}

module.exports = function prepareProject(project, options = {}) {
  createSymLinks(project)
  createBuildPkgJson(project, { versions: options.versions })
}
