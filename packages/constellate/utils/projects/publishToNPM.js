const readPkg = require('read-pkg')
const ChildProcessUtils = require('constellate-dev-utils/childProcess')
const TerminalUtils = require('constellate-dev-utils/terminal')

module.exports = function publishToNPM(project) {
  const pkgJson = readPkg.sync(project.paths.packageJson)
  if (pkgJson.private) {
    TerminalUtils.warning(`Not publishing ${project.name} as it is marked as private`)
    return Promise.resolve()
  }
  TerminalUtils.info(`Publishing ${project.name}...`)
  return ChildProcessUtils.exec('npm', ['publish'], {
    cwd: project.paths.buildRoot,
  })
}
