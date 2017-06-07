const path = require('path')
const fs = require('fs-extra')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const getAllBundledDependencies = require('./getAllBundledDependencies')

module.exports = function linkBundledDependencies(project) {
  const allProjects = ProjectUtils.getAllProjects()

  // We need to symlink each NPM dependency of each of our bundled dependencies
  // into the node_modules dir of our project.
  getAllBundledDependencies(project).forEach((dependencyName) => {
    const dependency = allProjects[dependencyName]

    const pkgJson = readPkg.sync(dependency.paths.packageJson, { normalize: false })
    if (!pkgJson.dependencies) {
      TerminalUtils.verbose(
        `No npm dependencies to link from ${dependency.name} to ${project.name}`,
      )
      return
    }

    // TODO: What about a bundle dependencie tree?

    Object.keys(pkgJson.dependencies).forEach((npmDepName) => {
      TerminalUtils.verbose(`Linking npm dependency ${npmDepName} to ${project.name}`)
      fs.ensureSymlinkSync(
        path.resolve(dependency.paths.nodeModules, `./${npmDepName}`),
        path.resolve(project.paths.nodeModules, `./${npmDepName}`),
      )
    })
  })
}
