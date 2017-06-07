const fs = require('fs-extra')
const R = require('ramda')
const path = require('path')
const TerminalUtils = require('../terminal')
const getPackageName = require('./getPackageName')
const getAllProjects = require('./getAllProjects')

module.exports = function linkProject(project) {
  const allProjects = getAllProjects()

  if (!project.noCompiler) {
    // We have to copy the package.json file as if we try to publish the
    // built package any symlinked files get ignored by the publish process.
    fs.copySync(project.paths.packageJson, project.paths.buildPackageJson)

    // As we are compiling the project to a seperate build directory we will
    // sym link the node_modules directories avoiding expensive re-installs /
    // copying.
    if (fs.existsSync(project.paths.nodeModules)) {
      fs.ensureSymlinkSync(project.paths.nodeModules, project.paths.buildNodeModules)
    }
  }

  const depMap = project.allDependencies.reduce((acc, dependencyName) => {
    const dependency = R.find(R.propEq('name', dependencyName), allProjects)
    const packageName = getPackageName(dependency.name)
    return Object.assign(acc, { [dependencyName]: { packageName, project: dependency } })
  }, {})

  // TODO: Move this to the webpack compiler plugins
  /*
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
  */

  // Sym link our the build root for each of the project's dependencies into the
  // node_modules directory for the project. That way our project resolved the
  // latest local build for each of it's dependencies.
  project.dependencies.forEach((dependencyName) => {
    const target = path.resolve(
      project.paths.nodeModules,
      `./${depMap[dependencyName].packageName}`,
    )
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(depMap[dependencyName].project.paths.buildRoot, target)
    TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
  })
}
