const fs = require('fs-extra')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function linkBundledDependencies(project) {
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
