const spawn = require('cross-spawn')
const terminal = require('constellate-dev-utils/terminal')
const getAppConfig = require('../app/getAppConfig')
const buildProjects = require('../projects/buildProjects')

module.exports = function bootstrap(projects) {
  const constellateAppConfig = getAppConfig()

  const client = constellateAppConfig.packageClient != null
    ? constellateAppConfig.packageClient
    : 'npm'

  projects.forEach((project) => {
    terminal.info(`Installing dependencies for ${project.name}`)
    spawn.sync(
      // Spawn a node process
      client,
      // That runs the build entry file
      ['install'],
      // Ensure that output supports color etc
      // We use pipe for the error so that we can log a header for ther error.
      {
        cwd: project.paths.root,
        stdio: 'inherit',
      },
    )
  })

  buildProjects(projects)
}
