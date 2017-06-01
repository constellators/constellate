const spawn = require('cross-spawn')
const R = require('ramda')
const terminal = require('constellate-dev-utils/terminal')
const getAppConfig = require('../app/getAppConfig')

module.exports = function bootstrap(projects) {
  const constellateAppConfig = getAppConfig()

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
  terminal.verbose('Installing dependencies for application root')
  runInstall(process.cwd())

  // Then run install for each project
  projects.forEach((project) => {
    terminal.verbose(`Installing dependencies for ${project.name}`)
    runInstall(project.paths.root)
  })
}
