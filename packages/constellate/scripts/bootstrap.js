const spawn = require('cross-spawn')
const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/terminal')
const AppUtils = require('../utils/app')

module.exports = function bootstrap(projects) {
  const constellateAppConfig = AppUtils.getConfig()

  const client = constellateAppConfig.packageClient != null
    ? constellateAppConfig.packageClient
    : 'npm'

  if (['npm', 'yarn'].find(R.equals(client)) == null) {
    throw new Error(
      `Unsupported packageClient specified in constellate app configuration: ${client}`
    )
  }

  const runInstall = path =>
    spawn.sync(
      // Spawn the package manager
      client,
      // Running the install command
      ['install'],
      {
        cwd: path,
        stdio: 'inherit',
      }
    )

  // First run the install command at application root
  TerminalUtils.verbose('Installing dependencies for application root')
  runInstall(process.cwd())

  // Then run install for each project
  projects.forEach((project) => {
    TerminalUtils.verbose(`Installing dependencies for ${project.name}`)
    runInstall(project.paths.root)
  })
}
