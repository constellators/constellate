const spawn = require('cross-spawn')
const R = require('ramda')
const terminal = require('constellate-dev-utils/terminal')
const getAppConfig = require('../app/getAppConfig')
const buildProjects = require('../projects/buildProjects')

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

  projects.forEach((project) => {
    terminal.info(`Installing dependencies for ${project.name}`)
    spawn.sync(
      // Spawn the package manager
      client,
      // Running the install command
      ['install'],
      {
        cwd: project.paths.root,
        stdio: 'inherit',
      }
    )
  })

  buildProjects(projects)
}
