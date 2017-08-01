const fs = require('fs-extra')

const TerminalUtils = require('../terminal')

const defaultOptions = {
  nodeModules: false,
  packageLock: false,
  build: false,
}

module.exports = async function cleanProject(project, options = {}) {
  const { nodeModules, packageLock, build } = Object.assign({}, defaultOptions, options)

  if (build && project.plugins.buildPlugin != null) {
    TerminalUtils.verbose(`Removing build output for ${project.name}`)
    await project.plugins.buildPlugin.clean()
  }

  if (nodeModules && fs.existsSync(project.paths.nodeModules)) {
    TerminalUtils.verbose(`Removing node_modules for ${project.name}`)
    fs.removeSync(project.paths.nodeModules)
  }

  if (packageLock && fs.existsSync(project.paths.packageLockJson)) {
    TerminalUtils.verbose(`Removing package-lock.json for ${project.name}`)
    fs.removeSync(project.paths.packageLockJson)
  }
}
