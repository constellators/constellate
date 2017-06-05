const fs = require('fs-extra')
const R = require('ramda')
const path = require('path')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/terminal')
const getPackageName = require('./getPackageName')
const getAllProjects = require('./getAllProjects')

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
module.exports = function createSymLinks(project) {
  const compiler = project.config.compiler
  const isWebpackCompiler = compiler === 'webpack' || compiler === 'webpack-node'
  const allProjects = getAllProjects()

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
