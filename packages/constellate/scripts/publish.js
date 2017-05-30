const spawn = require('cross-spawn')
const readPkg = require('read-pkg')
const terminal = require('constellate-dev-utils/terminal')
const getAppConfig = require('../app/getAppConfig')
const buildProjects = require('../projects/buildProjects')

module.exports = function publish(projects) {
  // TODO: Version number increment
  const constellateAppConfig = getAppConfig()

  return buildProjects(projects).then(() => {
    projects.forEach((project) => {
      const pkgJson = readPkg.sync(project.paths.packageJson)
      if (pkgJson.private) {
        terminal.info(`Skipping publish of ${project.name} as it is marked as private`)
        return
      }
      terminal.info(`Publishing ${project.name}`)
      spawn.sync(
        // Spawn the package manager
        'npm',
        // Running the install command
        ['publish'],
        {
          cwd: project.paths.buildRoot,
          stdio: 'inherit',
        }
      )
    })
  })
}
