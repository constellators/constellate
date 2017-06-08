const fs = require('fs-extra')
const path = require('path')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')

module.exports = function linkProject(project) {
  const allProjects = getAllProjects()

  if (project.compiler) {
    // We have to copy the package.json file as if we try to publish the
    // built package any symlinked files get ignored by the publish process.
    fs.copySync(project.paths.packageJson, project.paths.buildPackageJson)

    if (fs.existsSync(project.paths.nodeModules)) {
      // As we are compiling the project to a seperate build directory we will
      // sym link the node_modules directories avoiding expensive re-installs /
      // copying.
      fs.ensureSymlinkSync(project.paths.nodeModules, project.paths.buildNodeModules)
    }
  }

  // Sym link our the build root for each of the project's dependencies into the
  // node_modules directory for the project. That way our project resolved the
  // latest local build for each of it's dependencies.
  project.dependencies.forEach((dependencyName) => {
    const target = path.resolve(
      project.paths.nodeModules,
      `./${allProjects[dependencyName].packageName}`,
    )
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(allProjects[dependencyName].paths.buildRoot, target)
    TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
  })
}
