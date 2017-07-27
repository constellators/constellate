const fs = require('fs-extra')
const TerminalUtils = require('../terminal')

const defaultOptions = { removePackageLock: false }

module.exports = function cleanProjects(projects, options = defaultOptions) {
  const { removePackageLock } = Object.assign({}, defaultOptions, options)

  projects.forEach((project) => {
    if (fs.existsSync(project.paths.nodeModules)) {
      TerminalUtils.verbose(`Removing node_modules for ${project.name}`)
      fs.removeSync(project.paths.nodeModules)
    }
    if (removePackageLock && fs.existsSync(project.paths.packageLockJson)) {
      TerminalUtils.verbose(`Removing package-lock.json for ${project.name}`)
      fs.removeSync(project.paths.packageLockJson)
    }
  })
}
